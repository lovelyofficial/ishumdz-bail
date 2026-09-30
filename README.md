<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:ff6b6b,40:f06595,100:845ef7&text=ishumdz-bail&fontAlignY=40&fontSize=44&fontColor=ffffff&desc=Stable%20WhatsApp%20Web%20API%20Fork%20for%20Production%20Bots&descAlignY=60&descSize=16" alt="Header Banner" />

<br/>

<!-- Rounded + border image -->
<a href="https://ishanx-pro.site.je">
  <kbd>
    <img src="https://i.postimg.cc/9Q6q2Pv6/IMG-20260925-WA4965.jpg" alt="WhatsApp Baileys 2026" width="720" />
  </kbd>
</a>

<br/><br/>


# 🧑‍💻 ishumdz-bail

<p>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Open%20Source-FF4500?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" />
</p>

<p>
  <img src="https://img.shields.io/npm/v/ishumdz-bail?style=flat-square&color=25D366&label=npm" />
  <img src="https://img.shields.io/badge/maintained%20by-Lovely-black?style=flat-square" />
</p>

**Open-source WhatsApp automation library — no browser required.**
Built on WebSocket for speed, stability, and full multi-device support.

<br/>

[Installation](#-getting-started) • [Features](#-main-features) • [Stability](#-stability--disconnect-handling) • [Website](https://ishanx-pro.site.je) • [WhatsApp Channel](https://shyracore.indevs.in)

</div>

---

## ✨ What is ishumdz-bail?

**ishumdz-bail** (`ishumdz-bail`) is a powerful, open-source WhatsApp Web library built on top of the Baileys protocol stack — extended with features not found in any other public fork. It connects directly to WhatsApp's multi-device WebSocket protocol. No Selenium, no Puppeteer, no browser overhead.

> ⚡ **Node.js ≥ 20 required.**

---

## 🚀 Getting Started

```bash
npm install ishumdz-bail
```

```javascript
import { makeWASocket, useMultiFileAuthState } from 'ishumdz-bail'

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
| 🔘 **Horizontal Buttons** | Modern native-flow buttons that render on ALL clients — text, image, video, GIF headers + classic location map-card style + automatic group conversion |
| 🤖 **AI Label Config** | `aiLabel: true/false` in socket config — controls whether outgoing messages carry the `biz_bot` attribute that WA uses to render the AI icon |
| 🔎 **USync Username Protocol** | Username resolution baked into USync queries — resolve WA usernames alongside contacts in a single round-trip |
| 📥 **Offline Node Processor** | Batch-processes pending stanzas received while offline, preventing message loss on reconnect |
| 🔑 **Identity Change Handler** | Dedicated handler for Signal identity key changes — prevents session corruption when a contact re-registers |
| 📣 **Newsletter/Channel Media Upload** | Full support for uploading images, videos, audio, stickers to channels using correct `/newsletter/newsletter-*` paths |
| 😀 **Newsletter Reactions** | React to channel messages with emojis, track votes, and manage newsletter engagement |
| 📊 **Poll Voting** | Create polls, track encrypted votes, display results, and support multiple selection polls |
| 🎮 **Built-in Games** | 8 text games (Blackjack, Slots, Dice, Coin Flip, Roulette, Mines, Trivia, RPS) + 6 live HTML games (Chess, Tic Tac Toe, Connect Four, 2048, Snake, Memory) playable inside chat |
| 📞 **VoIP Caller** | Answer incoming calls with audio playback using WASM VoIP engine |
| ⚡ **Pro Methods** | 34 convenience methods: Polls, Newsletter, Status, Chat, Groups, Profile |

---

## 📞 VoIP Caller (Call Answer + Audio)

Answer incoming WhatsApp calls and play audio automatically:

```javascript
const { makeWASocket, enableCallAutoAnswer } = require('ishumdz-bail');

const sock = makeWASocket({ auth: state });

// Enable auto-answer with audio playback
sock.enableCallAutoAnswer({
    audio: './welcome.wav',      // Audio file to play (MP3/WAV)
    autoAnswer: true,            // Auto-answer incoming calls
    answerDelayMs: 200,          // Delay before answering
    durationMs: 60000,           // Max call duration (60s)
    loop: true,                  // Loop audio
    onCall: (call) => {},        // Callback on incoming call
    onAnswer: (call) => {},      // Callback when answered
    onEnd: (call, reason) => {}  // Callback when ended
});
```

**Manual call handling:**
```javascript
sock.ev.on('call', async ([call]) => {
    if (call.status === 'offer') {
        // Reject call
        await sock.rejectCall(call.id, call.from);
        
        // Or accept with VoIP client
        const voipClient = getActiveVoipClient();
        if (voipClient) {
            const activeCall = voipClient.activeCall;
            activeCall.accept('./audio.wav');
        }
    }
});
```

---

## ⚡ Pro Methods

34 convenience methods attached to socket via `attachProMethods()`:

```javascript
const { makeWASocket, attachProMethods } = require('ishumdz-bail');

const sock = makeWASocket({ auth: state });
attachProMethods(sock); // Attach all Pro methods
```

### 📊 Polls Pro

```javascript
// Create a poll
await sock.sendPoll(jid, {
    name: 'What is your favorite color?',
    values: ['Red', 'Blue', 'Green', 'Yellow'],
    selectableCount: 1
});

// Vote on a poll
await sock.sendPollVote(jid, pollMessage, ['Red']);

// Get poll results
const votes = sock.getAggregatePollVotes(pollMessage);
```

### 📢 Newsletter/Channel Pro

```javascript
// Smart channel poll vote (auto-resolves links, IDs)
await sock.channelVote('https://whatsapp.com/channel/xxx/123', 1);

// React to channel post
await sock.newsletterReact(channelJid, serverId, '👍');

// Get channel messages (decoded)
const messages = await sock.newsletterGetMessages(channelJid, 50);

// Search channels
const results = await sock.newsletterSearch('technology');

// List followed channels
const channels = await sock.newsletterList();
```

### 🟢 Status/Stories Pro

```javascript
// Send text status
await sock.sendStatusText('Hello World!', {
    backgroundColor: '#25D366',
    font: 1
});

// Send media status
await sock.sendStatusMedia('./photo.jpg', {
    type: 'image',
    caption: 'My status!'
});

// React to status
await sock.reactStatus(statusKey, '❤️');
```

### 💬 Chat Pro

```javascript
// Edit a message
await sock.editMessage(jid, messageKey, 'Updated text!');

// Delete a message
await sock.deleteMessage(jid, messageKey);

// Pin a message (24h, 7d, or 30d)
await sock.pinMessage(jid, messageKey, 86400); // 24 hours

// Star/unstar a message
await sock.starMessage(jid, messageKey, true);

// React to a message
await sock.reactMessage(jid, messageKey, '😂');

// Send presence (typing indicator)
await sock.sendPresence(jid, 'composing');

// Quick reply with quote
await sock.reply(jid, 'This is a reply!', quotedMessage);
```

### 👥 Groups Pro

```javascript
// Get group info from invite link
const info = await sock.groupGetInviteInfo('https://chat.whatsapp.com/xxx');

// Join group via invite
await sock.groupJoinViaInvite('https://chat.whatsapp.com/xxx');

// Set announcement mode (admin only)
await sock.groupSetAnnouncement(groupJid, true);

// Set locked mode (admin only)
await sock.groupSetLocked(groupJid, true);

// Manage join requests
const requests = await sock.groupRequestParticipantsList(groupJid);
await sock.groupApproveParticipants(groupJid, [participant1, participant2]);
await sock.groupRejectParticipants(groupJid, [participant3]);
```

### 👤 Profile Pro

```javascript
// Check if number exists on WhatsApp
const result = await sock.checkNumber('1234567890');
console.log(result.exists); // true/false

// Update bio
await sock.setBio('Hello, I am a bot!');

// Update display name
await sock.updateProfileName('My Bot');

// Set profile picture
await sock.setProfilePicture(jid, './avatar.jpg');

// Remove profile picture
await sock.removeProfilePicture(jid);
```

---

## 🎮 Built-in Games

8 fun games for your WhatsApp bot:

```javascript
const { blackjack, slotMachine, diceGame, coinFlip, roulette, rps, trivia, createMines } = require('ishumdz-bail');

// Blackjack
const game = blackjack('start', [], [], 100); // Start with 100 bet
// game.playerHand, game.dealerHand, game.status

// Slots
const slots = slotMachine(100);
// slots.reels, slots.payout

// Dice
const dice = diceGame(100, 'high'); // Bet on high (7-12)
// dice.total, dice.dice1, dice.dice2

// Coin Flip
const flip = coinFlip(100, 'heads');
// flip.result, flip.payout

// Roulette
const spin = roulette(100, 'red');
// spin.number, spin.color, spin.payout

// Rock Paper Scissors
const game = rps('rock');
// game.playerChoice, game.botChoice, game.result

// Trivia
const question = trivia(100);
// question.question, question.options, question.answer

// Mines
const mines = createMines(5, 5, 5); // 5x5 grid, 5 mines
const tile = revealTile(mines, 0, 0); // Reveal tile at (0,0)
// tile.safe, tile.mine
const cashout = cashoutMines(mines, 100); // Cash out
// cashout.payout
```

## 💬 Rich Response (GenAI Bubble)

Send messages that render as Meta AI-style bubbles inside WhatsApp. Supports multiple primitives in a single message:

```javascript
// Markdown text
await sock.sendMessage(jid, {
    richResponse: {
        text: '**Hello** from *ishumdz-bail*',
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

## 🔘 Horizontal Buttons (Interactive Messages)

> ⚡ **How it renders:** the `buttons` API sends the **classic ButtonsMessage** — the
> only format WhatsApp renders as a true **horizontal button row**. Modern clients
> render it when the message has a **header** (image / video / GIF / location map-card).
> A **location header needs no media upload** — coordinates alone give the big map
> card + horizontal row, and a **custom image or GIF** works with one media upload.
> Set `{ nativeFlow: true }` for vertical native-flow quick_reply buttons instead.

### Button Types — Quick Reference

| Button property           | Tap behavior                                  | Since   |
| ------------------------- | --------------------------------------------- | ------- |
| `buttonId` + `buttonText` | Quick reply — sends the id back to your bot   | v1.0.19 |
| `rows` / `sections`       | Opens a highlighted list sheet on tap         | v1.0.22 |
| `url`                     | Opens the link / WhatsApp channel immediately | v1.0.23 |
| `copy`                    | Copies the code to the clipboard              | v1.0.23 |
| `call`                    | Opens the dialer with the number              | v1.0.23 |

All of them mix freely in one message and render as a single horizontal row
(when the message has a header) — see the full example below.

### Text + Horizontal Buttons (location header = zero uploads)

```javascript
await sock.sendMessage(jid, {
    location: { degreesLatitude: 9.9312, degreesLongitude: 76.2673 }, // simple map card
    text: 'Pong 9 Ms ⚡\nDeveloper: ISHAN-X × LOVELY',
    footer: 'ISHAN-X MD PRO',
    buttons: [
        { buttonText: { displayText: 'menu' },  buttonId: 'menu',  type: 1 },
        { buttonText: { displayText: 'owner' }, buttonId: 'owner', type: 1 }
    ]
})
```

### Custom Pic / GIF + Horizontal Buttons

```javascript
// Image header (one media upload, then horizontal row)
await sock.sendMessage(jid, {
    image: { url: './banner.jpg' },
    caption: 'Welcome!',
    footer: 'My Bot',
    buttons: [
        { buttonText: { displayText: 'menu' },  buttonId: 'menu',  type: 1 },
        { buttonText: { displayText: 'owner' }, buttonId: 'owner', type: 1 }
    ]
})

// Animated GIF header
await sock.sendMessage(jid, {
    gif: { url: './animation.gif' },
    caption: 'Live preview!',
    buttons: [ /* ... */ ]
})

// Video header (gifPlayback = loop like a GIF)
await sock.sendMessage(jid, {
    video: { url: './clip.mp4' },
    gifPlayback: true,
    caption: 'Watch this',
    buttons: [ /* ... */ ]
})
```

### Location Map-Card + Buttons (custom name/address)

```javascript
await sock.sendMessage(jid, {
    location: {
        degreesLatitude: 9.9312,
        degreesLongitude: 76.2673,
        name: 'ISHAN-X MD PRO',           // bold title under the map
        address: 'Select an option below', // 📍 subtitle
        // jpegThumbnail: buffer — custom map image (optional)
    },
    text: 'Pong 9 Ms ⚡',
    buttons: [ /* ... */ ]
})
```

### Tap-to-Open List Sheet (rows on a button) — v1.0.22+

Give any horizontal button a `rows` or `sections` array and **tapping it opens a
highlighted list sheet** — the same sheet classic `listMessage` shows, with section
titles, a `highlight_label` badge and row descriptions:

```javascript
await sock.sendMessage(jid, {
    image: { url: './banner.jpg' },       // or gif / location / video header
    caption: 'Pong 9 Ms ⚡',
    footer: 'ISHAN-X MD PRO',
    buttons: [
        { buttonText: { displayText: '☰ menu' },  buttonId: 'menu',  type: 1 },
        { buttonText: { displayText: '🔍 owner' }, buttonId: 'owner', type: 1 },
        // 📂 this button opens the sheet on tap:
        {
            buttonText: { displayText: '📂 allmenus' },
            buttonId: 'allmenus', type: 1,
            highlightLabel: '⭐ MAIN',       // optional — badge on the section
            sectionTitle: 'All Menus',       // optional — section heading
            rows: [
                { title: '📥 Download Menu', description: 'Downloader commands', rowId: '.downloadmenu' },
                { title: '✨ AI Menu',       description: 'AI commands',        rowId: '.aimenu' }
            ]
        },
        // multiple sections? pass `sections` instead of `rows`:
        {
            buttonText: { displayText: '⚙️ settings' }, buttonId: 'settings', type: 1,
            sections: [
                { title: 'Main', highlight_label: '⭐ MAIN', rows: [ /* ... */ ] },
                { title: 'More', rows: [ /* ... */ ] }
            ]
        }
    ]
})
```

**How it works:**

- `rows` — single-section shortcut (optional `sectionTitle` and `highlightLabel` on the button)
- `sections` — full control: multiple sections, each with its own `title` and `highlight_label`
- Each row accepts `{ title, description?, rowId }` (`id` also works)
- Tapping a row sends back an `interactiveResponseMessage` — parse its `paramsJson`
  for the row id (the click bridge below handles this)
- Works in both layouts: the classic horizontal row (with header) and `{ nativeFlow: true }` vertical

### One-Click Action Buttons (URL / Copy / Call) — v1.0.23+

Give a button a `url`, `copy` or `call` value and it becomes a **one-click action
button** — tapping performs the action directly instead of sending a reply back
to your bot (opens a link/channel, copies a code, opens the dialer):

```javascript
await sock.sendMessage(jid, {
    image: { url: './banner.jpg' },   // location / gif / video header um ok
    caption: 'Pong 9 Ms ⚡',
    footer: 'ISHAN-X MD PRO',
    buttons: [
        { buttonText: { displayText: '☰ menu' }, buttonId: 'menu', type: 1 },
        // 📢 one tap → channel/page opens:
        { buttonText: { displayText: '📢 Channel' }, url: 'https://whatsapp.com/channel/0029V...' },
        // 🎁 one tap → code copies to clipboard:
        { buttonText: { displayText: '🎁 Voucher' }, copy: 'ISHAN2026' },
        // 📞 one tap → dialer opens:
        { buttonText: { displayText: '📞 Call Owner' }, call: '919999999999' },
        // a tap-to-open sheet button can share the same message:
        { buttonText: { displayText: '📂 allmenus' }, buttonId: 'allmenus',
          highlightLabel: '⭐ MAIN', rows: [ /* ... */ ] }
    ]
})
```

**How it works:**

- `url` → native-flow `cta_url` (WhatsApp channel link, website, wa.me — anything)
- `copy` → `cta_copy` (coupon codes, voucher codes, pairing codes)
- `call` → `cta_call` (phone number including country code)
- Plain buttons + sheet buttons + action buttons all mix in **one horizontal row**
- Action buttons never send a reply to your bot — nothing to handle in `messages.upsert`
- Works in groups too — the group auto-converter preserves the native-flow names

### Text-only (TEXT header, best-effort) & native flow escape hatch

```javascript
// text-only: TEXT headerType — some clients still show the row vertically;
// for a guaranteed horizontal row attach image/gif/location as above.
await sock.sendMessage(jid, {
    text: 'Pong 9 Ms ⚡', footer: 'ISHAN-X',
    buttons: [ { buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 } ]
})

// vertical native-flow quick_reply buttons (renders on all modern clients)
await sock.sendMessage(jid, {
    text: 'Menu?', nativeFlow: true,
    buttons: [ { buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 } ]
})
```

### Full Example — Everything in One Message

A complete bot reply: location map-card header, a plain quick-reply, a highlighted
list-sheet button and a one-click channel button — all in one horizontal row:

```javascript
await sock.sendMessage(jid, {
    location: {
        degreesLatitude: 9.9312,
        degreesLongitude: 76.2673,
        name: 'ISHAN-X MD PRO',
        address: 'Select an option below'
    },
    text: 'Pong 9 Ms ⚡\nDeveloper: ISHAN-X × LOVELY',
    footer: 'ISHAN-X MD PRO',
    buttons: [
        // 1) plain quick-reply → sends 'menu' back to your bot
        { buttonText: { displayText: '☰ menu' }, buttonId: 'menu', type: 1 },
        // 2) tap-to-open highlighted list sheet
        {
            buttonText: { displayText: '📂 allmenus' },
            buttonId: 'allmenus', type: 1,
            highlightLabel: '⭐ MAIN',
            sectionTitle: 'All Menus',
            rows: [
                { title: '📥 Download Menu', description: 'Downloader commands', rowId: '.downloadmenu' },
                { title: '✨ AI Menu',       description: 'AI commands',         rowId: '.aimenu' }
            ]
        },
        // 3) one-click action → opens your channel, nothing is sent back
        { buttonText: { displayText: '📢 Channel' }, url: 'https://whatsapp.com/channel/0029V...' }
    ]
}, { quoted: msg })
```

> ⚠️ **Limit:** the classic horizontal row renders up to **3 buttons** per message on
> most clients. Need more? Use `{ nativeFlow: true }` for a vertical layout that
> supports more buttons, or split across two messages.

### Handling Button Clicks

Button and row taps arrive in `messages.upsert`. Three shapes are possible:
classic quick replies → `buttonsResponseMessage`, native-flow taps (sheet rows and
vertical quick replies) → `interactiveResponseMessage`, classic list rows →
`listResponseMessage`. This one bridge converts all three into a plain command id —
drop it above your command parser so every existing case keeps working:

```javascript
function resolveButtonResponse(msg) {
    // classic horizontal quick-reply buttons
    const classic = msg.message?.buttonsResponseMessage?.selectedButtonId
    if (classic) return classic

    // native flow: sheet rows and vertical quick replies
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

sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    // turn any button / row tap into normal command text:
    const clicked = resolveButtonResponse(msg)
    if (clicked) msg.message = { conversation: clicked }

    // your existing command parser keeps working untouched:
    // switch (command) { case 'menu': ... case 'owner': ... }
})
```

Action buttons (`url` / `copy` / `call`) never send a reply — nothing to handle here.

> **Notes**
> - **Groups:** `listMessage` / `buttonsMessage` / `templateMessage` are auto-converted
>   to interactive native flow on send — and buttons that carry a native-flow action
>   (list sheet, URL, copy, call) are preserved as-is, so sheets and one-click
>   actions work in groups too (v1.0.23+).
> - **Client support:** modern Android / iOS / Business clients render everything on
>   this page. WhatsApp Web and very old clients may show only the vertical
>   native-flow layout.
> - **Media headers:** one media header per message (image, GIF or video). The
>   location map card needs **no media upload at all**.
> - Full working demos: [`examples/ping-buttons.js`](examples/ping-buttons.js)
>   (`.ping` → image + horizontal buttons + click handling) and
>   [`examples/menu-buttons.js`](examples/menu-buttons.js)
>   (`.menu` → custom image/GIF + buttons + highlighted menu sheet), plus a visual
>   preview in [`banner-preview.html`](banner-preview.html).

### Base Compatibility — cantarella / Case X Style Code (v1.0.27+)

Code copied from other Baileys bases (cantarella-baileys, Case X Plugin YOUHU MD, etc.)
runs without changes. Three shapes are accepted:

**1) Raw `buttonsMessage` classic menu card — even the risky mix.** A raw classic
message that mixes `nativeFlowInfo` (single_select sheet) or `cta_*` buttons with
plain buttons is **auto-upgraded to a native-flow interactive card**, so it can never
render the "version doesn't support it" bubble:

```javascript
// Case X / cantarella style — works as-is:
await sock.sendMessage(jid, {
    buttonsMessage: {
        locationMessage: { degreesLatitude: 0, degreesLongitude: 0, name: 'Youhu base', address: '📍Today' },
        contentText: menuText, footerText: footer, headerType: 6,
        buttons: [
            { buttonId: 'menu', buttonText: { displayText: '☰ menu' }, type: 1,
              nativeFlowInfo: { name: 'single_select', paramsJson: JSON.stringify({
                  title: 'Pilih Menu',
                  sections: [{ title: 'base', highlight_label: '🔥', rows: [{ title: 'ping', description: 'live', id: '/ping' }] }]
              }) } },
            { buttonId: 'sc', buttonText: { displayText: '⌕ script' }, type: 1 }
        ]
    }
})
```

**2) Raw `interactiveMessage` native-flow card — straight through `sendMessage`.**
No `generateWAMessageFromContent` + `relayMessage` dance needed (though that still
works too). `messageVersion` defaults to 1:

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        body: { text: 'Pairing code: 1234-5678' },
        footer: { text: 'Tap to copy' },
        header: { hasMediaAttachment: false },
        nativeFlowMessage: {
            buttons: [{ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy', copy_code: '12345678' }) }]
        }
    }
})

// short form also accepted:
await sock.sendMessage(jid, { interactiveMessage: { buttons: [{ name: 'quick_reply', buttonParamsJson: '{"display_text":"hi","id":"hi"}' }] } })
```

**3) Plain raw `buttonsMessage`** (no native-flow extras) stays classic and gets the
automatic invisible-PNG header when you omit one. Flow params are accepted as
`paramsJson` or `buttonParamsJson`, and `single_select` / `cta_url` / `cta_copy` /
`cta_call` / `quick_reply` names are preserved as-is.

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

ishumdz-bail ships `classifyDisconnect()` — maps every WA status code into an actionable result:

```javascript
import { classifyDisconnect } from 'ishumdz-bail'

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

> **Important:** Code 515 (`restartRequired`) is WhatsApp's normal post-pairing signal. ishumdz-bail correctly treats it as recoverable with 0 ms backoff — other forks incorrectly mark it as fatal, causing bots to stop after first pair.

---

## ⏱️ Rate Limiter

Anti-ban pacing calculator — wire into your send path before each `sendMessage`:

> ⚡ **Fixed in this fork:** `RateLimiter` and `classifyDisconnect` are now properly
> exported from the package root (the files existed but were never re-exported).

```javascript
import { RateLimiter } from 'ishumdz-bail'

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

Built-in games for your WhatsApp bot! Import from `ishumdz-bail`:

```javascript
import { 
    blackjack, slotMachine, diceGame, 
    coinFlip, roulette, rps, trivia,
    createMines, revealTile, cashoutMines 
} from 'ishumdz-bail'
```

### 🕹️ Live HTML Games (playable inside chat!)

Send fully interactive games that render as **Meta AI style live HTML cards** inside WhatsApp (GenAI HTML primitive) — board, AI opponent, score tracking, all running client-side in the chat window. English UI.

```javascript
import {
    sendChess,        // ♚ Chess vs AI (minimax)
    sendTicTacToe,    // 🎮 Tic Tac Toe vs AI (unbeatable)
    sendConnectFour,  // 🔴 Connect Four vs AI (minimax depth 4)
    send2048,         // 🔢 2048 swipe puzzle
    sendSnake,        // 🐍 Snake (swipe + arrow keys)
    sendMemory,       // 🧩 Memory Match (8 emoji pairs)
    sendHtmlGame      // ⭐ send ANY custom HTML game
} from 'ishumdz-bail'

// One line each:
await sendChess(sock, m.chat)
await sendTicTacToe(sock, m.chat)
await sendConnectFour(sock, m.chat)
await send2048(sock, m.chat)
await sendSnake(sock, m.chat)
await sendMemory(sock, m.chat)
```

Bot command example:

```javascript
const games = {
    chess: sendChess, ttt: sendTicTacToe, c4: sendConnectFour,
    '2048': send2048, snake: sendSnake, memory: sendMemory
}

// inside messages.upsert handler:
const cmd = text.replace('.', '').toLowerCase()
if (games[cmd]) await games[cmd](sock, msg.key.remoteJid)
```

Custom game (your own HTML):

```javascript
await sendHtmlGame(sock, jid, '<style>...</style><body>...<script>/* your game */</script></body>', '🎯 My Game')
```

> ℹ️ Requires a WhatsApp client that supports GenAI HTML cards (recent Android/iOS). Older clients and WhatsApp Web will not render the card.

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
import { getAggregateVotesInPollMessage } from 'ishumdz-bail'

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

## 🚀 Hosting / Troubleshooting (OptikLink, Pterodactyl, etc.)

If `npm install` fails on bot hosting panels (OptikLink, Pterodactyl, etc.), these are
the most common reasons:

### ❌ `npm error code EALLOWGIT`

```
npm error Fetching packages of type "git" have been disabled
npm error Refusing to fetch "libsignal@git+ssh://git@github.com/..."
```

**Reason:** npm v12+ (and most bot hosts) disable `git:`-type package fetches by default.
Older ishumdz-bail versions (< 1.0.20) used `"libsignal": "github:tenka-san/libsignal-node"`
as a dependency — hosts that block git fetches refuse to install it.

**Fix:** use **ishumdz-bail v1.0.20 or later** — libsignal is now pulled from the
npm registry (`libsignal-node`), no git fetch needed:

```bash
npm install ishumdz-bail@latest
```

If you must stay on an older version and your host allows it, enable git fetching:

```bash
npm config set allow-git=all
```

### ❌ `Error: Cannot find module 'dotenv'`

This error comes from **your bot's `index.js`**, not from the library — your bot code
does `require('dotenv')` but `dotenv` is not in the bot's `package.json` dependencies.

**Fix:** add it and reinstall:

```bash
npm install dotenv
```

### ✅ Deploy checklist for restricted hosts

1. `ishumdz-bail` **v1.0.20+** in `package.json` (no git deps inside)
2. `dotenv` (and every other module your bot requires) listed in your **bot's** `package.json`
3. Run `npm install` from the bot folder (not global), then `npm start`
4. If the host still blocks git deps, check `npm ls` output for any `github:` entries

---

## 📄 License

MIT

---

## 📱 Full Feature Overview

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         📱 MAIN FEATURES                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │ 🎮 GAMES            │ 📞 VOIP CALLER      │ ⚡ PRO METHODS         │  ║
║  │ ├─ Blackjack         │ ├─ Auto Answer       │ ├─ sendPoll            │  ║
║  │ ├─ Slots             │ ├─ Audio Playback    │ ├─ sendPollVote        │  ║
║  │ ├─ Dice              │ └─ VoipClient        │ ├─ editMessage         │  ║
║  │ ├─ Coin Flip         │                     │ ├─ deleteMessage        │  ║
║  │ ├─ Roulette          │ 📊 POLLS            │ ├─ pinMessage          │  ║
║  │ ├─ Mines             │ ├─ Create Poll       │ ├─ starMessage         │  ║
║  │ ├─ Trivia            │ ├─ Vote Poll         │ ├─ reactMessage        │  ║
║  │ ├─ RPS               │ └─ Get Results       │ ├─ sendPresence        │
║  │ └─ +6 HTML Games     │                      │                        │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │ 📢 NEWSLETTER       │ 🟢 STATUS            │ 💬 CHAT               │  ║
║  │ ├─ channelVote       │ ├─ sendText           │ ├─ editMessage        │  ║
║  │ ├─ newsletterReact   │ ├─ sendMedia          │ ├─ deleteMessage      │  ║
║  │ ├─ getMessages       │ ├─ readStatus         │ ├─ pinMessage         │  ║
║  │ ├─ searchChannels    │ └─ reactStatus        │ ├─ unpinMessage       │  ║
║  │ └─ listChannels      │                     │ ├─ starMessage        │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │ 👥 GROUPS            │ 👤 PROFILE           │ 📰 MEDIA             │  ║
║  │ ├─ Get Invite Info   │ ├─ checkNumber        │ ├─ Newsletter Paths   │  ║
║  │ ├─ Join via Invite   │ ├─ setBio             │ ├─ Image Upload       │  ║
║  │ ├─ Set Announcement  │ ├─ updateName         │ ├─ Video Upload       │  ║
║  │ ├─ Set Locked        │ ├─ setProfilePic      │ ├─ Audio Upload       │  ║
║  │ ├─ Request List      │ ├─ removeProfilePic   │ ├─ Document Upload    │  ║
║  │ ├─ Approve           │ └─ rejectCall         │ └─ Sticker Upload     │  ║
║  │ └─ Reject            │                     │                     │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  ✅ No Browser Required  ✅ Multi-Device  ✅ WebSocket Based             ║
║  ✅ Active Maintenance   ✅ MIT License   ✅ Full API Coverage           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```
