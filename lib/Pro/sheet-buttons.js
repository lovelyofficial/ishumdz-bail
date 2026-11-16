/**
 * sheet-buttons.js — one-tap horizontal button → automatic list sheet (v1.0.28+)
 *
 * Classic horizontal rows cannot carry a native-flow sheet inside the SAME
 * message on current clients (that mix renders as "version doesn't support
 * it"). The working pattern is TWO messages: the horizontal row, and — when
 * the user clicks the menu button — a native-flow list sheet sent
 * automatically. This module does the second half for you:
 *
 *   const { attachSheetAutoReply } = require('ishumdz-bail')
 *
 *   attachSheetAutoReply(sock, {
 *       // click id → full sheet definition
 *       allmenus: {
 *           text: '📂 *ALL MENUS* — tap a section 👇',
 *           footer: 'ISHAN-X MD PRO',
 *           buttonText: '📂 open menu',
 *           highlightLabel: '⭐ MAIN',
 *           sectionTitle: 'All Menus',
 *           rows: [
 *               { title: '📥 Download Menu', description: 'Downloaders', rowId: '.downloadmenu' },
 *               { title: '✨ AI Menu',       description: 'AI commands', rowId: '.aimenu' }
 *           ]
 *       },
 *       // or a shorthand: rewrite the click into another command
 *       support: '.owner'
 *   })
 *
 * Now a horizontal row can stay 100% plain (guaranteed one-line render):
 *
 *   await sock.sendMessage(jid, {
 *       location: { degreesLatitude: 0, degreesLongitude: 0,
 *                   name: 'ISHAN-X MD PRO', address: '📂 Select Menu 👇' },
 *       text: menuText, footer,
 *       buttons: [
 *           { buttonText: { displayText: '📂 allmenus' }, buttonId: 'allmenus', type: 1 },
 *           { buttonText: { displayText: '👤 owner' },    buttonId: 'owner',    type: 1 }
 *       ]
 *   })
 *
 * User taps "allmenus" → the sheet opens instantly, and your own
 * messages.upsert handler is NOT called for that click (consumed).
 * A shorthand entry rewrites the click into the given command text and
 * lets your normal command parser handle it.
 */

// Decode any button / sheet-row / list-row click into its id (same bridge
// the examples use, now shipped with the library).
export function decodeButtonClick(msg) {
    // classic horizontal quick-reply buttons
    const classic = msg?.message?.buttonsResponseMessage?.selectedButtonId
    if (classic) return classic

    // native flow (sheet rows / card quick replies)
    const nf = msg?.message?.interactiveResponseMessage?.nativeFlowResponseMessage
    if (nf?.paramsJson) {
        try {
            const p = JSON.parse(nf.paramsJson)
            return p.id || p.selectedId || p.selected_row_id || null
        } catch { /* ignore */ }
    }

    // classic listMessage rows
    const list = msg?.message?.listResponseMessage?.singleSelectReply?.selectedRowId
    if (list) return list

    return null
}

const normalizeRows = (rows) => (rows || []).map(r => ({
    title: r.title,
    ...(r.description ? { description: r.description } : {}),
    id: r.rowId ?? r.id ?? r.title
}))

const buildSections = (entry) => {
    if (Array.isArray(entry.sections) && entry.sections.length) {
        return entry.sections.map(s => ({
            ...(s.title ? { title: s.title } : {}),
            ...(s.highlight_label || s.highlightLabel ? { highlight_label: s.highlight_label || s.highlightLabel } : {}),
            rows: normalizeRows(s.rows)
        }))
    }
    return [{
        title: entry.sectionTitle || entry.buttonText || 'Menu',
        ...(entry.highlightLabel ? { highlight_label: entry.highlightLabel } : {}),
        rows: normalizeRows(entry.rows)
    }]
}

const normalizeHandlers = (handlers) => {
    const sheets = {}
    const commands = {}
    for (const [id, val] of Object.entries(handlers || {})) {
        if (typeof val === 'string') {
            commands[id] = val
        } else if (val && (Array.isArray(val.rows) || Array.isArray(val.sections))) {
            sheets[id] = val
        }
    }
    return { sheets, commands }
}

/**
 * Manually send a native-flow list sheet (the tap-to-open menu).
 * attachSheetAutoReply calls this for you on a matching click.
 */
export async function sendSheet(sock, jid, entry, quoted) {
    const sections = buildSections(entry)
    return sock.sendMessage(jid, {
        text: entry.text || '📋 Select an option 👇',
        ...(entry.footer ? { footer: entry.footer } : {}),
        nativeFlow: true,
        buttons: [{
            buttonText: { displayText: entry.buttonText || '☰ menu' },
            buttonId: entry.buttonId || 'sheet',
            type: 1,
            sections
        }]
    }, quoted ? { quoted } : {})
}

/**
 * Register automatic sheet replies on a socket.
 *
 * @param {object} sock     the makeWASocket() instance
 * @param {object} handlers map of clickId → sheet definition { text?, footer?,
 *                          buttonText?, sectionTitle?, highlightLabel?, rows|sections }
 *                          OR clickId → '.command' string shorthand
 * @returns {Function} uninstall — restores the original sock.ev.on
 */
export function attachSheetAutoReply(sock, handlers) {
    const { sheets, commands } = normalizeHandlers(handlers)

    async function handleUpsert(payload) {
        const { messages, type } = payload || {}
        if (type !== 'notify' || !Array.isArray(messages)) return false
        for (const msg of messages) {
            if (!msg?.message || msg.key?.fromMe) continue
            const clicked = decodeButtonClick(msg)
            if (!clicked) continue

            // 1) full sheet definition → send the sheet, consume the click
            const entry = sheets[clicked]
            if (entry) {
                try {
                    await sendSheet(sock, msg.key.remoteJid, { ...entry, buttonId: clicked }, msg)
                } catch (e) {
                    try { sock.logger?.error?.({ err: e }, 'sheet auto-reply failed') } catch { /* ignore */ }
                }
                return true
            }

            // 2) command shorthand → rewrite into normal command text for the parser
            const cmd = commands[clicked]
            if (cmd) {
                msg.message = { conversation: cmd }
                return false
            }
        }
        return false
    }

    // Wrap the user's messages.upsert registration so the sheet fires first
    // and consumed clicks never reach the bot's command parser.
    const origOn = sock.ev.on.bind(sock.ev)
    sock.ev.on = function (ev, handler) {
        if (ev === 'messages.upsert') {
            return origOn(ev, async (...args) => {
                const consumed = await handleUpsert(args[0]).catch(() => false)
                if (consumed) return true
                return handler(...args)
            })
        }
        return origOn(ev, handler)
    }

    return () => { sock.ev.on = origOn }
}
