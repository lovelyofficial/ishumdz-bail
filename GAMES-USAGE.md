# 🎮 Live HTML Games — ishumdz-bail

All games render as **Meta AI style live HTML cards** inside WhatsApp chat (sandboxed WebView). Fully client-side — no server state needed. All English UI.

## Quick usage (one line each)

```js
import {
    sendChess,        // ♚ Chess vs AI (minimax depth 3)
    sendTicTacToe,    // 🎮 Tic Tac Toe vs AI (unbeatable minimax)
    sendConnectFour,  // 🔴 Connect Four vs AI (minimax depth 4)
    send2048,         // 🔢 2048 puzzle (swipe)
    sendSnake,        // 🐍 Snake (swipe + arrow keys)
    sendMemory        // 🧩 Memory Match (8 emoji pairs)
} from 'ishumdz-bail';

// Simple usage:
await sendChess(sock, m.chat);
await sendTicTacToe(sock, m.chat);
await sendConnectFour(sock, m.chat);
await send2048(sock, m.chat);
await sendSnake(sock, m.chat);
await sendMemory(sock, m.chat);
```

## Bot plugin example (.chess, .ttt, .c4, .2048, .snake, .memory)

```js
import { sendChess, sendTicTacToe, sendConnectFour, send2048, sendSnake, sendMemory } from 'ishumdz-bail';

const games = {
    chess:  sendChess,
    ttt:    sendTicTacToe,
    c4:     sendConnectFour,
    '2048': send2048,
    snake:  sendSnake,
    memory: sendMemory
};

cmd.add({
    name: /^(chess|ttt|c4|2048|snake|memory)$/i,
    category: ["game"],
    desc: "Play live HTML games in chat",
    async run({ m, command }) {
        const send = games[command.toLowerCase()];
        if (send) await send(sock, m.chat);
    }
});
```

## Custom games (build your own)

```js
import { sendHtmlGame } from 'ishumdz-bail';

const myGameHtml = `<style>...</style><body>...<script>/* your game */</script></body>`;
await sendHtmlGame(sock, m.chat, myGameHtml, "🎯 My Game");
```

## API reference

| Function | Description |
|---|---|
| `sendChess(sock, jid)` | Send chess vs AI |
| `sendTicTacToe(sock, jid)` | Send tic tac toe vs AI |
| `sendConnectFour(sock, jid)` | Send connect four vs AI |
| `send2048(sock, jid)` | Send 2048 puzzle |
| `sendSnake(sock, jid)` | Send snake |
| `sendMemory(sock, jid)` | Send memory match |
| `sendHtmlGame(sock, jid, html, header)` | Send any custom HTML game |
| `buildXxxMessage()` | Get raw relayMessage content (no send) |

## Notes

- Games run **fully client-side** inside WhatsApp's GenAI HTML primitive (sandboxed WebView)
- Requires a WhatsApp client version that supports GenAI HTML cards (recent Android/iOS). Older clients / WhatsApp Web will not render the card
- The relay structure is reverse-engineered from Meta AI messages — a WhatsApp update may break rendering
- All games include score tracking, New Game button, and touch + mouse controls

Ported from izuku-mii/Shou-Project (.catur) and extended with 5 new games.
