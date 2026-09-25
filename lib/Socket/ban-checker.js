import {
    USyncQuery,
    USyncUser
} from '../WAUSync/index.js';

// ────────────────────────────────────────────────────────────────────────
// PASQUA BAN CHECKER API — 4-factor WhatsApp ban-status detection
// ────────────────────────────────────────────────────────────────────────
//
// Usage:
//   const result = await sock.checkBanStatus('1234567890');
//   // or with @s.whatsapp.net suffix:
//   const result = await sock.checkBanStatus('1234567890@s.whatsapp.net');
//
// Returned shape:
//   {
//     status : 'ACTIVE' | 'PROFILE_HIDDEN' | 'LIKELY_ACTIVE' | 'BANNED' |
//              'OFF_WHATSAPP' | 'UNKNOWN',
//     emoji  : '🟢' | '🟡' | '🔴' | '❓',
//     confidence : 0..1,
//     deviceCount: number | null,      // identity-key probe result
//     registryExists: boolean | null,  // sock.onWhatsApp result
//     pageVisible: boolean | null,     // public send-page profile probe
//     profileName: string | null       // display name if visible
//   }
//
// THE FOUR FACTORS (all exercised against WhatsApp's own servers):
//   Factor A — Live registry        (sock.onWhatsApp)
//   Factor B — Public send-page     (og:title / og:image on api.whatsapp.com)
//   Factor C — Identity-key device  (USync device-protocol probe — the
//                strongest signal: banned numbers have their keys destroyed)
//   Factor D — Device-count signature
//        2+ devices          → real multi-device account → ACTIVE
//        1 device + generic  → stale key mid-deletion → BANNED
//        0 devices           → keys fully garbage-collected → BANNED/OFF-WHATSAPP
//        null (probe failed) → falls back to Factors A + B

// ── Number normalization ───────────────────────────────────────────────
export function normalizeJidTarget(input) {
    if (!input) return null;
    let num = String(input).replace(/[^0-9+]/g, '');
    if (!num) return null;
    if (num.startsWith('+')) num = num.slice(1);
    if (num.endsWith('@s.whatsapp.net')) {
        num = num.replace('@s.whatsapp.net', '');
    }
    if (num.length < 8 || num.length > 15) return null;
    return num;
}

// ── Factor B: public send-page profile probe ───────────────────────────
// Active account → og:title carries the display name
//                  AND og:image points to their profile picture (pps.whatsapp.net)
// Banned/offline → generic "Share on WhatsApp" title
//                  AND og:image is WhatsApp's default avatar (static.whatsapp.net)
const DEFAULT_AVATAR_DOMAIN = 'static.whatsapp.net';
const OWN_AVATAR_DOMAIN = 'pps.whatsapp.net';

export async function probeSendPage(num, fetchImpl) {
    const impl = fetchImpl || globalThis.fetch;
    if (!impl) return { ok: false, generic: null, title: null, hasOwnPic: false };
    // Retry twice: WhatsApp's edge servers can return the generic page
    // momentarily even for active numbers (eventual-consistency blip).
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await impl(
                `https://api.whatsapp.com/send?phone=${encodeURIComponent(num)}&type=phone_number&app_absent=0`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                    signal: AbortSignal.timeout(15000),
                }
            );
            const html = await res.text();

            // Decode the title (WhatsApp encodes fancy fonts as HTML entities)
            const raw = ((html.match(/property="og:title" content="([^"]*)"/i) || [])[1] || '');
            const title = raw.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
            const generic = /share on whatsapp/i.test(title);

            const avatar = ((html.match(/property="og:image" content="([^"]*)"/i) || [])[1] || '');
            const hasOwnPic = !generic && new RegExp(OWN_AVATAR_DOMAIN, 'i').test(avatar);

            // A real display name is a strong ACTIVE signal; bail early
            if (!generic) {
                return { ok: true, generic: false, title: title.trim(), hasOwnPic };
            }
            // Generic page — only consider it stable after the final retry
            if (attempt === 2) {
                return { ok: true, generic: true, title: null, hasOwnPic: false };
            }
            // Intermediate retries: wait before re-probing
            await new Promise(r => setTimeout(r, 1500));
        }
        catch (_) {
            if (attempt === 2) return { ok: false, generic: null, title: null, hasOwnPic: false };
            await new Promise(r => setTimeout(r, 1500));
        }
    }
    return { ok: false, generic: null, title: null, hasOwnPic: false };
}

// ── Factor C: identity-key (device) probe ──────────────────────────────
// The bot's own authenticated session can query any number's device list
// via USync device-protocol. A banned number's identity keys are destroyed
// on the server, so this query returns zero devices (or fails) for banned
// accounts while an active account returns its real device list.
export async function probeIdentityDevices(sock, target) {
    try {
        if (typeof sock.executeUSyncQuery !== 'function') return null;
        const q = new USyncQuery()
            .withDeviceProtocol()
            .withUser(new USyncUser().withId(target + '@s.whatsapp.net'));
        const devRes = await sock.executeUSyncQuery(q);
        if (devRes && Array.isArray(devRes.list) && devRes.list.length > 0) {
            const devInfo = devRes.list[0];
            const dl = devInfo?.devices?.deviceList || devInfo?.devices?.device_list || null;
            let devices = Array.isArray(dl) ? dl : null;
            // NOTE: devRes shape depends on fork version; if we can't parse
            // it, keep devices === null (probe failed)
            if (devices === null && devInfo && devInfo.devices) {
                const d = devInfo.devices;
                for (const k of Object.keys(d)) {
                    if (Array.isArray(d[k])) { devices = d[k]; break; }
                }
            }
            return devices === null ? null : devices.length;
        }
        // Parsed response but empty list → zero devices on the servers
        return 0;
    }
    catch (_) { /* probe failed */ }
    return null;
}

// ── Factor A: live registry ────────────────────────────────────────────
export async function probeRegistry(sock, target) {
    try {
        if (typeof sock.onWhatsApp !== 'function') return null;
        const onWA = await sock.onWhatsApp(target + '@s.whatsapp.net');
        return Array.isArray(onWA) && onWA.length > 0 && onWA[0].exists === true;
    }
    catch (_) { /* registry probe failed */ }
    return null;
}

// ── The verdict ────────────────────────────────────────────────────────
export function buildVerdict(target, { devices, registry, page }) {
    const profileName = page?.title || null;
    const pageVisible = page?.ok === true && page.generic === false;
    const pageGeneric = page?.ok === true && page.generic === true;

    // Factor C/D (identity-key probe) is the strongest signal — use it first
    if (devices !== null) {
        if (devices >= 2 && page?.ok) {
            return {
                status: 'ACTIVE', emoji: '🟢', confidence: 0.99,
                deviceCount: devices, registryExists: registry,
                pageVisible, profileName
            };
        }
        if (devices === 1 && pageGeneric) {
            // The ban-decay signature: WhatsApp removes keys lazily,
            // so a banned account often leaves ONE orphaned stale key
            // with its public profile already stripped.
            return {
                status: 'BANNED', emoji: '🔴', confidence: 0.9,
                deviceCount: devices, registryExists: registry,
                pageVisible: false, profileName: null
            };
        }
        if (devices === 1 && pageVisible) {
            // Single device + name/photo visible: rare but possible
            // (new install, no linked devices) — benefit of the doubt.
            return {
                status: 'ACTIVE', emoji: '🟢', confidence: 0.8,
                deviceCount: devices, registryExists: registry,
                pageVisible, profileName
            };
        }
        if (devices === 0 && page?.ok) {
            // Keys fully garbage-collected AND public profile gone
            return {
                status: pageGeneric ? 'BANNED' : 'OFF_WHATSAPP',
                emoji: '🔴', confidence: 0.95,
                deviceCount: devices, registryExists: registry,
                pageVisible: false, profileName: null
            };
        }
        if (devices === 0) {
            return {
                status: 'OFF_WHATSAPP', emoji: '🔴', confidence: 0.85,
                deviceCount: devices, registryExists: registry,
                pageVisible: false, profileName: null
            };
        }
    }

    // Device probe unavailable — fall back to Factors A + B
    if (page?.ok) {
        if (!pageGeneric && registry === true) {
            return {
                status: 'ACTIVE', emoji: '🟢', confidence: 0.98,
                deviceCount: null, registryExists: registry,
                pageVisible, profileName
            };
        }
        if (pageGeneric && registry === true) {
            // Account exists on the servers but its public profile is
            // invisible: privacy mode OR a fresh ban mid-deletion.
            return {
                status: 'PROFILE_HIDDEN', emoji: '🟡', confidence: 0.6,
                deviceCount: null, registryExists: registry,
                pageVisible: false, profileName: null
            };
        }
        if (pageGeneric && registry === false) {
            return {
                status: 'OFF_WHATSAPP', emoji: '🔴', confidence: 0.9,
                deviceCount: null, registryExists: registry,
                pageVisible: false, profileName: null
            };
        }
    }

    // Last resort: registry alone
    if (registry === true) {
        return {
            status: 'LIKELY_ACTIVE', emoji: '🟡', confidence: 0.55,
            deviceCount: null, registryExists: registry,
            pageVisible: false, profileName: null
        };
    }
    if (registry === false) {
        return {
            status: 'OFF_WHATSAPP', emoji: '🔴', confidence: 0.7,
            deviceCount: null, registryExists: registry,
            pageVisible: false, profileName: null
        };
    }
    return {
        status: 'UNKNOWN', emoji: '❓', confidence: 0,
        deviceCount: null, registryExists: null,
        pageVisible: null, profileName: null
    };
}

// ── The exported socket method ─────────────────────────────────────────
export const makeBanCheckerSocket = (sock) => {
    sock.checkBanStatus = async (input) => {
        const target = normalizeJidTarget(input);
        if (!target) {
            throw new Error('checkBanStatus: invalid phone number (need 8-15 digits)');
        }
        const [devices, registry, page] = await Promise.all([
            probeIdentityDevices(sock, target),
            probeRegistry(sock, target),
            probeSendPage(target)
        ]);
        return buildVerdict(target, { devices, registry, page });
    };
    return sock;
};
