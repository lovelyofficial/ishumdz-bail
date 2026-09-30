/**
 * start-buttons.js — ISHAN-X MD PRO `.start` demo (ishumdz-bail v1.0.27+)
 *
 * One message, four actions:
 *   ┌──────────────────────────────────┐
 *   │  👋 ISHAN-X MD PRO               │
 *   │  Select an option below 👇       │
 *   ├──────────────────────────────────┤
 *   │  ☰ menu            ← tap → LIST SHEET opens
 *   │  👑 owner          ← click → bot replies with owner card
 *   │  📋 copy number    ← one-click copy (nothing sent back)
 *   │  📢 channel        ← one-click open URL (nothing sent back)
 *   └──────────────────────────────────┘
 *
 * NOTE: when a message mixes a list sheet / copy / url button with plain
 * buttons, the library auto-upgrades it to a native-flow card (v1.0.26+) so
 * everything renders and works on current clients — the "version doesn't
 * support it" bubble can never appear.
 *
 * For a PURE horizontal one-line row use plain buttons ONLY (max 3) — see
 * `sendHorizontalRow()` below.
 *
 * Run: node examples/start-buttons.js  → then send ".start" to the bot
 */

const {
    makeWASocket,
    useMultiFileAuthState,
    classifyDisconnect
} = require('ishumdz-bail')

const OWNER_NUMBER = '+919XXXXXXXXX'   // ← change me
const CHANNEL_URL  = 'https://whatsapp.com/channel/0029V...' // ← change me

// ─────────────────────────────────────────────────────────────
// Button/row click → command text bridge (paste once, above parser)
// ─────────────────────────────────────────────────────────────
function resolveButtonResponse(msg) {
    // classic horizontal quick-reply buttons
    const classic = msg.message?.buttonsResponseMessage?.selectedButtonId
    if (classic) return classic

    // native flow (sheet rows / card quick replies)
    const nf = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage
    if (nf?.paramsJson) {
        try {
            const p = JSON.parse(nf.paramsJson)
            return p.id || p.selectedId || p.selected_row_id || null
        } catch { /* ignore */ }
    }

    // classic listMessage rows
    const list = msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId
    if (list) return list

    return null
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')

    const sock = makeWASocket({
        auth: state,
        syncFullHistory: false,
        aiLabel: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'open') console.log('✅ Bot connected — send .start to test')
        if (connection === 'close') {
            const info = classifyDisconnect(lastDisconnect?.error?.output?.statusCode)
            console.log('Disconnected:', info.message)
            if (info.shouldReconnect) setTimeout(startBot, info.backoffMs)
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        const jid = msg.key.remoteJid

        // turn any button / sheet-row tap into normal command text:
        const clicked = resolveButtonResponse(msg)
        if (clicked) msg.message = { conversation: clicked }

        const text = (
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ''
        ).trim()
        const cmd = text.replace(/^[.\/!#]/, '').toLowerCase()

        // ─────────────────────────────────────────────
        // .start → main card (menu sheet + owner + copy + channel)
        // ─────────────────────────────────────────────
        if (cmd === 'start' || cmd === 'menu') {
            await sock.sendMessage(jid, {
                text: '👋 *ISHAN-X MD PRO*\nSelect an option below 👇',
                footer: 'ISHAN-X MD PRO • ishumdz-bail',
                buttons: [
                    // 1) tap → opens the list sheet (highlighted section + rows)
                    {
                        buttonText: { displayText: '☰ menu' },
                        buttonId: 'menu', type: 1,
                        highlightLabel: '⭐ MAIN',
                        sectionTitle: 'All Menus',
                        rows: [
                            { title: '📥 Download Menu', description: 'Downloader commands', rowId: '.downloadmenu' },
                            { title: '✨ AI Menu',       description: 'AI commands',         rowId: '.aimenu' },
                            { title: '🔍 Search Menu',   description: 'Search commands',     rowId: '.searchmenu' },
                            { title: '🎮 Game Menu',     description: 'Fun & games',         rowId: '.gamemenu' }
                        ]
                    },
                    // 2) plain quick-reply → sends 'owner' back to the bot
                    { buttonText: { displayText: '👑 owner' }, buttonId: 'owner', type: 1 },
                    // 3) one-click copy → copies the number, nothing is sent back
                    { buttonText: { displayText: '📋 copy number' }, copy: OWNER_NUMBER },
                    // 4) one-click open → opens your channel, nothing is sent back
                    { buttonText: { displayText: '📢 channel' }, url: CHANNEL_URL }
                ]
            }, { quoted: msg })
            return
        }

        // ─────────────────────────────────────────────
        // owner → owner card (copy + wa.me one-click)
        // ─────────────────────────────────────────────
        if (cmd === 'owner') {
            await sock.sendMessage(jid, {
                text: '👑 *OWNER*\nISHAN-X MD PRO',
                footer: 'Tap a button 👇',
                buttons: [
                    { buttonText: { displayText: '📋 copy number' }, copy: OWNER_NUMBER },
                    { buttonText: { displayText: '💬 wa.me chat' },  url: `https://wa.me/${OWNER_NUMBER.replace(/[^0-9]/g, '')}` }
                ]
            }, { quoted: msg })
            return
        }

        // ─────────────────────────────────────────────
        // sheet row clicks → submenu text replies
        // ─────────────────────────────────────────────
        if (cmd === 'downloadmenu') {
            await sock.sendMessage(jid, {
                text: '📥 *DOWNLOAD MENU*\n\n• .ytmp3 <link>\n• .ytmp4 <link>\n• .igdl <link>\n• .fbdl <link>'
            }, { quoted: msg })
            return
        }
        if (cmd === 'aimenu') {
            await sock.sendMessage(jid, {
                text: '✨ *AI MENU*\n\n• .ai <question>\n• .img <prompt>\n• .translate <text>'
            }, { quoted: msg })
            return
        }
        if (cmd === 'searchmenu') {
            await sock.sendMessage(jid, { text: '🔍 *SEARCH MENU*\n\n• .google <q>\n• .wiki <q>\n• .ytsearch <q>' }, { quoted: msg })
            return
        }
        if (cmd === 'gamemenu') {
            await sock.sendMessage(jid, { text: '🎮 *GAME MENU*\n\n• .tictactoe @user\n• .dino\n• .chess' }, { quoted: msg })
            return
        }
    })
}

// ─────────────────────────────────────────────
// BONUS: PURE horizontal one-line row (classic).
// Plain buttons ONLY (max 3) → renders as one
// horizontal line. Clicks arrive as text via
// resolveButtonResponse (menu / owner / ping).
// ─────────────────────────────────────────────
async function sendHorizontalRow(sock, jid, quoted) {
    await sock.sendMessage(jid, {
        text: '👋 *ISHAN-X MD PRO* — Pong ⚡',
        footer: 'ISHAN-X MD PRO',
        buttons: [
            { buttonText: { displayText: '☰ menu' },  buttonId: 'menu',  type: 1 },
            { buttonText: { displayText: '👑 owner' }, buttonId: 'owner', type: 1 },
            { buttonText: { displayText: '⚡ ping' },  buttonId: 'ping',  type: 1 }
        ]
    }, { quoted })
}

startBot()
