/**
 * 2048 - live HTML game for ishu-md
 * Swipe to merge tiles, reach 2048!
 * Usage: await send2048(sock, jid)
 */

import { buildHtmlGameMessage } from './htmlGame.js';

const GAME_2048_HTML = "<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none}</style>" +
"<body style=\"margin:0;background:transparent;font-family:Arial,sans-serif;color:#eee;touch-action:none;overflow:hidden\">" +
"<div style=\"width:100%;max-width:420px;margin:auto;padding:12px;box-sizing:border-box\">" +
"<div style=\"background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.15);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.35)\">" +
"<div style=\"padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center\">" +
"<div><div style=\"font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,.45)\">\uD83D\uDD24 2048</div><div style=\"font-size:18px;font-weight:bold;color:#fff\">Merge to 2048!</div></div>" +
"<div style=\"text-align:right\"><div style=\"font-size:10px;color:rgba(255,255,255,.5)\">SCORE</div><div id=\"score\" style=\"font-size:18px;font-weight:bold;color:#ffd700\">0</div></div>" +
"</div>" +
"<div style=\"padding:14px\">" +
"<canvas id=\"board\" width=\"360\" height=\"360\" style=\"width:100%;height:auto;background:rgba(255,255,255,.04);border-radius:12px;display:block;touch-action:none\"></canvas>" +
"<div style=\"display:flex;justify-content:space-between;align-items:center;max-width:360px;margin:12px auto 0\">" +
"<span id=\"best\" style=\"font-size:12px;color:rgba(255,255,255,.6)\">Best: 0</span>" +
"<button id=\"new\" style=\"padding:10px 24px;border:0;border-radius:12px;background:linear-gradient(135deg,#ffd700,#ffb300);color:#222;font-weight:bold;font-size:14px;cursor:pointer\">New Game</button>" +
"</div>" +
"<div style=\"text-align:center;font-size:11px;color:rgba(255,255,255,.4);margin-top:8px\">Swipe to move tiles</div>" +
"</div></div></div>" +
"<script>" +
"var cv=document.getElementById('board'),ctx=cv.getContext('2d');" +
"var S=360,C=4,CELL=90;" +
"var grid,score=0,best=0,over=false;" +
"var COLORS={2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};" +
"function reset(){grid=[];for(var r=0;r<C;r++){grid.push([0,0,0,0]);}score=0;over=false;addTile();addTile();update();draw();}" +
"function addTile(){var empty=[];" +
"for(var r=0;r<C;r++)for(var c=0;c<C;c++)if(grid[r][c]===0)empty.push([r,c]);" +
"if(!empty.length)return;var p=empty[Math.floor(Math.random()*empty.length)];" +
"grid[p[0]][p[1]]=Math.random()<0.9?2:4;}" +
"function update(){document.getElementById('score').textContent=score;" +
"if(score>best){best=score;}" +
"document.getElementById('best').textContent='Best: '+best;}" +
"function draw(){ctx.clearRect(0,0,S,S);" +
"for(var r=0;r<C;r++)for(var c=0;c<C;c++){" +
"var v=grid[r][c];var x=c*CELL+5,y=r*CELL+5,w=CELL-10;" +
"ctx.fillStyle='rgba(255,255,255,.05)';roundRect(x,y,w,w,8);ctx.fill();" +
"if(v){ctx.fillStyle=COLORS[v]||'#3c3a32';roundRect(x,y,w,w,8);ctx.fill();" +
"ctx.fillStyle=v<=4?'#776e65':'#f9f6f2';" +
"ctx.font='bold '+(v>=1024?'26px':v>=128?'30px':'34px')+' Arial';" +
"ctx.textAlign='center';ctx.textBaseline='middle';" +
"ctx.fillText(v,x+w/2,y+w/2);}}}" +
"function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}" +
"function slide(row){var a=row.filter(function(v){return v;});var out=[];var gained=0;" +
"for(var i=0;i<a.length;i++){" +
"if(i+1<a.length&&a[i]===a[i+1]){out.push(a[i]*2);gained+=a[i]*2;i++;}" +
"else out.push(a[i]);}" +
"while(out.length<C)out.push(0);" +
"return{row:out,gained:gained};}" +
"function move(dir){if(over)return;" +
"var moved=false,gained=0;" +
"var work=[];" +
"for(var i=0;i<C;i++)work.push([0,0,0,0]);" +
"var get=function(r,c){return dir==='left'?grid[r][c]:dir==='right'?grid[r][C-1-c]:dir==='up'?grid[r][c]:grid[C-1-r][c];};" +
"var set=function(r,c,v){if(dir==='left')grid[r][c]=v;else if(dir==='right')grid[r][C-1-c]=v;else if(dir==='up')grid[r][c]=v;else grid[C-1-r][c]=v;};" +
"for(var r=0;r<C;r++){var line=[];for(var c=0;c<C;c++)line.push(get(r,c));" +
"var res=slide(line);gained+=res.gained;" +
"for(var c2=0;c2<C;c2++){var nv=res.row[c2];if(get(r,c2)!==nv)moved=true;set(r,c2,nv);}}" +
"if(moved){score+=gained;addTile();update();draw();checkEnd();}}" +
"function checkEnd(){for(var r=0;r<C;r++)for(var c=0;c<C;c++)if(grid[r][c]===0)return;" +
"for(var r2=0;r2<C;r2++)for(var c2=0;c2<C;c2++){" +
"var v=grid[r2][c2];" +
"if(c2+1<C&&grid[r2][c2+1]===v)return;if(r2+1<C&&grid[r2+1][c2]===v)return;}" +
"over=true;}" +
"var sx=0,sy=0;" +
"cv.addEventListener('touchstart',function(e){e.preventDefault();var t=e.touches[0];sx=t.clientX;sy=t.clientY;});" +
"cv.addEventListener('touchend',function(e){" +
"var t=e.changedTouches[0];var dx=t.clientX-sx,dy=t.clientY-sy;" +
"if(Math.abs(dx)<20&&Math.abs(dy)<20)return;" +
"if(Math.abs(dx)>Math.abs(dy))move(dx>0?'right':'left');else move(dy>0?'down':'up');});" +
"var md=0;" +
"cv.addEventListener('mousedown',function(e){md=1;sx=e.clientX;sy=e.clientY;});" +
"cv.addEventListener('mouseup',function(e){if(!md)return;md=0;" +
"var dx=e.clientX-sx,dy=e.clientY-sy;" +
"if(Math.abs(dx)<20&&Math.abs(dy)<20)return;" +
"if(Math.abs(dx)>Math.abs(dy))move(dx>0?'right':'left');else move(dy>0?'down':'up');});" +
"document.getElementById('new').addEventListener('click',reset);" +
"reset();" +
"</script></body>";

/**
 * Build the raw relayMessage content for 2048.
 */
export function build2048Message() {
    return buildHtmlGameMessage(GAME_2048_HTML, "\uD83D\uDD24 2048");
}

/**
 * Send the 2048 game to a chat.
 * @param {object} sock WASocket instance
 * @param {string} jid target chat JID
 */
export async function send2048(sock, jid) {
    return sock.relayMessage(jid, build2048Message(), {});
}
