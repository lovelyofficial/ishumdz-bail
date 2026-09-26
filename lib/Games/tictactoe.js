/**
 * Tic Tac Toe (vs AI, unbeatable minimax) - live HTML game for ishu-md
 * Usage: await sendTicTacToe(sock, jid)
 */

import { buildHtmlGameMessage } from './htmlGame.js';

const TIC_TAC_TOE_HTML = "<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}</style>" +
"<body style=\"margin:0;background:transparent;font-family:Arial,sans-serif;color:#eee;touch-action:manipulation;overflow:hidden\">" +
"<div style=\"width:100%;max-width:420px;margin:auto;padding:12px;box-sizing:border-box\">" +
"<div style=\"background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.15);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.35)\">" +
"<div style=\"padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center\">" +
"<div><div style=\"font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,.45)\">\uD83C\uDFAE TIC TAC TOE</div><div style=\"font-size:18px;font-weight:bold;color:#fff\">You vs AI</div></div>" +
"<div id=\"status\" style=\"font-size:13px;font-weight:bold;color:#ffd700;text-align:right;transition:all .3s\">Your Turn</div>" +
"</div>" +
"<div style=\"padding:14px\">" +
"<div id=\"grid\" style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:300px;margin:auto\"></div>" +
"<div style=\"display:flex;justify-content:space-between;max-width:300px;margin:12px auto 0;font-size:12px;color:rgba(255,255,255,.6)\">" +
"<span>You: <b id=\"sw\" style=\"color:#ffd700\">0</b></span><span>Draws: <b id=\"sd\" style=\"color:#fff\">0</b></span><span>AI: <b id=\"sl\" style=\"color:#4da6ff\">0</b></span></div>" +
"<button id=\"new\" style=\"display:block;width:100%;max-width:300px;margin:14px auto 0;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#ffd700,#ffb300);color:#222;font-weight:bold;font-size:15px;cursor:pointer\">New Game</button>" +
"</div></div></div>" +
"<script>" +
"var gridEl=document.getElementById('grid'),st=document.getElementById('status');" +
"var cells=[],board,over,lock,score={w:0,d:0,l:0};" +
"var LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];" +
"for(var i=0;i<9;i++){var d=document.createElement('div');d.className='cell';d.dataset.i=i;" +
"d.style.cssText='aspect-ratio:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:bold;cursor:pointer;color:#ffd700';" +
"gridEl.appendChild(d);cells.push(d);}" +
"function getWinner(b){for(var i=0;i<LINES.length;i++){var L=LINES[i];if(b[L[0]]&&b[L[0]]===b[L[1]]&&b[L[0]]===b[L[2]])return{p:b[L[0]],L:L};}var full=true;for(var j=0;j<9;j++)if(!b[j])full=false;return full?{p:'draw'}:null;}" +
"function mini(b,isMax){var w=getWinner(b);if(w)return w.p==='O'?10:w.p==='X'?-10:0;var best=isMax?-Infinity:Infinity;" +
"for(var i=0;i<9;i++)if(!b[i]){b[i]=isMax?'O':'X';var s=mini(b,!isMax);b[i]=null;if(isMax){if(s>best)best=s;}else{if(s<best)best=s;}}return best;}" +
"function bestMove(b){var best=-Infinity,mv=-1;for(var i=0;i<9;i++)if(!b[i]){b[i]='O';var s=mini(b,false);b[i]=null;if(s>best){best=s;mv=i;}}return mv;}" +
"function render(){for(var i=0;i<9;i++){cells[i].textContent=board[i]||'';cells[i].style.color=board[i]==='O'?'#4da6ff':'#ffd700';cells[i].style.background=cells[i].win?'rgba(255,215,0,.25)':'rgba(255,255,255,.05)';}}" +
"function setS(t){st.textContent=t;}" +
"function scores(){document.getElementById('sw').textContent=score.w;document.getElementById('sd').textContent=score.d;document.getElementById('sl').textContent=score.l;}" +
"function endCheck(){var w=getWinner(board);if(!w)return false;over=true;" +
"if(w.p==='X'){setS('You Win! \\uD83C\\uDF89');score.w++;}else if(w.p==='O'){setS('AI Wins! \\uD83E\\uDD16');score.l++;}else{setS(\"It's a Draw! \\uD83E\\uDD1D\");score.d++;}" +
"if(w.L)for(var k=0;k<3;k++)cells[w.L[k]].style.background='rgba(255,215,0,.25)';scores();return true;}" +
"gridEl.addEventListener('click',function(e){var t=e.target;if(!t.dataset.i||over||lock||board[t.dataset.i])return;" +
"var i=+t.dataset.i;board[i]='X';render();if(endCheck())return;setS('AI thinking...');lock=true;" +
"setTimeout(function(){var m=bestMove(board);if(m>=0)board[m]='O';lock=false;render();if(!endCheck())setS('Your Turn');},280);});" +
"function reset(){board=[null,null,null,null,null,null,null,null,null];over=false;lock=false;" +
"for(var i=0;i<9;i++)cells[i].style.background='rgba(255,255,255,.05)';render();setS('Your Turn');}" +
"document.getElementById('new').addEventListener('click',reset);" +
"reset();scores();" +
"</script></body>";

/**
 * Build the raw relayMessage content for Tic Tac Toe.
 */
export function buildTicTacToeMessage() {
    return buildHtmlGameMessage(TIC_TAC_TOE_HTML, "\uD83C\uDFAE Tic Tac Toe vs AI");
}

/**
 * Send the Tic Tac Toe game to a chat.
 * @param {object} sock WASocket instance
 * @param {string} jid target chat JID
 */
export async function sendTicTacToe(sock, jid) {
    return sock.relayMessage(jid, buildTicTacToeMessage(), {});
}
