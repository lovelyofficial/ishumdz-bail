/**
 * Memory Match - live HTML game for ishu-md
 * Flip cards, find all emoji pairs!
 * Usage: await sendMemory(sock, jid)
 */

import { buildHtmlGameMessage } from './htmlGame.js';

const MEMORY_HTML = "<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}</style>" +
"<body style=\"margin:0;background:transparent;font-family:Arial,sans-serif;color:#eee;touch-action:manipulation;overflow:hidden\">" +
"<div style=\"width:100%;max-width:420px;margin:auto;padding:12px;box-sizing:border-box\">" +
"<div style=\"background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.15);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.35)\">" +
"<div style=\"padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center\">" +
"<div><div style=\"font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,.45)\">\uD83E\uDDE9 MEMORY</div><div style=\"font-size:18px;font-weight:bold;color:#fff\">Match the Pairs!</div></div>" +
"<div style=\"text-align:right\"><div style=\"font-size:10px;color:rgba(255,255,255,.5)\">MOVES</div><div id=\"moves\" style=\"font-size:18px;font-weight:bold;color:#ffd700\">0</div></div>" +
"</div>" +
"<div style=\"padding:14px\">" +
"<div id=\"grid\" style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:340px;margin:auto\"></div>" +
"<div id=\"msg\" style=\"text-align:center;font-size:16px;font-weight:bold;color:#ffd700;min-height:22px;margin-top:8px\"></div>" +
"<div style=\"display:flex;justify-content:space-between;max-width:340px;margin:4px auto 0;font-size:12px;color:rgba(255,255,255,.6)\">" +
"<span>Pairs: <b id=\"pairs\" style=\"color:#ffd700\">0</b>/8</span>" +
"<span id=\"time\">Time: 0s</span></div>" +
"<button id=\"new\" style=\"display:block;width:100%;max-width:340px;margin:12px auto 0;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#ffd700,#ffb300);color:#222;font-weight:bold;font-size:15px;cursor:pointer\">New Game</button>" +
"</div></div></div>" +
"<script>" +
"var EMOJI=['\\uD83C\\uDF4E','\\uD83C\\uDF4C','\\uD83C\\uDF52','\\uD83D\\uDC3C','\\uD83D\\uDC36','\\uD83D\\uDC31','\\uD83D\\uDE00','\\uD83D\\uDE80'];" +
"var gridEl=document.getElementById('grid');" +
"var flipped=[],moves=0,pairs=0,seconds=0,lock=false,timer=null;" +
"function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}" +
"function reset(){if(timer)clearInterval(timer);" +
"flipped=[];moves=0;pairs=0;seconds=0;lock=false;" +
"document.getElementById('moves').textContent='0';" +
"document.getElementById('pairs').textContent='0';" +
"document.getElementById('time').textContent='Time: 0s';" +
"document.getElementById('msg').textContent='';" +
"var deck=shuffle(EMOJI.concat(EMOJI));" +
"gridEl.innerHTML='';" +
"for(var i=0;i<16;i++){" +
"(function(){var d=document.createElement('div');" +
"d.style.cssText='aspect-ratio:1;background:linear-gradient(135deg,#5c6bc0,#3949ab);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:34px;cursor:pointer;transition:background .3s';" +
"d.textContent='?';d.emoji=deck[i];d.done=false;d.open=false;" +
"d.addEventListener('click',function(){flip(d);});" +
"gridEl.appendChild(d);})();}}" +
"function flip(d){if(lock||d.done||d.open)return;" +
"d.open=true;d.textContent=d.emoji;d.style.background='rgba(255,255,255,.1)';" +
"flipped.push(d);" +
"if(flipped.length===2){lock=true;moves++;" +
"document.getElementById('moves').textContent=moves;" +
"var a=flipped[0],b=flipped[1];" +
"if(a.emoji===b.emoji){a.done=true;b.done=true;pairs++;" +
"document.getElementById('pairs').textContent=pairs;" +
"a.style.background='rgba(76,175,80,.35)';b.style.background='rgba(76,175,80,.35)';" +
"flipped=[];lock=false;" +
"if(pairs===8){clearInterval(timer);" +
"document.getElementById('msg').textContent='You Win! \\uD83C\\uDF89 '+moves+' moves, '+seconds+'s';}}}" +
"else{setTimeout(function(){" +
"a.textContent='?';b.textContent='?';" +
"a.style.background='linear-gradient(135deg,#5c6bc0,#3949ab)';" +
"b.style.background='linear-gradient(135deg,#5c6bc0,#3949ab)';" +
"a.open=false;b.open=false;flipped=[];lock=false;},700);}}" +
"reset();" +
"timer=setInterval(function(){seconds++;document.getElementById('time').textContent='Time: '+seconds+'s';},1000);" +
"document.getElementById('new').addEventListener('click',function(){reset();" +
"if(timer)clearInterval(timer);" +
"timer=setInterval(function(){seconds++;document.getElementById('time').textContent='Time: '+seconds+'s';},1000);});" +
"</script></body>";

/**
 * Build the raw relayMessage content for Memory Match.
 */
export function buildMemoryMessage() {
    return buildHtmlGameMessage(MEMORY_HTML, "\uD83E\uDDE9 Memory Match");
}

/**
 * Send the Memory Match game to a chat.
 * @param {object} sock WASocket instance
 * @param {string} jid target chat JID
 */
export async function sendMemory(sock, jid) {
    return sock.relayMessage(jid, buildMemoryMessage(), {});
}
