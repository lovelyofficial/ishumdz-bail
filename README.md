<div align="center">

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
║  │ └─ RPS               │ └─ Get Results       │ ├─ sendPresence        │  ║
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

<br/>

```
     ██╗  ██╗██████╗  █████╗ ███████╗████████╗
     ██║  ██║██╔══██╗██╔══██╗██╔════╝╚══██╔══╝
     ███████║██████╔╝███████║███████╗   ██║   
     ██╔══██║██╔══██╗██╔══██║╚════██║   ██║   
     ██║  ██║██████╔╝██║  ██║███████║   ██║   
     ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   

              WhatsApp Web API Fork
                    By Lovely ❤️
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

## 🚀 Installation

```bash
npm install ishumdz-bail
```

---

## ⚡ Quick Start

```javascript
const { makeWASocket, useMultiFileAuthState, attachProMethods } = require('ishumdz-bail');

const { state, saveCreds } = await useMultiFileAuthState('auth_info');

const sock = makeWASocket({
    auth: state,
    syncFullHistory: false,
    aiLabel: true,
});

attachProMethods(sock);

sock.ev.on('creds.update', saveCreds);

sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') {
        console.log('✅ Connected!');
    }
});
```

---

## 🎮 Games

```javascript
const { blackjack, slotMachine, diceGame, coinFlip, roulette, rps, trivia, createMines } = require('ishumdz-bail');

// 🃏 Blackjack
const bj = blackjack('start', [], [], 100);
// bj.playerHand, bj.dealerHand, bj.status

// 🎰 Slots
const slots = slotMachine(100);
// slots.reels, slots.payout

// 🎲 Dice
const dice = diceGame(100, 'high');
// dice.total, dice.dice1, dice.dice2

// 🪙 Coin Flip
const flip = coinFlip(100, 'heads');
// flip.result, flip.payout

// 🎡 Roulette
const spin = roulette(100, 'red');
// spin.number, spin.color

// ✊ Rock Paper Scissors
const game = rps('rock');
// game.playerChoice, game.botChoice, game.result

// 🧠 Trivia
const q = trivia(100);
// q.question, q.options, q.answer

// 💣 Mines
const mines = createMines(5, 5, 5);
const tile = revealTile(mines, 0, 0);
const cashout = cashoutMines(mines, 100);
```

---

## 📞 VoIP Caller

```javascript
const { makeWASocket, enableCallAutoAnswer, getActiveVoipClient } = require('ishumdz-bail');

const sock = makeWASocket({ auth: state });

// Auto-answer calls with audio
sock.enableCallAutoAnswer({
    audio: './welcome.wav',
    autoAnswer: true,
    answerDelayMs: 200,
    durationMs: 60000,
    loop: true
});

// Manual call handling
sock.ev.on('call', async ([call]) => {
    if (call.status === 'offer') {
        await sock.rejectCall(call.id, call.from);
    }
});
```

---

## ⚡ Pro Methods

```javascript
const { makeWASocket, attachProMethods } = require('ishumdz-bail');

const sock = makeWASocket({ auth: state });
attachProMethods(sock); // Attach all 34 Pro methods
```

### 📊 Polls

```javascript
await sock.sendPoll(jid, { name: 'Vote?', values: ['Yes', 'No'] });
await sock.sendPollVote(jid, pollMsg, ['Yes']);
const votes = sock.getAggregatePollVotes(pollMsg);
```

### 📢 Newsletter/Channels

```javascript
await sock.channelVote('https://whatsapp.com/channel/xxx', 1);
await sock.newsletterReact(jid, serverId, '👍');
const msgs = await sock.newsletterGetMessages(jid, 50);
const results = await sock.newsletterSearch('tech');
const channels = await sock.newsletterList();
```

### 🟢 Status/Stories

```javascript
await sock.sendStatusText('Hello!', { backgroundColor: '#25D366' });
await sock.sendStatusMedia('./photo.jpg', { type: 'image' });
await sock.reactStatus(key, '❤️');
```

### 💬 Chat

```javascript
await sock.editMessage(jid, key, 'Updated!');
await sock.deleteMessage(jid, key);
await sock.pinMessage(jid, key, 86400);
await sock.starMessage(jid, key, true);
await sock.reactMessage(jid, key, '😂');
await sock.sendPresence(jid, 'composing');
await sock.reply(jid, 'Reply!', quotedMsg);
```

### 👥 Groups

```javascript
const info = await sock.groupGetInviteInfo('https://chat.whatsapp.com/xxx');
await sock.groupJoinViaInvite('https://chat.whatsapp.com/xxx');
await sock.groupSetAnnouncement(jid, true);
await sock.groupSetLocked(jid, true);
const requests = await sock.groupRequestParticipantsList(jid);
await sock.groupApproveParticipants(jid, [user1]);
await sock.groupRejectParticipants(jid, [user2]);
```

### 👤 Profile

```javascript
const check = await sock.checkNumber('1234567890');
await sock.setBio('My bot');
await sock.updateProfileName('Bot Name');
await sock.setProfilePicture(jid, './avatar.jpg');
await sock.removeProfilePicture(jid);
await sock.rejectCall(callId, callFrom);
```

---

## 📰 Newsletter Media Paths

```javascript
const { NEWSLETTER_MEDIA_PATH_MAP } = require('ishumdz-bail');

// All paths for channel uploads
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

## 📋 All Features List

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE FEATURE LIST                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎮 GAMES (8 functions)                                                    │
│  ├── blackjack(action, playerHand, dealerHand, bet)                        │
│  ├── slotMachine(bet)                                                      │
│  ├── diceGame(bet, prediction)                                             │
│  ├── coinFlip(bet, choice)                                                 │
│  ├── roulette(bet, choice)                                                 │
│  ├── rps(choice)                                                           │
│  ├── trivia(bet)                                                           │
│  ├── createMines(rows, cols, mineCount)                                    │
│  ├── revealTile(game, row, col)                                            │
│  └── cashoutMines(game, bet)                                               │
│                                                                             │
│  📞 VOIP (3 functions)                                                     │
│  ├── VoipClient                                                            │
│  ├── ActiveCall                                                             │
│  ├── AudioFeeder                                                            │
│  ├── VideoFeeder                                                            │
│  ├── enableCallAutoAnswer(sock, options)                                   │
│  └── getActiveVoipClient()                                                 │
│                                                                             │
│  ⚡ PRO METHODS (34 functions)                                              │
│  ├── sendPoll(jid, pollData)                                               │
│  ├── sendPollVote(jid, pollKey, options)                                   │
│  ├── getAggregatePollVotes(pollMsg)                                        │
│  ├── channelVote(target, option)                                           │
│  ├── newsletterVoteMessage(jid, serverId, option)                          │
│  ├── newsletterReact(jid, serverId, reaction)                              │
│  ├── newsletterGetMessages(jid, count)                                     │
│  ├── newsletterSearch(query)                                               │
│  ├── newsletterList()                                                      │
│  ├── sendStatusText(text, options)                                         │
│  ├── sendStatusMedia(media, options)                                       │
│  ├── readStatus(key)                                                       │
│  ├── reactStatus(key, emoji)                                               │
│  ├── editMessage(jid, key, text)                                           │
│  ├── deleteMessage(jid, key)                                               │
│  ├── pinMessage(jid, key, duration)                                        │
│  ├── unpinMessage(jid, key)                                                │
│  ├── starMessage(jid, key, star)                                           │
│  ├── reactMessage(jid, key, emoji)                                         │
│  ├── sendPresence(jid, presence)                                           │
│  ├── reply(jid, text, quoted)                                              │
│  ├── checkNumber(phone)                                                    │
│  ├── setBio(text)                                                          │
│  ├── updateProfileName(name)                                               │
│  ├── setProfilePicture(jid, content)                                       │
│  ├── removeProfilePicture(jid)                                             │
│  ├── rejectCall(callId, callFrom)                                          │
│  ├── groupGetInviteInfo(code)                                              │
│  ├── groupJoinViaInvite(code)                                              │
│  ├── groupSetAnnouncement(jid, bool)                                       │
│  ├── groupSetLocked(jid, bool)                                             │
│  ├── groupRequestParticipantsList(jid)                                     │
│  ├── groupApproveParticipants(jid, participants)                           │
│  ├── groupRejectParticipants(jid, participants)                            │
│  └── attachProMethods(sock)                                                │
│                                                                             │
│  📰 NEWSLETTER (8 functions)                                                │
│  ├── NEWSLETTER_MEDIA_PATH_MAP                                              │
│  ├── newsletterFetchMessages(jid, count, since, after)                     │
│  ├── newsletterMetadata(type, query)                                       │
│  ├── newsletterReactMessage(jid, serverId, reaction)                       │
│  ├── newsletterUpdate(jid, settings)                                       │
│  ├── newsletterCreate(name, description)                                   │
│  ├── newsletterDelete(jid)                                                 │
│  └── newsletterFollow(jid)                                                 │
│                                                                             │
│  📊 POLL VOTING (1 function)                                                │
│  └── getAggregateVotesInPollMessage(pollMsg)                               │
│                                                                             │
│  🎯 CORE (10+ functions)                                                    │
│  ├── makeWASocket(config)                                                  │
│  ├── useMultiFileAuthState(dir)                                            │
│  ├── makeCacheableSignalKeyStore(state, logger)                            │
│  ├── DisconnectReason                                                       │
│  ├── delay(ms)                                                              │
│  ├── proto                                                                   │
│  ├── encodeBinaryNode(frame)                                                │
│  ├── decodeBinaryNode(buffer)                                               │
│  ├── jidDecode(jid)                                                         │
│  └── jidEncode(user, server)                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 License

MIT License

---

<div align="center">

**Made with ❤️ by Lovely**

[![npm](https://img.shields.io/badge/npm-ishumdz--bail-25D366?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/ishumdz-bail)
[![GitHub](https://img.shields.io/badge/GitHub-lovelyofficial-FF4500?style=for-the-badge&logo=github&logoColor=white)](https://github.com/lovelyofficial/ishumdz-bail)

</div>
