/**
 * Sample: .ping command → image + horizontal buttons reply (ishumdz-bail)
 *
 * WhatsApp la epdi varum:
 *   ┌─────────────────────────┐
 *   │      [IMG BANNER]       │
 *   ├─────────────────────────┤
 *   │ *Pong 9 Ms* ⚡          │
 *   │ ⏱️ Uptime: 12m          │
 *   │ ISHAN-X MD PRO          │
 *   ├─────────────────────────┤
 *   │  ☰ menu  │  🔍 owner   │  ← horizontal buttons
 *   └─────────────────────────┘
 *
 * Run: node examples/ping-buttons.js
 * QR scan pannitu, bot ku ".ping" anupunga.
 */

const {
    makeWASocket,
    useMultiFileAuthState,
    classifyDisconnect
} = require('ishumdz-bail')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')

    const sock = makeWASocket({
        auth: state,
        syncFullHistory: false,
        aiLabel: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'open') console.log('✅ Bot connected — send .ping to test')
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
        const text = (
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ''
        ).trim()

        // ─────────────────────────────────────────────
        // .ping → image caption + horizontal buttons
        // ─────────────────────────────────────────────
        if (text === '.ping') {
            // latency: message timestamp vs now (approx round-trip)
            const pingMs = Math.max(1, Date.now() - Number(msg.messageTimestamp) * 1000)
            const uptimeMin = Math.floor(process.uptime() / 60)

            await sock.sendMessage(jid, {
                // image: local file, URL, or Buffer — ellam support
                image: { url: './media/ping-banner.jpg' },
                caption: `*Pong ${pingMs} Ms* ⚡\n⏱️ Uptime: ${uptimeMin}m`,
                footer: 'ISHAN-X MD PRO',
                buttons: [
                    { buttonText: { displayText: '☰ menu' },  buttonId: 'menu',  type: 1 },
                    { buttonText: { displayText: '🔍 owner' }, buttonId: 'owner', type: 1 }
                ]
            }, { quoted: msg })
            return
        }

        // ─────────────────────────────────────────────
        // Button click response handling
        // (native flow → interactiveResponseMessage;
        //  classic → buttonsResponseMessage)
        // ─────────────────────────────────────────────
        let clickedId = null

        const btnResp = msg.message.buttonsResponseMessage
        if (btnResp?.selectedButtonId) {
            clickedId = btnResp.selectedButtonId
        }

        const nativeResp = msg.message.interactiveResponseMessage?.nativeFlowResponseMessage
        if (!clickedId && nativeResp?.paramsJson) {
            try {
                clickedId = JSON.parse(nativeResp.paramsJson).id
            } catch { /* ignore */ }
        }

        if (clickedId === 'menu') {
            await sock.sendMessage(jid, {
                text: '📋 *MENU*\n\n• .ping — speed test\n• .owner — contact'
            }, { quoted: msg })
        } else if (clickedId === 'owner') {
            await sock.sendMessage(jid, {
                text: '👑 *Owner:* wa.me/91XXXXXXXXXX'
            }, { quoted: msg })
        }
    })
}

startBot()
