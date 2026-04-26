/* eslint-disable */
export const PHYSICS_PROJECTILE_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;padding:12px;font-size:13px}
h1{font-size:15px;font-weight:800;color:#f1f5f9;margin-bottom:2px}
.sub{font-size:11px;color:#64748b;margin-bottom:10px}
.obj{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:8px;padding:8px 12px;font-size:12px;color:#93c5fd;margin-bottom:10px;line-height:1.4}
canvas{display:block;width:100%;border-radius:10px;background:#0a1628;border:1px solid #1e293b}
.controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.ctrl{background:#1e293b;border-radius:8px;padding:9px 12px}
.ctrl-top{display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:5px}
.ctrl-val{color:#f1f5f9;font-weight:700}
input[type=range]{width:100%;accent-color:#6366f1;height:4px}
.btn-launch{width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;margin-top:10px;letter-spacing:.3px;transition:opacity .15s}
.btn-launch:hover{opacity:.9}
.btn-launch:disabled{opacity:.5;cursor:not-allowed}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.stat{background:#1e293b;border-radius:7px;padding:7px;text-align:center}
.stat-l{font-size:10px;color:#64748b;margin-bottom:2px}
.stat-v{font-size:16px;font-weight:800;color:#f1f5f9}
.quiz{background:#1e293b;border-radius:10px;padding:12px;margin-top:10px;display:none}
.quiz.show{display:block}
.quiz-q{font-size:13px;font-weight:700;margin-bottom:9px;line-height:1.4;color:#f1f5f9}
.opts{display:flex;flex-direction:column;gap:6px}
.opt{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:7px;padding:8px 11px;font-size:12px;color:#cbd5e1;cursor:pointer;transition:background .15s}
.opt:hover{background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.4)}
.opt.correct{background:rgba(16,185,129,.12);border-color:#10b981;color:#6ee7b7}
.opt.wrong{background:rgba(239,68,68,.08);border-color:#ef4444;color:#fca5a5}
.exp{font-size:11px;color:#94a3b8;margin-top:9px;line-height:1.5;padding:8px;background:rgba(255,255,255,.03);border-radius:6px;display:none}
</style>
</head>
<body>
<h1>🚀 Projectile Motion Lab</h1>
<p class="sub">Adjust the launch angle and see how it affects the trajectory</p>
<div class="obj">🎯 <strong>Challenge:</strong> Find the angle that gives the <em>maximum horizontal range</em>. Try different values and observe what happens.</div>

<canvas id="c" height="180"></canvas>

<div class="controls">
  <div class="ctrl">
    <div class="ctrl-top"><span>📐 Angle</span><span class="ctrl-val" id="av">45°</span></div>
    <input type="range" id="as" min="5" max="85" value="45" oninput="updateAngle(this.value)">
  </div>
  <div class="ctrl">
    <div class="ctrl-top"><span>⚡ Speed</span><span class="ctrl-val" id="sv">30 m/s</span></div>
    <input type="range" id="ss" min="10" max="50" value="30" oninput="updateSpeed(this.value)">
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-l">Range</div><div class="stat-v" id="range">—</div></div>
  <div class="stat"><div class="stat-l">Max Height</div><div class="stat-v" id="height">—</div></div>
  <div class="stat"><div class="stat-l">Launches</div><div class="stat-v" id="launches">0</div></div>
</div>

<button class="btn-launch" id="launchBtn" onclick="launch()">🚀 Launch!</button>

<div class="quiz" id="quiz">
  <div class="quiz-q">🎓 Based on your experiments, what angle gives the <strong>maximum range</strong> for a projectile?</div>
  <div class="opts" id="opts">
    <div class="opt" onclick="answer(this,'wrong')">30° — a shallow angle covers more horizontal ground</div>
    <div class="opt" onclick="answer(this,'correct')">45° — splits vertical and horizontal velocity equally</div>
    <div class="opt" onclick="answer(this,'wrong')">60° — higher angle means more power</div>
    <div class="opt" onclick="answer(this,'wrong')">90° — straight up goes farthest</div>
  </div>
  <div class="exp" id="exp">
    ✅ Correct! At 45° the horizontal and vertical components of velocity are perfectly balanced, giving the greatest range. This is a key result of Newton's laws — sin(2×45°) = sin(90°) = 1, its maximum value.
  </div>
</div>

<script>
const g=9.8;
let angle=45,speed=30,launches=0,animId=null,done=false;

const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');

function resize(){canvas.width=canvas.offsetWidth;drawIdle();}
window.addEventListener('resize',resize);
setTimeout(resize,50);

function drawBg(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#0a1628';
  ctx.fillRect(0,0,W,H);
  // Ground
  ctx.fillStyle='#1e3a5f';
  ctx.fillRect(0,H-20,W,20);
  ctx.fillStyle='#22c55e';
  ctx.fillRect(0,H-22,W,4);
}

function scaleX(x,R,W){return 30+(x/R)*(W-60);}
function scaleY(y,maxH,H){return (H-22)-(y/(maxH*1.2))*(H-40);}

function drawIdle(){
  if(!canvas.width)return;
  drawBg();
  const W=canvas.width,H=canvas.height;
  // Launcher
  const rad=angle*Math.PI/180;
  ctx.save();
  ctx.translate(30,H-22);
  ctx.rotate(-rad);
  ctx.fillStyle='#6366f1';
  ctx.fillRect(0,-5,35,10);
  ctx.restore();
  // Angle arc
  ctx.beginPath();
  ctx.arc(30,H-22,25,-(rad),0,false);
  ctx.strokeStyle='rgba(99,102,241,.4)';
  ctx.lineWidth=1.5;
  ctx.stroke();
  ctx.fillStyle='#818cf8';
  ctx.font='bold 10px system-ui';
  ctx.fillText(angle+'°',38,H-30);
}

function launch(){
  if(animId)cancelAnimationFrame(animId);
  const rad=angle*Math.PI/180;
  const vx=speed*Math.cos(rad),vy=speed*Math.sin(rad);
  const totalTime=2*vy/g;
  const R=vx*totalTime;
  const maxH=(vy*vy)/(2*g);

  document.getElementById('range').textContent=Math.round(R)+'m';
  document.getElementById('height').textContent=Math.round(maxH)+'m';
  launches++;
  document.getElementById('launches').textContent=launches;

  const W=canvas.width,H=canvas.height;
  let t=0;
  const dt=totalTime/80;
  const pts=[];

  function frame(){
    drawBg();
    t+=dt;
    const cx=vx*t,cy=vy*t-0.5*g*t*t;
    pts.push([cx,cy]);

    // Draw trail
    if(pts.length>1){
      ctx.beginPath();
      ctx.moveTo(scaleX(pts[0][0],R,W),scaleY(pts[0][1],maxH,H));
      for(let i=1;i<pts.length;i++){
        ctx.lineTo(scaleX(pts[i][0],R,W),scaleY(pts[i][1],maxH,H));
      }
      ctx.strokeStyle='rgba(99,102,241,.5)';
      ctx.lineWidth=2;
      ctx.stroke();
    }

    // Launcher
    const rad2=angle*Math.PI/180;
    ctx.save();
    ctx.translate(30,H-22);
    ctx.rotate(-rad2);
    ctx.fillStyle='#6366f1';
    ctx.fillRect(0,-5,35,10);
    ctx.restore();

    // Ball
    const bx=scaleX(cx,R,W),by=scaleY(cy,maxH,H);
    ctx.beginPath();
    ctx.arc(bx,by,6,0,Math.PI*2);
    ctx.fillStyle='#f59e0b';
    ctx.fill();

    if(t<totalTime&&cy>=0){
      animId=requestAnimationFrame(frame);
    } else {
      // Landing marker
      ctx.beginPath();
      ctx.arc(scaleX(R,R,W),H-22,5,0,Math.PI*2);
      ctx.fillStyle='#ef4444';
      ctx.fill();
      ctx.fillStyle='#f1f5f9';
      ctx.font='bold 10px system-ui';
      ctx.fillText(Math.round(R)+'m',scaleX(R,R,W)-14,H-26);

      if(launches>=3&&!done){
        document.getElementById('quiz').classList.add('show');
      }
    }
  }
  animId=requestAnimationFrame(frame);
}

function updateAngle(v){angle=+v;document.getElementById('av').textContent=v+'°';drawIdle();}
function updateSpeed(v){speed=+v;document.getElementById('sv').textContent=v+' m/s';}

function answer(el,type){
  if(done)return;
  document.querySelectorAll('.opt').forEach(o=>o.onclick=null);
  el.classList.add(type);
  if(type==='correct'){
    done=true;
    document.getElementById('exp').style.display='block';
    setTimeout(()=>window.parent.postMessage({type:'LAB_COMPLETE',score:100},'*'),1200);
  } else {
    el.textContent+=' ✗';
  }
}

drawIdle();
</script>
</body>
</html>`;
