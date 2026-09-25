/**
 * Classifies a WhatsApp disconnect status code into an actionable category,
 * so reconnect logic can react appropriately instead of treating every
 * disconnect the same way.
 *
 * Ported from a third-party fork's `antiban.js` (CommonJS) to ESM, with one
 * correction: status 515 (restartRequired) is WhatsApp's normal signal that
 * a fresh socket needs to reconnect right after pairing/registration — it is
 * NOT a fatal, non-recoverable state. Treating it as fatal (shouldReconnect:
 * false) would cause bots to stop entirely on a disconnect they were always
 * expected to recover from automatically.
 *
 * @param {number} statusCode
 * @returns {{
 *   category: 'fatal' | 'recoverable' | 'rate-limited' | 'unknown',
 *   shouldReconnect: boolean,
 *   backoffMs?: number,
 *   message: string,
 *   code: number
 * }}
 */
export function classifyDisconnect(statusCode) {
    // Normalize to number: upstream callers may pass the code as a string
    // (e.g. from Boom.output.statusCode or a parsed attribute), and a
    // strict `===` comparison would silently fall through to "unknown"
    // for a perfectly known code like "408".
    const code = typeof statusCode === 'string' ? Number(statusCode) : statusCode;

    if (code === 401 || code === 440) {
        return {
            category: 'fatal',
            shouldReconnect: false,
            message: 'Logged out — restart with QR code required',
            code
        };
    }
    if (code === 515) {
        // FIXED: WhatsApp uses 515 to signal "restart the socket now", which
        // is a normal, expected part of the connection lifecycle (e.g. right
        // after pairing). It should reconnect, not be treated as fatal.
        return {
            category: 'recoverable',
            shouldReconnect: true,
            backoffMs: 0,
            message: 'Restart required by WhatsApp — reconnect immediately with a fresh socket',
            code
        };
    }
    if (code === 405) {
        return {
            category: 'fatal',
            shouldReconnect: false,
            message: 'Method not allowed — server rejected connection method',
            code
        };
    }
    if (code === 409 || code === 428) {
        return {
            category: 'fatal',
            shouldReconnect: false,
            message: 'Connection replaced — another device took over',
            code
        };
    }
    if (code === 412) {
        return {
            category: 'recoverable',
            shouldReconnect: true,
            backoffMs: 30000,
            message: 'Precondition failed — auth state mismatch, retry after delay',
            code
        };
    }
    if (code === 429) {
        return {
            category: 'rate-limited',
            shouldReconnect: true,
            backoffMs: 300000,
            message: 'Rate limited by WhatsApp — cool-off period required',
            code
        };
    }
    if (code === 503) {
        return {
            category: 'rate-limited',
            shouldReconnect: true,
            backoffMs: 60000,
            message: 'WhatsApp service unavailable — temporary outage',
            code
        };
    }
    if (code === 408) {
        return {
            category: 'recoverable',
            shouldReconnect: true,
            backoffMs: 5000,
            message: 'Connection timeout — network issue, safe to retry',
            code
        };
    }
    if (code === 500) {
        return {
            category: 'recoverable',
            shouldReconnect: true,
            backoffMs: 10000,
            message: 'WhatsApp internal error — temporary server issue',
            code
        };
    }
    if (code === 1000) {
        return {
            category: 'recoverable',
            shouldReconnect: true,
            backoffMs: 2000,
            message: 'Connection closed gracefully — safe to reconnect',
            code
        };
    }
    return {
        category: 'unknown',
        shouldReconnect: true,
        backoffMs: 15000,
        message: `Unknown disconnect reason (code ${code}) — reconnect with caution`,
        code
    };
}
