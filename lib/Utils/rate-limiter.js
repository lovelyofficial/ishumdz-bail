/**
 * RateLimiter — tracks outgoing message pacing per-socket to avoid sending
 * patterns that look automated (fixed delays, bursts, identical repeated
 * content). Call `getDelay()` before sending, `record()` after sending.
 *
 * This does not send anything or touch the socket itself — it's a pure,
 * self-contained pacing calculator. Wire it into your own send path.
 *
 * Ported to ESM from a third-party fork's `antiban.js` (CommonJS). Logic is
 * unchanged from the original — only the module syntax was converted.
 */

const TIME_CONSTANTS = {
    MS_PER_SECOND: 1000,
    MS_PER_MINUTE: 60000,
    MS_PER_HOUR: 3600000,
    MS_PER_DAY: 86400000,
    BURST_RESET_MS: 30000,
    IDENTICAL_WINDOW_MS: 3600000
};

const DEFAULT_CONFIG = {
    maxPerMinute: 8,
    maxPerHour: 200,
    maxPerDay: 1500,
    minDelayMs: 1500,
    maxDelayMs: 5000,
    newChatDelayMs: 3000,
    maxIdenticalMessages: 3,
    burstAllowance: 3,
    identicalMessageWindowMs: TIME_CONSTANTS.IDENTICAL_WINDOW_MS
};

export class RateLimiter {
    config;
    messages = [];
    identicalCount = new Map();
    knownChats = new Set();
    burstCount = 0;
    lastMessageTime = 0;

    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Returns how many ms to wait before sending, or -1 if this send should
     * be blocked entirely (limit exceeded / too many identical messages).
     */
    async getDelay(recipient, content) {
        const now = Date.now();
        this.cleanup(now);
        const contentHash = this.hashContent(content);

        const dayMessages = this.messages.filter(m => now - m.timestamp < TIME_CONSTANTS.MS_PER_DAY);
        if (dayMessages.length >= this.config.maxPerDay) {
            return -1;
        }

        const hourMessages = this.messages.filter(m => now - m.timestamp < TIME_CONSTANTS.MS_PER_HOUR);
        if (hourMessages.length >= this.config.maxPerHour) {
            hourMessages.sort((a, b) => a.timestamp - b.timestamp);
            const oldestInHour = hourMessages[0];
            const delay2 = oldestInHour
                ? oldestInHour.timestamp + TIME_CONSTANTS.MS_PER_HOUR - now
                : TIME_CONSTANTS.MS_PER_HOUR;
            return Math.max(delay2, TIME_CONSTANTS.MS_PER_MINUTE);
        }

        const minuteMessages = this.messages.filter(m => now - m.timestamp < TIME_CONSTANTS.MS_PER_MINUTE);
        if (minuteMessages.length >= this.config.maxPerMinute) {
            minuteMessages.sort((a, b) => a.timestamp - b.timestamp);
            const oldestInMinute = minuteMessages[0];
            const delay2 = oldestInMinute
                ? oldestInMinute.timestamp + TIME_CONSTANTS.MS_PER_MINUTE - now
                : TIME_CONSTANTS.MS_PER_MINUTE;
            return Math.max(delay2, TIME_CONSTANTS.MS_PER_SECOND);
        }

        const tracker = this.identicalCount.get(contentHash);
        if (tracker) {
            if (now - tracker.firstSeen < this.config.identicalMessageWindowMs) {
                if (tracker.count >= this.config.maxIdenticalMessages) {
                    return -1;
                }
            }
        }

        let delay = 0;
        if (this.burstCount < this.config.burstAllowance) {
            this.burstCount++;
            delay = this.jitter(this.config.minDelayMs * 0.5, this.config.minDelayMs);
        }
        else {
            delay = this.jitter(this.config.minDelayMs, this.config.maxDelayMs);
        }

        const isInterop = recipient.endsWith('@interop');
        if (!this.knownChats.has(recipient) || isInterop) {
            delay += this.jitter(this.config.newChatDelayMs * 0.5, this.config.newChatDelayMs);
        }

        const timeSinceLast = now - this.lastMessageTime;
        if (timeSinceLast < this.config.minDelayMs) {
            delay = Math.max(delay, this.config.minDelayMs - timeSinceLast);
        }

        const typingDelay = Math.min(content.length * 30, 3000);
        delay += this.jitter(typingDelay * 0.5, typingDelay);

        return Math.round(delay);
    }

    /** Call this right after a message is actually sent. */
    record(recipient, content) {
        const now = Date.now();
        // Guard against unbounded memory growth: cleanup() is normally
        // triggered by getDelay(), but callers who only ever call record()
        // (skipping getDelay(), e.g. only using this for stats) would never
        // trim old entries otherwise. Cheap to check, only sweeps when the
        // buffer has actually grown past a day's worth of entries.
        if (this.messages.length > 0 && now - this.messages[0].timestamp > TIME_CONSTANTS.MS_PER_DAY) {
            this.cleanup(now);
        }
        const contentHash = this.hashContent(content);
        const timeSinceLast = now - this.lastMessageTime;
        if (timeSinceLast > TIME_CONSTANTS.BURST_RESET_MS) {
            this.burstCount = 0;
        }
        this.messages.push({ timestamp: now, recipient, contentHash });
        this.knownChats.add(recipient);
        this.lastMessageTime = now;

        const tracker = this.identicalCount.get(contentHash);
        if (tracker) {
            if (now - tracker.firstSeen < this.config.identicalMessageWindowMs) {
                tracker.count++;
                tracker.lastSeen = now;
            }
            else {
                this.identicalCount.set(contentHash, { count: 1, firstSeen: now, lastSeen: now });
            }
        }
        else {
            this.identicalCount.set(contentHash, { count: 1, firstSeen: now, lastSeen: now });
        }
    }

    /**
     * Combines getDelay() + record() into a single call so limits are
     * respected correctly when queuing up several messages at once (e.g.
     * `Promise.all(items.map(i => limiter.reserve(...)))` or a for-loop
     * over a batch). Calling getDelay() alone multiple times before any
     * record() will NOT see each other's pending sends — each call only
     * "counts" once you actually record() it, so a batch processed via
     * getDelay() first and record() second can burst past your configured
     * limits. reserve() closes that gap by recording immediately, so each
     * subsequent call in the same batch sees an up-to-date count.
     *
     * Returns -1 (same as getDelay) if the send should be blocked instead.
     * Only record what you will actually send: if you decide not to send
     * after getting a delay back, do not call reserve() for it.
     */
    async reserve(recipient, content) {
        const delay = await this.getDelay(recipient, content);
        if (delay === -1) {
            return -1;
        }
        this.record(recipient, content);
        return delay;
    }

    getStats() {
        const now = Date.now();
        this.cleanup(now);
        return {
            lastMinute: this.messages.filter(m => now - m.timestamp < TIME_CONSTANTS.MS_PER_MINUTE).length,
            lastHour: this.messages.filter(m => now - m.timestamp < TIME_CONSTANTS.MS_PER_HOUR).length,
            lastDay: this.messages.filter(m => now - m.timestamp < TIME_CONSTANTS.MS_PER_DAY).length,
            limits: {
                perMinute: this.config.maxPerMinute,
                perHour: this.config.maxPerHour,
                perDay: this.config.maxPerDay
            },
            knownChats: this.knownChats.size
        };
    }

    getKnownChats() {
        return this.knownChats;
    }

    /** Useful for restoring "known chat" state after a restart, so every
     * chat isn't treated as brand-new (extra delay) after every reboot. */
    restoreKnownChats(chats) {
        for (const jid of chats) {
            this.knownChats.add(jid);
        }
    }

    cleanup(now) {
        this.messages = this.messages.filter(m => now - m.timestamp < TIME_CONSTANTS.MS_PER_DAY);
        for (const [hash, tracker] of this.identicalCount.entries()) {
            if (now - tracker.lastSeen > this.config.identicalMessageWindowMs) {
                this.identicalCount.delete(hash);
            }
        }
    }

    jitter(min, max) {
        const u1 = Math.random();
        const u2 = Math.random();
        const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const normalized = (normal + 3) / 6;
        const clamped = Math.max(0, Math.min(1, normalized));
        return Math.round(min + clamped * (max - min));
    }

    hashContent(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return hash.toString(36);
    }
}
