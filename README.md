<div align="center">

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║     ██╗  ██╗██████╗  █████╗ ███████╗████████╗                    ║
║     ██║  ██║██╔══██╗██╔══██╗██╔════╝╚══██╔══╝                    ║
║     ███████║██████╔╝███████║███████╗   ██║                       ║
║     ██╔══██║██╔══██╗██╔══██║╚════██║   ██║                       ║
║     ██║  ██║██████╔╝██║  ██║███████║   ██║                       ║
║     ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝                       ║
║                                                                   ║
║     ██████╗ ██╗   ██╗██╗███████╗                                ║
║     ██╔══██╗██║   ██║██║╚══███╔╝                                ║
║     ██║  ██║██║   ██║██║  ███╔╝                                 ║
║     ██║  ██║██║   ██║██║ ███╔╝                                  ║
║     ██████╔╝╚██████╔╝██║███████╗                                ║
║     ╚═════╝  ╚═════╝ ╚═╝╚══════╝                                ║
║                                                                   ║
║              WhatsApp Web API Fork for Bots                      ║
║                  By Lovely ❤️                                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

<img src="https://i.postimg.cc/9Q6q2Pv6/IMG-20260925-WA4965.jpg" alt="ishumdz-bail" width="700" />

<br/>

[![npm](https://img.shields.io/badge/npm-ishumdz--bail-25D366?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/ishumdz-bail)
[![GitHub](https://img.shields.io/badge/GitHub-lovelyofficial/ishumdz--bail-FF4500?style=for-the-badge&logo=github&logoColor=white)](https://github.com/lovelyofficial/ishumdz-bail)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com)

**Open-source WhatsApp automation library — no browser required.**
Built on WebSocket for speed, stability, and full multi-device support.

</div>

---

## 📋 Table of Contents

- [✨ What is ishumdz-bail?](#-what-is-ishumdz-bail)
- [🚀 Installation](#-installation)
- [⚡ Quick Start](#-quick-start)
- [🎯 Features Overview](#-features-overview)
- [🎮 Games](#-games)
- [📞 VoIP Caller](#-voip-caller)
- [⚡ Pro Methods](#-pro-methods)
- [📊 Polls](#-polls)
- [📢 Newsletter/Channels](#-newsletterchannels)
- [🟢 Status/Stories](#-statusstories)
- [💬 Chat Actions](#-chat-actions)
- [👥 Group Management](#-group-management)
- [👤 Profile Management](#-profile-management)
- [📰 Newsletter Media](#-newsletter-media)
- [🔌 API Reference](#-api-reference)
- [📝 Examples](#-examples)

---

## ✨ What is ishumdz-bail?

**ishumdz-bail** is a powerful, open-source WhatsApp Web library built on top of the Baileys protocol stack — extended with features not found in any other public fork.

**Why choose ishumdz-bail?**

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ No Browser Required     │  ✅ Multi-Device Support          │
│  ✅ WebSocket Based         │  ✅ Full API Coverage             │
│  ✅ Built-in Games (8)      │  ✅ VoIP Call Answer              │
│  ✅ Pro Methods (34)        │  ✅ Newsletter/Channel Support    │
│  ✅ Active Maintenance      │  ✅ MIT Licensed                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

```bash
npm install ishumdz-bail
```

**Requirements:**
- Node.js ≥ 20
- npm or yarn

---

## ⚡ Quick Start

```javascript
const { makeWASocket, useMultiFileAuthState, attachProMethods } = require('ishumdz-bail');

const { state, saveCreds } = await useMultiFileAuthState('auth_info');

const sock = makeWASocket({
    auth: state,
    syncFullHistory: false,
    aiLabel: true,
    autoAnswer: false,
});

sock.ev.on('creds.update', saveCreds);

sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') {
        console.log('✅ Connected to WhatsApp!');
        
        // Attach Pro methods
        attachProMethods(sock);
    }
});
```

---

## 🎯 Features Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ISHUMDZ-BAIL FEATURES                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🎮 GAMES (8)        │  📞 VOIP (3)        │  ⚡ PRO METHODS (34)     │
│  ├─ Blackjack         │  ├─ VoipClient       │  ├─ sendPoll             │
│  ├─ Slots             │  ├─ ActiveCall       │  ├─ sendPollVote         │
│  ├─ Dice              │  └─ AudioFeeder      │  ├─ editMessage          │
│  ├─ Coin Flip         │                      │  ├─ deleteMessage        │
│  ├─ Roulette          │  📊 POLLS (3)       │  ├─ pinMessage           │
│  ├─ Mines             │  ├─ sendPoll         │  ├─ reactMessage         │
│  ├─ Trivia            │  ├─ sendPollVote     │  ├─ sendStatusText       │
│  └─ Rock Paper        │  └─ getAggregate     │  ├─ checkNumber          │
│     Scissors          │     Votes            │  └─ ... and more!        │
│                                                                         │
│  📢 NEWSLETTER (6)    │  🟢 STATUS (4)      │  💬 CHAT (8)            │
│  ├─ channelVote       │  ├─ sendStatusText   │  ├─ editMessage          │
│  ├─ newsletterReact   │  ├─ sendStatusMedia  │  ├─ deleteMessage        │
│  ├─ newsletterGet     │  ├─ readStatus       │  ├─ pinMessage           │
│  │   Messages         │  └─ reactStatus      │  ├─ unpinMessage         │
│  ├─ newsletterSearch  │                      │  ├─ starMessage          │
│  └─ newsletterList    │  👥 GROUPS (7)      │  ├─ sendPresence         │
│                      │  ├─ groupGetInvite   │  └─ reply                │
│  👤 PROFILE (6)      │  ├─ groupJoinVia     │                         │
│  ├─ checkNumber       │  │   Invite          │                         │
│  ├─ setBio            │  ├─ groupSet         │                         │
│  ├─ updateProfileName │  │   Announcement    │                         │
│  ├─ setProfilePicture │  ├─ groupSetLocked   │                         │
│  ├─ removeProfile     │  ├─ groupRequest     │                         │
│  │   Picture          │  │   Participants    │                         │
│  └─ rejectCall        │  ├─ groupApprove     │                         │
│                       │  │   Participants    │                         │
│                       │  └─ groupReject      │                         │
│                       │     Participants    │                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎮 Games

8 built-in games for your WhatsApp bot:

```javascript
const { blackjack, slotMachine, diceGame, coinFlip, roulette, rps, trivia, createMines } = require('ishumdz-bail');
```

### 🃏 Blackjack

```javascript
// Start a game
const game = blackjack('start', [], [], 100);
console.log(game.playerHand); // [{suit:'♠️',value:'A'}, {suit:'♥️',value:'K'}]
console.log(game.dealerHand); // [{suit:'♦️',value:'5'}, {suit:'♣️',value:'?'}]
console.log(game.status);     // 'playing'

// Hit (draw card)
const hit = blackjack('hit', game.playerHand, game.dealerHand, 100);

// Stand (end turn)
const stand = blackjack('stand', game.playerHand, game.dealerHand, 100);
console.log(stand.status);    // 'win', 'lose', or 'push'
```

### 🎰 Slots

```javascript
const slots = slotMachine(100);
console.log(slots.reels);   // ['🍒', '🍋', '🍊']
console.log(slots.payout);  // 0-500 (multiplier)
```

### 🎲 Dice

```javascript
const dice = diceGame(100, 'high'); // 'high', 'low', or specific number
console.log(dice.dice1);  // 1-6
console.log(dice.dice2);  // 1-6
console.log(dice.total);  // 2-12
console.log(dice.win);    // true/false
```

### 🪙 Coin Flip

```javascript
const flip = coinFlip(100, 'heads'); // 'heads' or 'tails'
console.log(flip.result);  // 'heads' or 'tails'
console.log(flip.payout);  // 0 or 200
```

### 🎡 Roulette

```javascript
const spin = roulette(100, 'red'); // 'red', 'black', 'green', or number
console.log(spin.number);  // 0-36
console.log(spin.color);   // 'red', 'black', or 'green'
console.log(spin.payout);  // 0-3600
```

### ✊ Rock Paper Scissors

```javascript
const game = rps('rock'); // 'rock', 'paper', or 'scissors'
console.log(game.playerChoice);  // 'rock'
console.log(game.botChoice);     // 'paper'
console.log(game.result);        // 'win', 'lose', or 'draw'
```

### 🧠 Trivia

```javascript
const question = trivia(100);
console.log(question.question);  // 'What is the capital of France?'
console.log(question.options);   // ['A) Paris', 'B) London', ...]
console.log(question.answer);    // 'A'
```

### 💣 Mines

```javascript
// Create a 5x5 grid with 5 mines
const game = createMines(5, 5, 5);
console.log(game.totalSafe);  // 20

// Reveal a tile
const tile = revealTile(game, 0, 0);
console.log(tile.safe);   // true (diamond) or false (mine)
console.log(tile.mine);   // true or false

// Cash out
const cashout = cashoutMines(game, 100);
console.log(cashout.payout);  // based on revealed tiles
```

---

## 📞 VoIP Caller

Answer incoming WhatsApp calls with audio playback:

```javascript
const { makeWASocket, enableCallAutoAnswer, getActiveVoipClient } = require('ishumdz-bail');

const sock = makeWASocket({ auth: state });

// Enable auto-answer
sock.enableCallAutoAnswer({
    audio: './welcome.wav',        // Audio file (MP3/WAV)
    autoAnswer: true,              // Auto-answer calls
    answerDelayMs: 200,            // Delay before answer
    durationMs: 60000,             // Max duration (60s)
    loop: true,                    // Loop audio
    onCall: (call) => {},          // Incoming call callback
    onAnswer: (call) => {},        // Answered callback
    onEnd: (call, reason) => {}    // Ended callback
});
```

### Manual Call Handling

```javascript
sock.ev.on('call', async ([call]) => {
    if (call.status === 'offer') {
        console.log(`📞 Incoming ${call.isVideo ? 'video' : 'voice'} call from ${call.from}`);
        
        // Reject call
        await sock.rejectCall(call.id, call.from);
        
        // Or accept with VoIP client
        const voipClient = getActiveVoipClient();
        if (voipClient?.activeCall) {
            voipClient.activeCall.accept('./audio.wav');
        }
    }
});
```

---

## ⚡ Pro Methods

34 convenience methods for easier development:

```javascript
const { makeWASocket, attachProMethods } = require('ishumdz-bail');

const sock = makeWASocket({ auth: state });
attachProMethods(sock); // Attach all Pro methods
```

---

## 📊 Polls

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

---

## 📢 Newsletter/Channels

```javascript
// Smart channel poll vote (auto-resolves links)
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

---

## 🟢 Status/Stories

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

---

## 💬 Chat Actions

```javascript
// Edit a message
await sock.editMessage(jid, messageKey, 'Updated text!');

// Delete a message
await sock.deleteMessage(jid, messageKey);

// Pin a message (86400 = 24h, 604800 = 7d, 2592000 = 30d)
await sock.pinMessage(jid, messageKey, 86400);

// Unpin a message
await sock.unpinMessage(jid, messageKey);

// Star/unstar a message
await sock.starMessage(jid, messageKey, true);

// React to a message
await sock.reactMessage(jid, messageKey, '😂');

// Send presence (typing indicator)
await sock.sendPresence(jid, 'composing');

// Quick reply with quote
await sock.reply(jid, 'This is a reply!', quotedMessage);
```

---

## 👥 Group Management

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

---

## 👤 Profile Management

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

## 📰 Newsletter Media

Upload media to channels with correct paths:

```javascript
const { NEWSLETTER_MEDIA_PATH_MAP } = require('ishumdz-bail');

console.log(NEWSLETTER_MEDIA_PATH_MAP);
// {
//   image: '/newsletter/newsletter-image',
//   video: '/newsletter/newsletter-video',
//   document: '/newsletter/newsletter-document',
//   audio: '/newsletter/newsletter-audio',
//   sticker: '/newsletter/newsletter-image',
//   gif: '/newsletter/newsletter-gif',
//   ptt: '/newsletter/newsletter-ptt',
//   ptv: '/newsletter/newsletter-ptv'
// }
```

---

## 🔌 API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `makeWASocket(config)` | Create WhatsApp socket |
| `useMultiFileAuthState(dir)` | Multi-file auth state |
| `attachProMethods(sock)` | Attach Pro methods |
| `enableCallAutoAnswer(sock, opts)` | Enable VoIP auto-answer |
| `getActiveVoipClient()` | Get active VoIP client |
| `delay(ms)` | Delay execution |

### Games

| Function | Description |
|----------|-------------|
| `blackjack(action, player, dealer, bet)` | Play blackjack |
| `slotMachine(bet)` | Play slots |
| `diceGame(bet, prediction)` | Play dice |
| `coinFlip(bet, choice)` | Flip coin |
| `roulette(bet, choice)` | Play roulette |
| `rps(choice)` | Rock Paper Scissors |
| `trivia(bet)` | Play trivia |
| `createMines(rows, cols, mines)` | Create mines game |
| `revealTile(game, row, col)` | Reveal tile |
| `cashoutMines(game, bet)` | Cash out |

### Pro Methods

| Function | Description |
|----------|-------------|
| `sendPoll(jid, data)` | Create poll |
| `sendPollVote(jid, key, options)` | Vote on poll |
| `editMessage(jid, key, text)` | Edit message |
| `deleteMessage(jid, key)` | Delete message |
| `pinMessage(jid, key, duration)` | Pin message |
| `unpinMessage(jid, key)` | Unpin message |
| `starMessage(jid, key, star)` | Star message |
| `reactMessage(jid, key, emoji)` | React to message |
| `sendPresence(jid, presence)` | Send presence |
| `reply(jid, text, quoted)` | Reply with quote |
| `checkNumber(phone)` | Check WhatsApp number |
| `setBio(text)` | Update bio |
| `updateProfileName(name)` | Update name |
| `setProfilePicture(jid, content)` | Set profile pic |
| `removeProfilePicture(jid)` | Remove profile pic |
| `sendStatusText(text, options)` | Send text status |
| `sendStatusMedia(media, options)` | Send media status |
| `readStatus(key)` | Mark status as read |
| `reactStatus(key, emoji)` | React to status |
| `channelVote(target, option)` | Smart channel vote |
| `newsletterReact(jid, id, reaction)` | React to channel |
| `newsletterGetMessages(jid, count)` | Get channel messages |
| `newsletterSearch(query)` | Search channels |
| `newsletterList()` | List followed channels |
| `groupGetInviteInfo(code)` | Get group info |
| `groupJoinViaInvite(code)` | Join via invite |
| `groupSetAnnouncement(jid, bool)` | Admin-only messages |
| `groupSetLocked(jid, bool)` | Admin-only edit |
| `groupRequestParticipantsList(jid)` | Pending requests |
| `groupApproveParticipants(jid, list)` | Approve requests |
| `groupRejectParticipants(jid, list)` | Reject requests |
| `rejectCall(callId, from)` | Reject call |

---

## 📝 Examples

### Basic Bot

```javascript
const { makeWASocket, useMultiFileAuthState, attachProMethods } = require('ishumdz-bail');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });
    
    attachProMethods(sock);
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.fromMe && msg.message?.conversation) {
            const text = msg.message.conversation.toLowerCase();
            
            if (text === '!ping') {
                await sock.reply(msg.key.remoteJid, 'Pong! 🏓', msg);
            }
            
            if (text === '!slots') {
                const slots = slotMachine(100);
                await sock.reply(msg.key.remoteJid, 
                    `🎰 Slots: ${slots.reels.join(' | ')}\nPayout: ${slots.payout}`, msg);
            }
        }
    });
}

startBot();
```

### Call Auto-Answer Bot

```javascript
const { makeWASocket, useMultiFileAuthState, enableCallAutoAnswer } = require('ishumdz-bail');

async function startCallBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    
    const sock = makeWASocket({ auth: state });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') {
            sock.enableCallAutoAnswer({
                audio: './welcome.wav',
                autoAnswer: true
            });
            console.log('📞 Call bot ready!');
        }
    });
}

startCallBot();
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with ❤️ by Lovely**

[![npm](https://img.shields.io/badge/npm-ishumdz--bail-25D366?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/ishumdz-bail)
[![GitHub](https://img.shields.io/badge/GitHub-lovelyofficial-FF4500?style=for-the-badge&logo=github&logoColor=white)](https://github.com/lovelyofficial/ishumdz-bail)

</div>
