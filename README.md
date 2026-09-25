<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:ff6b6b,40:f06595,100:845ef7&text=ishu-md&fontAlignY=40&fontSize=44&fontColor=ffffff&desc=Stable%20WhatsApp%20Web%20API%20Fork%20for%20Production%20Bots&descAlignY=60&descSize=16" alt="Header Banner" />

<br/>

<!-- Rounded + border image -->
<a href="https://ishanx-pro.site.je">
  <kbd>
    <img src="https://i.ibb.co/KjfHTDhN/file-00000000a86881f8801b23682cb9bf66.png" alt="WhatsApp Baileys 2026" width="720" />
  </kbd>
</a>

<br/><br/>


# 🧑‍💻 ishu-md

<p>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Open%20Source-FF4500?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" />
</p>

<p>
  <img src="https://img.shields.io/npm/v/ishu-md?style=flat-square&color=25D366&label=npm" />
  <img src="https://img.shields.io/badge/maintained%20by-Lovely-black?style=flat-square" />
</p>

**Open-source WhatsApp automation library — no browser required.**
Built on WebSocket for speed, stability, and full multi-device support.

<br/>

[Installation](#-getting-started) • [Features](#-main-features) • [Stability](#-stability--disconnect-handling) • [Website](https://ishanx-pro.site.je) • [WhatsApp Channel](https://shyracore.indevs.in)

</div>

---

## ✨ What is ishu-md?

**ishu-md** (`ishu-md`) is a powerful, open-source WhatsApp Web library built on top of the Baileys protocol stack — extended with features not found in any other public fork. It connects directly to WhatsApp's multi-device WebSocket protocol. No Selenium, no Puppeteer, no browser overhead.

> ⚡ **Node.js ≥ 20 required.**

---

## 🚀 Getting Started

```bash
npm install ishu-md
```

```javascript
import { makeWASocket, useMultiFileAuthState } from 'ishu-md'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')
const sock = makeWASocket({
    auth: state,
    syncFullHistory: false,  // skip history sync — bot works immediately
    aiLabel: true,           // stamp messages with AI bot marker (default: true)
})

sock.ev.on('creds.update', saveCreds)
```

---

## 🧩 Main Features

| Feature | Description |
|---|---|
| 💬 **Rich Response (GenAI Bubble)** | Send Meta AI-style messages: markdown, code blocks, tables, LaTeX, maps, inline images, HTML — rendered natively as GenAI bubble in WA client |
| 🚫 **4-Factor Ban Checker** | Detect ban status via 4 independent signals: live registry, public send-page, identity-key probe, device-count signature |
| 🆔 **Username Socket (w:mex)** | Full WA username API: check availability, set, delete, pin, find by username, fetch recommendations — via WhatsApp's internal Pando/MEX GraphQL protocol |
| 🏘️ **Communities Socket** | Full community management: create, link/unlink groups, manage participants, invite codes, ephemeral toggle, approval mode |
| 🔕 **noSelfSync** | Skip syncing outgoing messages to your own other devices — reduces noise and bandwidth. Includes silent-drop guard (throws 421 instead of pretending the send succeeded) |
| ⚙️ **Rust-powered Crypto** | `md5`, `hkdf`, LT-Hash anti-tampering offloaded to `whatsapp-rust-bridge` native module for raw speed |
| 🗂️ **LID Mapping Store** | Persistent LID ↔ phone-number bi-directional cache with LRU eviction and in-flight dedup — prevents duplicate USync lookups |
| 🔐 **Pre-Key Manager** | Concurrency-safe Signal pre-key operations via per-key-type PQueue — no race conditions on key updates/deletions |
| 🔄 **Classify Disconnect** | Maps every WA disconnect code to `{ category, shouldReconnect, backoffMs }` — properly handles code 515 (restartRequired) as recoverable, not fatal |
| ⏱️ **Rate Limiter** | Anti-spam pacing calculator: enforces per-minute/hour/day caps, burst allowance, new-chat delays, identical-message dedup |
| 🖼️ **Album Message** | Send multiple images/videos as a single WA album/grid, with per-item or top-level caption and `gifPlayback` support |
| 🤖 **AI Label Config** | `aiLabel: true/false` in socket config — controls whether outgoing messages carry the `biz_bot` attribute that WA uses to render the AI icon |
| 🔎 **USync Username Protocol** | Username resolution baked into USync queries — resolve WA usernames alongside contacts in a single round-trip |
| 📥 **Offline Node Processor** | Batch-processes pending stanzas received while offline, preventing message loss on reconnect |
| 🔑 **Identity Change Handler** | Dedicated handler for Signal identity key changes — prevents session corruption when a contact re-registers |

---

## 💬 Rich Response (GenAI Bubble)

Send messages that render as Meta AI-style bubbles inside WhatsApp. Supports multiple primitives in a single message:

```javascript
// Markdown text
await sock.sendMessage(jid, {
    richResponse: {
        text: '**Hello** from *ishu-md*',
        responseId: 'optional-uuid'
    }
})

// Code block
await sock.sendMessage(jid, {
    richResponse: {
        code: 'console.log("hello")',
        language: 'javascript'
    }
})

// Table
await sock.sendMessage(jid, {
    richResponse: {
        table: {
            rows: [
                ['Name', 'Age'],
                ['Alice', '25'],
                ['Bob', '30']
            ]
        }
    }
})

// HTML (raw HTML rendered in client)
await sock.sendMessage(jid, {
    richResponse: {
        text: 'fallback',
        html: '<b>bold</b> <a href="https://example.com">link</a>'
    }
})

// LaTeX
await sock.sendMessage(jid, {
    richResponse: {
        latex: 'E = mc^2'
    }
})

// Map / location
await sock.sendMessage(jid, {
    richResponse: {
        map: {
            latitude: -6.2,
            longitude: 106.8,
            zoom: 15,
            title: 'Jakarta',
            annotations: []
        }
    }
})

// Inline image
await sock.sendMessage(jid, {
    richResponse: {
        imageUrl: 'https://example.com/photo.jpg'
    }
})
```

**Shortcut methods** (all accept `quoted` and `options`):

```javascript
await sock.sendTable(jid, 'Title', ['H1','H2'], [['A','B']], quoted)
await sock.sendList(jid, 'Title', ['item1','item2'], quoted)
await sock.sendCodeBlock(jid, 'print("hello")', quoted, { language: 'python' })
await sock.sendLatex(jid, quoted, { latex: 'x^2 + y^2 = z^2' })
await sock.sendRichMessage(jid, submessages, quoted)
```

---

## 🖼️ Album Message

Send multiple images/videos grouped into a single WA album:

```javascript
await sock.sendMessage(jid, {
    album: [
        { image: { url: 'https://example.com/a.jpg' } },
        { image: { url: 'https://example.com/b.jpg' }, caption: 'caption foto kedua' },
        { video: { url: 'https://example.com/c.mp4' }, gifPlayback: false }
    ],
    caption: 'caption ini otomatis ke item pertama'
})
```

---

## 🚫 Ban Checker

4-factor ban detection against WhatsApp's own servers — no third-party API:

```javascript
const result = await sock.checkBanStatus('628123456789')
// or: sock.checkBanStatus('628123456789@s.whatsapp.net')

console.log(result)
// {
//   status: 'ACTIVE' | 'PROFILE_HIDDEN' | 'LIKELY_ACTIVE' | 'BANNED' | 'OFF_WHATSAPP' | 'UNKNOWN',
//   emoji: '🟢' | '🟡' | '🔴' | '❓',
//   confidence: 0..1,
//   deviceCount: number | null,
//   registryExists: boolean | null,
//   pageVisible: boolean | null,
//   profileName: string | null
// }
```

**Four factors checked:**
- **Factor A** — Live registry (`sock.onWhatsApp`)
- **Factor B** — Public send-page title/image probe (`api.whatsapp.com`)
- **Factor C** — Identity-key device probe via USync (strongest: banned numbers have their keys destroyed)
- **Factor D** — Device-count signature (2+ = ACTIVE, 1 generic = likely BANNED, 0 = BANNED/OFF_WA)

---

## 🆔 Username Socket (w:mex)

Full WA `@username` API via WhatsApp's internal Pando/MEX GraphQL protocol, query IDs sourced from Java decompile of WA 2.26.17.2:

```javascript
// Check availability
const res = await sock.checkUsername('myusername')
// { available: true, username } or { available: false, suggestions: [...] }

// Set username
await sock.setUsername('myusername')

// Delete username
await sock.deleteUsername()

// Get your own username
const mine = await sock.getMyUsername()

// Pin/unpin username
await sock.setUsernamePin(true)

// Find user by username
const user = await sock.findUserByUsername('someuser', pin)

// Fetch usernames of your contacts in batch
const usernames = await sock.fetchContactUsernames('94xxxx@s.whatsapp.net', '628yyy@s.whatsapp.net')

// Get username suggestions
const suggestions = await sock.getUsernameRecommendations()
```

---

## 🏘️ Communities Socket

```javascript
// Create community
const community = await sock.communityCreate('Community Name', 'Description')

// Create group inside community
await sock.communityCreateGroup('Group Name', [jid1, jid2], communityJid)

// Link/unlink existing group
await sock.communityLinkGroup(groupJid, communityJid)
await sock.communityUnlinkGroup(groupJid, communityJid)

// Fetch linked groups
const groups = await sock.communityFetchLinkedGroups(communityJid)

// Manage participants
await sock.communityParticipantsUpdate(communityJid, [jid1], 'add')   // 'add' | 'remove' | 'promote' | 'demote'

// Invite code
const code = await sock.communityInviteCode(communityJid)
await sock.communityRevokeInvite(communityJid)
await sock.communityAcceptInvite(code)

// Settings
await sock.communityToggleEphemeral(communityJid, 86400)   // seconds
await sock.communityMemberAddMode(communityJid, 'admin_add')
await sock.communityJoinApprovalMode(communityJid, 'on')
await sock.communityUpdateSubject(communityJid, 'New Name')
await sock.communityUpdateDescription(communityJid, 'New Desc')
await sock.communityLeave(communityJid)
```

---

## 🔕 noSelfSync

Skip syncing outgoing messages to your own linked devices. Useful for high-volume bots where sync traffic is unnecessary:

```javascript
await sock.sendMessage(jid, { text: 'hello' }, { noSelfSync: true })

// Also supported in all shortcut methods:
await sock.sendTable(jid, title, headers, rows, quoted, { noSelfSync: true })
await sock.sendCodeBlock(jid, code, quoted, { noSelfSync: true })
```

> **Safe by design:** if `noSelfSync` would accidentally drop all recipients (e.g. messaging yourself), the guard kicks in and delivers normally. If the other party has zero resolved devices, it throws `Boom 421` instead of silently pretending the message was sent.

---

## 🔄 Stability & Disconnect Handling

ishu-md ships `classifyDisconnect()` — maps every WA status code into an actionable result:

```javascript
import { classifyDisconnect } from 'ishu-md'

sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode
        const info = classifyDisconnect(code)

        console.log(info)
        // {
        //   category: 'fatal' | 'recoverable' | 'rate-limited' | 'unknown',
        //   shouldReconnect: boolean,
        //   backoffMs: number,    // ms to wait before reconnecting
        //   message: string,
        //   code: number
        // }

        if (info.shouldReconnect) {
            setTimeout(() => reconnect(), info.backoffMs)
        }
    }
})
```

**Code map:**

| Code | Category | Reconnect | Backoff |
|---|---|---|---|
| 401, 440 | fatal | ❌ | — |
| 515 | recoverable | ✅ | 0 ms (immediate) |
| 405 | fatal | ❌ | — |
| 408 | recoverable | ✅ | 30 s |
| 503 | recoverable | ✅ | 5 min |
| 429 | rate-limited | ✅ | 60 s |
| 500 | recoverable | ✅ | 5 s |
| 503 | recoverable | ✅ | 10 s |
| Graceful close | recoverable | ✅ | 2 s |
| Unknown | unknown | ✅ | 15 s |

> **Important:** Code 515 (`restartRequired`) is WhatsApp's normal post-pairing signal. ishu-md correctly treats it as recoverable with 0 ms backoff — other forks incorrectly mark it as fatal, causing bots to stop after first pair.

---

## ⏱️ Rate Limiter

Anti-ban pacing calculator — wire into your send path before each `sendMessage`:

```javascript
import { RateLimiter } from 'ishu-md'

const limiter = new RateLimiter({
    maxPerMinute: 8,
    maxPerHour: 200,
    maxPerDay: 1500,
    minDelayMs: 1500,
    maxDelayMs: 5000,
    newChatDelayMs: 3000,
    maxIdenticalMessages: 3,
    burstAllowance: 3
})

async function safeSend(jid, content) {
    const delay = await limiter.getDelay(jid, content)
    if (delay === -1) throw new Error('Rate limit exceeded — blocked')
    if (delay > 0) await new Promise(r => setTimeout(r, delay))
    await sock.sendMessage(jid, content)
    limiter.record(jid, content)
}
```

---

## 📦 Supported Message Types

Every WhatsApp message type is covered:

- Text, image, video, audio, document, sticker, GIF/video note (PTV)
- Location & live location
- Contact / vCard
- Poll (create, vote, add option, poll result)
- Button, list, template, interactive (native flow)
- Album (multiple media in one message)
- Event & event invite
- Group invite, group status, group mention
- Spoiler (blurred) messages
- Reaction & edited message
- View-once media
- Status/story mention & reply
- Newsletter / channel messages
- Payment & payment invite
- All WhatsApp Business types: product, catalog, order, invoice, business profile

<details>
<summary><b>Example: Album</b></summary>

```javascript
await sock.sendMessage(jid, {
    album: [
        { image: { url: 'https://example.com/1.jpg' } },
        { video: { url: 'https://example.com/2.mp4' } }
    ],
    caption: 'Album caption'
})
```
</details>

<details>
<summary><b>Example: Poll</b></summary>

```javascript
await sock.sendMessage(jid, {
    poll: {
        name: 'Poll Title',
        values: ['Option A', 'Option B'],
        selectableCount: 1
    }
})
```
</details>

<details>
<summary><b>Example: Spoiler</b></summary>

```javascript
await sock.sendMessage(jid, {
    text: 'Spoiler content',
    spoiler: true
})
```
</details>

<details>
<summary><b>Example: Event</b></summary>

```javascript
await sock.sendMessage(jid, {
    eventMessage: {
        name: 'Meeting',
        description: 'Weekly sync',
        location: { degreesLatitude: -6.2, degreesLongitude: 106.8 },
        startTime: Math.floor(Date.now() / 1000) + 3600
    }
})
```
</details>

---

## 🛠️ Additional Methods

```javascript
// Parse incoming extended/special messages
sock.ev.on('messages.upsert', ({ messages }) => {
    const extended = sock.parseExtendedMessageContent(messages[0].message)
    if (extended) console.log(extended.type, extended.data)
})

// Business profile
const profile = await sock.getBusinessProfile(jid)
await sock.updateBusinessProfile({ description: 'Open 9-5', email: 'hi@example.com', category: 'Retail' })

// Get newsletter/channel JID from URL
await sock.newsletterId('https://whatsapp.com/channel/...')

// Refresh media URL for expired messages
await sock.updateMediaMessage(message)
```

---

## 🎮 Games

Built-in games for your WhatsApp bot! Import from `ishu-md`:

```javascript
import { 
    blackjack, slotMachine, diceGame, 
    coinFlip, roulette, rps, trivia,
    createMines, revealTile, cashoutMines 
} from 'ishu-md'
```

### 🃏 Blackjack

```javascript
// Start game
const game = blackjack('start', [], [], 1000)
await sock.sendMessage(jid, { text: game.message })

// Hit (after start)
const hit = blackjack('hit', game.playerHand, game.dealerHand, 1000)

// Stand
const stand = blackjack('stand', game)

// Double
const dbl = blackjack('double', game)
```

### 🎰 Slot Machine

```javascript
const slot = slotMachine(100)
await sock.sendMessage(jid, { text: slot.message })
// 🎰 [🍒] [🍋] [💎] - NO MATCH
```

### 🎲 Dice

```javascript
const dice = diceGame(100, 'high') // high, low, or seven
await sock.sendMessage(jid, { text: dice.message })
```

### 🪙 Coin Flip

```javascript
const coin = coinFlip(100, 'heads') // heads or tails
await sock.sendMessage(jid, { text: coin.message })
```

### 🎰 Roulette

```javascript
const rou = roulette(100, 'red') // red, black, odd, even, low, high
await sock.sendMessage(jid, { text: rou.message })
```

### ✊ Rock Paper Scissors

```javascript
const r = rps('rock') // rock, paper, scissors
await sock.sendMessage(jid, { text: r.message })
```

### 💣 Mines

```javascript
// Create game
const game = createMines(5, 5, 5) // rows, cols, mines

// Reveal tile
const result = revealTile(game, 0, 0) // row, col
await sock.sendMessage(jid, { text: result.message })

// Cashout
const cashout = cashoutMines(game, 100)
await sock.sendMessage(jid, { text: cashout.message })
```

### 🧠 Trivia

```javascript
const quiz = trivia(100)
await sock.sendMessage(jid, { text: quiz.message })

// Check answer (A, B, C, or D)
const answer = checkTriviaAnswer('B', quiz.answer, 100)
await sock.sendMessage(jid, { text: answer.message })
```

### 📱 Bot Command Example

```javascript
sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    const text = msg.message?.conversation || ''
    
    if (text === '.rps rock' || text === '.rps paper' || text === '.rps scissors') {
        const choice = text.split(' ')[1]
        const result = rps(choice)
        await sock.sendMessage(msg.key.remoteJid, { text: result.message })
    }
    
    if (text.startsWith('.slot')) {
        const bet = parseInt(text.split(' ')[1]) || 100
        const result = slotMachine(bet)
        await sock.sendMessage(msg.key.remoteJid, { text: result.message })
    }
    
    if (text.startsWith('.coinflip')) {
        const choice = text.split(' ')[1] || 'heads'
        const bet = parseInt(text.split(' ')[2]) || 100
        const result = coinFlip(bet, choice)
        await sock.sendMessage(msg.key.remoteJid, { text: result.message })
    }
})
```

---

## 📊 Poll Voting

Create polls, track votes, and display results.

### 🗳️ Create Poll

```javascript
await sock.sendMessage(jid, {
    poll: {
        name: 'Best programming language?',
        values: ['JavaScript', 'Python', 'Java', 'Go', 'Rust'],
        selectableCount: 1
    }
})
```

### 📊 Poll with Multiple Selections

```javascript
await sock.sendMessage(jid, {
    poll: {
        name: 'Which features do you want?',
        values: ['Games', 'AI', 'Stickers', 'Download'],
        selectableCount: 3 // Users can select up to 3 options
    }
})
```

### 📢 Announcement Group Poll (Admin Only Voting)

```javascript
await sock.sendMessage(groupJid, {
    poll: {
        name: 'Admin Poll',
        values: ['Option 1', 'Option 2'],
        selectableCount: 1,
        toAnnouncementGroup: true
    }
})
```

### 🏆 Poll Result (Fake Results)

```javascript
await sock.sendMessage(jid, {
    pollResult: {
        name: 'Best framework?',
        votes: [['React', 150], ['Vue', 120], ['Angular', 80]]
    }
})
```

### 📈 Track Poll Votes

```javascript
import { getAggregateVotesInPollMessage } from 'ishu-md'

// Store messages
const messageStore = new Map()

sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
        const id = msg.key.remoteJid + ':' + msg.key.id
        messageStore.set(id, msg)
    }
})

// Listen for poll votes
sock.ev.on('messages.update', async (events) => {
    for (const { key, update } of events) {
        if (update.pollUpdates) {
            const id = key.remoteJid + ':' + key.id
            const pollCreation = messageStore.get(id)
            
            if (pollCreation) {
                const votes = getAggregateVotesInPollMessage({
                    message: pollCreation,
                    pollUpdates: update.pollUpdates
                })
                
                console.log('Poll votes:', votes)
                // [{ name: 'Option 1', voters: ['123@s.whatsapp.net'] }, ...]
            }
        }
    }
})
```

### 📱 Poll Bot Command Example

```javascript
sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    const text = msg.message?.conversation || ''
    
    // .poll Question | Option1 | Option2 | Option3
    if (text.startsWith('.poll')) {
        const args = text.slice(5).split('|').map(s => s.trim())
        const question = args[0]
        const options = args.slice(1)
        
        if (question && options.length >= 2) {
            await sock.sendMessage(msg.key.remoteJid, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: 1
                }
            })
        }
    }
    
    // .pollresult React | 150 | Vue | 120
    if (text.startsWith('.pollresult')) {
        const args = text.slice(12).split('|').map(s => s.trim())
        const votes = []
        for (let i = 0; i < args.length; i += 2) {
            votes.push([args[i], parseInt(args[i + 1]) || 0])
        }
        
        await sock.sendMessage(msg.key.remoteJid, {
            pollResult: {
                name: 'Poll Results',
                votes
            }
        })
    }
})
```

---

## 🌐 Community & Support

<div align="center">

<table>
<tr>
<td align="center">
<a href="https://ishanx-pro.site.je">
🌐<br/><b>Website</b><br/>ishanx-pro.site.je
</a>
</td>
<td align="center">
<a href="https://shyracore.indevs.in">
💬<br/><b>WhatsApp Channel</b><br/>shyracore.indevs.in
</a>
</td>
</tr>
</table>

**Developer:** Lovely

</div>

---

<div align="center">

### ⭐ If this project helped you, consider giving it a star!

Made with ❤️ by **Lovely**

</div>

---

## 📄 License

MIT