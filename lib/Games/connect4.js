/**
 * Connect Four - live HTML game for ishu-md
 * 7x6 board, tap a column to drop a disc, AI opponent.
 * Usage: await sendConnectFour(sock, jid)
 */

import { buildHtmlGameMessage } from './htmlGame.js';

const CONNECT4_HTML = "<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}</style>" +
"<body style=\"margin:0;background:transparent;font-family:Arial,sans-serif;color:#eee;touch-action:manipulation;overflow:hidden\">" +
"<div style=\"width:100%;max-width:420px;margin:auto;padding:12px;box-sizing:border-box\">" +
"<div style=\"background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.15);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.35)\">" +
"<div style=\"padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center\">" +
"<div><div style=\"font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,.45)\">\uD83D\uDD34 CONNECT FOUR</div><div style=\"font-size:18px;font-weight:bold;color:#fff\">You vs AI</div></div>" +
"<div id=\"status\" style=\"font-size:13px;font-weight:bold;color:#ffd700;text-align:right\">Your Turn</div>" +
"</div>" +
"<div style=\"padding:14px\">" +
"<canvas id=\"board\" width=\"350\" height=\"300\" style=\"width:100%;height:auto;background:#1a4fa0;border-radius:12px;display:block;touch-action:none;cursor:pointer\"></canvas>" +
"<div style=\"display:flex;justify-content:space-between;max-width:350px;margin:12px auto 0;font-size:12px;color:rgba(255,255,255,.6)\">" +
"<span>You: <b id=\"sw\" style=\"color:#ffd700\">0</b></span><span>Draws: <b id=\"sd\" style=\"color:#fff\">0</b></span><span>AI: <b id=\"sl\" style=\"color:#ff5252\">0</b></span></div>" +
"<button id=\"new\" style=\"display:block;width:100%;max-width:350px;margin:14px auto 0;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#ffd700,#ffb300);color:#222;font-weight:bold;font-size:15px;cursor:pointer\">New Game</button>" +
"</div></div></div>" +
"<script>" +
"var cv=document.getElementById('board'),ctx=cv.getContext('2d');" +
"var st=document.getElementById('status');" +
"var COLS=7,ROWS=6,CELL=50;" +
"var board,over,lock,score={w:0,d:0,l:0};" +
"function reset(){board=[];for(var r=0;r<ROWS;r++){board.push([]);for(var c=0;c<COLS;c++)board[r].push(0);}over=false;lock=false;st.textContent='Your Turn';draw();}" +
"function lowestEmpty(c){for(var r=ROWS-1;r>=0;r--)if(board[r][c]===0)return r;return -1;}" +
"function checkWin(b,p){for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){if(!b[r][c]||b[r][c]!==p)continue;" +
"var dirs=[[0,1],[1,0],[1,1],[1,-1]];" +
"for(var d=0;d<4;d++){var cnt=1;" +
"for(var s=1;s<4;s++){var nr=r+dirs[d][0]*s,nc=c+dirs[d][1]*s;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&b[nr][nc]===p)cnt++;else break;}" +
"for(var s2=1;s2<4;s2++){var nr2=r-dirs[d][0]*s2,nc2=c-dirs[d][1]*s2;if(nr2>=0&&nr2<ROWS&&nc2>=0&&nc2<COLS&&b[nr2][nc2]===p)cnt++;else break;}" +
"if(cnt>=4)return true;}}return false;}" +
"function boardFull(b){for(var c=0;c<COLS;c++)if(b[0][c]===0)return false;return true;}" +
"function evalWindow(w){var you=0,ai=0;for(var i=0;i<4;i++){if(w[i]===2)ai++;else if(w[i]===1)you++;}" +
"if(you>0&&ai>0)return 0;if(ai===3)return 50;if(ai===2)return 10;if(you===3)return -80;if(you===2)return -8;return 0;}" +
"function evaluate(b){var s=0;" +
"for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){" +
"if(c+3<COLS)s+=evalWindow([b[r][c],b[r][c+1],b[r][c+2],b[r][c+3]]);" +
"if(r+3<ROWS)s+=evalWindow([b[r][c],b[r+1][c],b[r+2][c],b[r+3][c]]);" +
"if(r+3<ROWS&&c+3<COLS)s+=evalWindow([b[r][c],b[r+1][c+1],b[r+2][c+2],b[r+3][c+3]]);" +
"if(r+3<ROWS&&c-3>=0)s+=evalWindow([b[r][c],b[r+1][c-1],b[r+2][c-2],b[r+3][c-3]]);}" +
"for(var c2=0;c2<COLS;c2++){if(b[3][c2]===2)s+=30;if(b[3][c2]===1)s-=30;}" +
"return s;}" +
"function cloneB(b){return b.map(function(r){return r.slice();});}" +
"function drop(b,c,p){for(var r=ROWS-1;r>=0;r--)if(b[r][c]===0){b[r][c]=p;return true;}return false;}" +
"function minimax(b,depth,alpha,beta,maximizing){" +
"if(checkWin(b,2))return{v:100000-depth};if(checkWin(b,1))return{v:-100000+depth};" +
"if(boardFull(b))return{v:0};if(depth===0)return{v:evaluate(b)};" +
"var best=maximizing?{v:-Infinity}:{v:Infinity};" +
"var order=[3,2,4,1,5,0,6];" +
"for(var i=0;i<7;i++){var c=order[i];if(b[0][c]!==0)continue;" +
"var nb=cloneB(b);drop(nb,c,maximizing?2:1);" +
"var res=minimax(nb,depth-1,alpha,beta,!maximizing);" +
"if(maximizing){if(res.v>best.v)best=res;if(res.v>alpha)alpha=res.v;}" +
"else{if(res.v<best.v)best=res;if(res.v<beta)beta=res.v;}" +
"if(beta<=alpha)break;}" +
"return best;}" +
"function aiTurn(){lock=true;st.textContent='AI thinking...';" +
"setTimeout(function(){" +
"var order=[3,2,4,1,5,0,6],bestC=-1,bestV=-Infinity;" +
"for(var i=0;i<7;i++){var c=order[i];if(board[0][c]!==0)continue;" +
"var nb=cloneB(board);drop(nb,c,2);" +
"var v=minimax(nb,4,-Infinity,Infinity,false).v;" +
"if(v>bestV){bestV=v;bestC=c;}}" +
"if(bestC>=0){drop(board,bestC,2);}" +
"lock=false;draw();" +
"if(checkWin(board,2)){over=true;st.textContent='AI Wins! \uD83E\uDD16';score.l++;scores();return;}" +
"if(boardFull(board)){over=true;st.textContent=\"It's a Draw! \uD83E\uDD1D\";score.d++;scores();return;}" +
"st.textContent='Your Turn';},300);}" +
"function scores(){document.getElementById('sw').textContent=score.w;document.getElementById('sd').textContent=score.d;document.getElementById('sl').textContent=score.l;}" +
"function draw(){ctx.clearRect(0,0,350,300);" +
"for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){" +
"ctx.beginPath();ctx.arc(c*CELL+CELL/2,r*CELL+CELL/2,CELL/2-4,0,Math.PI*2);" +
"ctx.fillStyle=board[r][c]===0?'#0d2f66':board[r][c]===1?'#ffd700':'#ff5252';ctx.fill();" +
"if(board[r][c]!==0){ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=2;ctx.stroke();}}}" +
"cv.addEventListener('click',function(e){" +
"if(over||lock)return;" +
"var rect=cv.getBoundingClientRect(),scale=350/rect.width;" +
"var x=(e.clientX-rect.left)*scale,c=Math.floor(x/CELL);" +
"if(c<0||c>=COLS||board[0][c]!==0)return;" +
"drop(board,c,1);draw();" +
"if(checkWin(board,1)){over=true;st.textContent='You Win! \uD83C\uDF89';score.w++;scores();return;}" +
"if(boardFull(board)){over=true;st.textContent=\"It's a Draw! \uD83E\uDD1D\";score.d++;scores();return;}" +
"aiTurn();});" +
"cv.addEventListener('touchstart',function(e){e.preventDefault();var t=e.touches[0];if(!t)return;" +
"var rect=cv.getBoundingClientRect(),scale=350/rect.width;" +
"var x=(t.clientX-rect.left)*scale,c=Math.floor(x/CELL);" +
"if(over||lock||c<0||c>=COLS||board[0][c]!==0)return;" +
"drop(board,c,1);draw();" +
"if(checkWin(board,1)){over=true;st.textContent='You Win! \uD83C\uDF89';score.w++;scores();return;}" +
"if(boardFull(board)){over=true;st.textContent=\"It's a Draw! \uD83E\uDD1D\";score.d++;scores();return;}" +
"aiTurn();});" +
"document.getElementById('new').addEventListener('click',reset);" +
"reset();scores();" +
"</script></body>";

/**
 * Build the raw relayMessage content for Connect Four.
 */
export function buildConnectFourMessage() {
    return buildHtmlGameMessage(CONNECT4_HTML, "\uD83D\uDD34 Connect Four vs AI");
}

/**
 * Send the Connect Four game to a chat.
 * @param {object} sock WASocket instance
 * @param {string} jid target chat JID
 */
export async function sendConnectFour(sock, jid) {
    return sock.relayMessage(jid, buildConnectFourMessage(), {});
}
