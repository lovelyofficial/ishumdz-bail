/**
 * Snake - live HTML game for ishu-md
 * Swipe to steer, eat food, grow long!
 * Usage: await sendSnake(sock, jid)
 */

import { buildHtmlGameMessage } from './htmlGame.js';

const SNAKE_HTML = "<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none}</style>" +
"<body style=\"margin:0;background:transparent;font-family:Arial,sans-serif;color:#eee;touch-action:none;overflow:hidden\">" +
"<div style=\"width:100%;max-width:420px;margin:auto;padding:12px;box-sizing:border-box\">" +
"<div style=\"background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.15);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.35)\">" +
"<div style=\"padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center\">" +
"<div><div style=\"font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,.45)\">\uD83D\uDC0D SNAKE</div><div style=\"font-size:18px;font-weight:bold;color:#fff\">Classic Snake</div></div>" +
"<div style=\"text-align:right\"><div style=\"font-size:10px;color:rgba(255,255,255,.5)\">SCORE</div><div id=\"score\" style=\"font-size:18px;font-weight:bold;color:#ffd700\">0</div></div>" +
"</div>" +
"<div style=\"padding:14px\">" +
"<canvas id=\"board\" width=\"360\" height=\"360\" style=\"width:100%;height:auto;background:rgba(255,255,255,.04);border-radius:12px;display:block;touch-action:none\"></canvas>" +
"<div style=\"display:flex;justify-content:space-between;align-items:center;max-width:360px;margin:12px auto 0\">" +
"<span id=\"best\" style=\"font-size:12px;color:rgba(255,255,255,.6)\">Best: 0</span>" +
"<button id=\"go\" style=\"padding:10px 24px;border:0;border-radius:12px;background:linear-gradient(135deg,#4caf50,#2e7d32);color:#fff;font-weight:bold;font-size:14px;cursor:pointer\">Start</button>" +
"</div>" +
"<div style=\"text-align:center;font-size:11px;color:rgba(255,255,255,.4);margin-top:8px\">Swipe or use arrow keys</div>" +
"</div></div></div>" +
"<script>" +
"var cv=document.getElementById('board'),ctx=cv.getContext('2d');" +
"var N=18,CELL=360/N;" +
"var snake,dir,food,score=0,best=0,dead=true,timer=null,speed=160;" +
"function reset(){snake=[{x:8,y:9},{x:7,y:9},{x:6,y:9}];dir={x:1,y:0};score=0;speed=160;placeFood();dead=false;update();tick();if(timer)clearInterval(timer);timer=setInterval(tick,speed);}" +
"function placeFood(){while(true){var f={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)};" +
"var hit=false;for(var i=0;i<snake.length;i++)if(snake[i].x===f.x&&snake[i].y===f.y)hit=true;" +
"if(!hit){food=f;return;}}}" +
"function update(){document.getElementById('score').textContent=score;" +
"if(score>best)best=score;document.getElementById('best').textContent='Best: '+best;}" +
"function tick(){if(dead)return;" +
"var head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};" +
"if(head.x<0||head.x>=N||head.y<0||head.y>=N){return die();}" +
"for(var i=0;i<snake.length-1;i++)if(snake[i].x===head.x&&snake[i].y===head.y)return die();" +
"snake.unshift(head);" +
"if(head.x===food.x&&head.y===food.y){score+=10;update();placeFood();" +
"if(score%50===0&&speed>70){speed-=15;clearInterval(timer);timer=setInterval(tick,speed);}}" +
"else snake.pop();" +
"draw();}" +
"function die(){dead=true;if(timer)clearInterval(timer);draw();" +
"ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,360,360);" +
"ctx.fillStyle='#ffd700';ctx.font='bold 28px Arial';ctx.textAlign='center';" +
"ctx.fillText('Game Over!',180,170);" +
"ctx.fillStyle='#fff';ctx.font='16px Arial';" +
"ctx.fillText('Score: '+score,180,200);}" +
"function draw(){ctx.clearRect(0,0,360,360);" +
"for(var i=0;i<snake.length;i++){" +
"var g=255-Math.min(120,i*4);" +
"ctx.fillStyle='rgb(76,'+g+',175)';" +
"ctx.fillRect(snake[i].x*CELL+1,snake[i].y*CELL+1,CELL-2,CELL-2);}" +
"ctx.fillStyle='#ff5252';ctx.beginPath();ctx.arc(food.x*CELL+CELL/2,food.y*CELL+CELL/2,CELL/2-3,0,Math.PI*2);ctx.fill();}" +
"function turn(x,y){if(dead)return;if(dir.x===-x&&dir.y===-y)return;dir={x:x,y:y};}" +
"var sx=0,sy=0;" +
"cv.addEventListener('touchstart',function(e){e.preventDefault();var t=e.touches[0];sx=t.clientX;sy=t.clientY;});" +
"cv.addEventListener('touchend',function(e){var t=e.changedTouches[0];var dx=t.clientX-sx,dy=t.clientY-sy;" +
"if(Math.abs(dx)<18&&Math.abs(dy)<18)return;" +
"if(Math.abs(dx)>Math.abs(dy))turn(dx>0?1:-1,0);else turn(0,dy>0?1:-1);});" +
"var md=0;" +
"cv.addEventListener('mousedown',function(e){md=1;sx=e.clientX;sy=e.clientY;});" +
"cv.addEventListener('mouseup',function(e){if(!md)return;md=0;" +
"var dx=e.clientX-sx,dy=e.clientY-sy;" +
"if(Math.abs(dx)<18&&Math.abs(dy)<18)return;" +
"if(Math.abs(dx)>Math.abs(dy))turn(dx>0?1:-1,0);else turn(0,dy>0?1:-1);});" +
"document.addEventListener('keydown',function(e){" +
"if(e.key==='ArrowUp')turn(0,-1);else if(e.key==='ArrowDown')turn(0,1);" +
"else if(e.key==='ArrowLeft')turn(-1,0);else if(e.key==='ArrowRight')turn(1,0);});" +
"document.getElementById('go').addEventListener('click',function(){if(timer)clearInterval(timer);reset();});" +
"ctx.fillStyle='rgba(255,255,255,.04)';ctx.fillRect(0,0,360,360);" +
"ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='16px Arial';ctx.textAlign='center';" +
"ctx.fillText('Press Start to play!',180,180);" +
"</script></body>";

/**
 * Build the raw relayMessage content for Snake.
 */
export function buildSnakeMessage() {
    return buildHtmlGameMessage(SNAKE_HTML, "\uD83D\uDC0D Snake");
}

/**
 * Send the Snake game to a chat.
 * @param {object} sock WASocket instance
 * @param {string} jid target chat JID
 */
export async function sendSnake(sock, jid) {
    return sock.relayMessage(jid, buildSnakeMessage(), {});
}
