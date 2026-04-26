/* eslint-disable */
export const ECONOMICS_SIM_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;padding:14px;font-size:14px}
h1{font-size:16px;font-weight:800;color:#f1f5f9;margin-bottom:2px}
.sub{font-size:11px;color:#64748b;margin-bottom:12px}
.obj{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:8px;padding:9px 12px;font-size:12px;color:#93c5fd;margin-bottom:12px;line-height:1.45}
.graph-wrap{background:#1e293b;border-radius:10px;padding:12px;margin-bottom:12px}
svg{width:100%;display:block}
.sliders{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.ctrl{background:#1e293b;border-radius:8px;padding:10px 12px}
.ctrl-top{display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px}
.ctrl-val{color:#f1f5f9;font-weight:700}
input[type=range]{width:100%;accent-color:#3b82f6;height:4px}
.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
.stat{background:#1e293b;border-radius:8px;padding:8px;text-align:center}
.stat-l{font-size:10px;color:#64748b;margin-bottom:3px}
.stat-v{font-size:18px;font-weight:800;color:#f1f5f9}
.stat-t{font-size:10px;color:#22c55e}
.quiz{background:#1e293b;border-radius:10px;padding:14px;display:none}
.quiz.show{display:block}
.quiz-q{font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:10px;line-height:1.4}
.opts{display:flex;flex-direction:column;gap:6px}
.opt{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:7px;padding:9px 12px;font-size:12px;color:#cbd5e1;cursor:pointer;transition:background .15s}
.opt:hover{background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.4)}
.opt.correct{background:rgba(16,185,129,.15);border-color:#10b981;color:#6ee7b7}
.opt.wrong{background:rgba(239,68,68,.1);border-color:#ef4444;color:#fca5a5}
.explain{font-size:11px;color:#94a3b8;margin-top:10px;line-height:1.5;padding:8px;background:rgba(255,255,255,.04);border-radius:6px;display:none}
.explore-hint{font-size:11px;color:#64748b;text-align:center;margin-bottom:8px}
</style>
</head>
<body>
<h1>🏪 Market Equilibrium Explorer</h1>
<p class="sub">Shift supply &amp; demand curves and read the equilibrium</p>

<div class="obj">
  🎯 <strong>Explore:</strong> Move the sliders to shift the supply (green) and demand (red) curves.
  Watch how the equilibrium price and quantity change. Then answer the question.
</div>

<div class="graph-wrap">
  <svg id="g" viewBox="0 0 380 220"></svg>
</div>

<div class="sliders">
  <div class="ctrl">
    <div class="ctrl-top"><span>📦 Supply</span><span class="ctrl-val" id="sv">0</span></div>
    <input type="range" id="ss" min="-25" max="25" value="0">
  </div>
  <div class="ctrl">
    <div class="ctrl-top"><span>🛒 Demand</span><span class="ctrl-val" id="dv">0</span></div>
    <input type="range" id="ds" min="-25" max="25" value="0">
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-l">Eq. Price</div><div class="stat-v" id="ep">$50</div><div class="stat-t">equilibrium</div></div>
  <div class="stat"><div class="stat-l">Eq. Quantity</div><div class="stat-v" id="eq">20</div><div class="stat-t">units</div></div>
  <div class="stat"><div class="stat-l">Explored</div><div class="stat-v" id="ec">0</div><div class="stat-t">of 4 moves</div></div>
</div>

<p class="explore-hint" id="hint">Try moving both sliders to unlock the quiz ↓</p>
<div class="quiz" id="quiz">
  <div class="quiz-q">📊 When demand <strong>increases</strong> (shifts right), what happens to the equilibrium price?</div>
  <div class="opts" id="opts">
    <div class="opt" onclick="answer(this,'wrong')">It decreases — higher demand means lower prices</div>
    <div class="opt" onclick="answer(this,'correct')">It increases — higher demand drives prices up</div>
    <div class="opt" onclick="answer(this,'wrong')">It stays the same — only supply affects price</div>
    <div class="opt" onclick="answer(this,'wrong')">It depends on quantity, not demand alone</div>
  </div>
  <div class="explain" id="exp">
    ✅ Correct! When demand increases, consumers want more at every price. Sellers respond by raising prices until a new, higher equilibrium is reached. This is a fundamental law of markets.
  </div>
</div>

<script>
const W=380,H=220,ML=42,MR=16,MT=14,MB=30;
const PW=W-ML-MR,PH=H-MT-MB;
const QM=40,PM=100;
let moves=0,done=false;

function qx(q){return ML+(q/QM)*PW}
function py(p){return MT+PH-(p/PM)*PH}

function draw(){
  const ss=+document.getElementById('ss').value;
  const ds=+document.getElementById('ds').value;
  document.getElementById('sv').textContent=(ss>=0?'+':'')+ss;
  document.getElementById('dv').textContent=(ds>=0?'+':'')+ds;

  // Supply: P = (10+ss) + 2Q   Demand: P = (90+ds) - 2Q
  const si=10+ss, di=90+ds;
  const Qeq=(di-si)/4, Peq=si+2*Qeq;

  document.getElementById('ep').textContent='$'+Math.round(Peq);
  document.getElementById('eq').textContent=Math.max(0,Math.round(Qeq));

  let svg='';
  // Grid
  [0,10,20,30,40].forEach(q=>{
    svg+=\`<line x1="\${qx(q)}" y1="\${MT}" x2="\${qx(q)}" y2="\${MT+PH}" stroke="#1e293b" stroke-width="1"/>
           <text x="\${qx(q)}" y="\${MT+PH+14}" fill="#475569" font-size="9" text-anchor="middle">\${q}</text>\`;
  });
  [0,25,50,75,100].forEach(p=>{
    svg+=\`<line x1="\${ML}" y1="\${py(p)}" x2="\${ML+PW}" y2="\${py(p)}" stroke="#1e293b" stroke-width="1"/>
           <text x="\${ML-4}" y="\${py(p)+3.5}" fill="#475569" font-size="9" text-anchor="end">$\${p}</text>\`;
  });
  // Axes
  svg+=\`<line x1="\${ML}" y1="\${MT}" x2="\${ML}" y2="\${MT+PH}" stroke="#334155" stroke-width="1.5"/>
         <line x1="\${ML}" y1="\${MT+PH}" x2="\${ML+PW}" y2="\${MT+PH}" stroke="#334155" stroke-width="1.5"/>
         <text x="\${ML+PW/2}" y="\${H-2}" fill="#475569" font-size="9" text-anchor="middle">Quantity</text>
         <text x="9" y="\${MT+PH/2}" fill="#475569" font-size="9" text-anchor="middle" transform="rotate(-90,9,\${MT+PH/2})">Price</text>\`;

  // Supply line (green): clamp to plot bounds
  const sq0=Math.max(0,-si/2), sq1=Math.min(QM,(PM-si)/2);
  if(sq0<sq1){
    svg+=\`<line x1="\${qx(sq0)}" y1="\${py(si+2*sq0)}" x2="\${qx(sq1)}" y2="\${py(si+2*sq1)}" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"/>
           <text x="\${qx(sq1)-4}" y="\${py(si+2*sq1)-5}" fill="#22c55e" font-size="11" font-weight="700">S</text>\`;
  }

  // Demand line (red): clamp
  const dq1=Math.min(QM,di/2);
  if(dq1>0){
    svg+=\`<line x1="\${qx(0)}" y1="\${py(Math.min(PM,di))}" x2="\${qx(dq1)}" y2="\${py(Math.max(0,di-2*dq1))}" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/>
           <text x="\${qx(0)+4}" y="\${py(Math.min(PM,di))-5}" fill="#f43f5e" font-size="11" font-weight="700">D</text>\`;
  }

  // Equilibrium dot + dashed guides
  if(Qeq>=0&&Qeq<=QM&&Peq>=0&&Peq<=PM){
    const ex=qx(Qeq),ey=py(Peq);
    svg+=\`<line x1="\${ex}" y1="\${MT}" x2="\${ex}" y2="\${ey}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4,3"/>
           <line x1="\${ML}" y1="\${ey}" x2="\${ex}" y2="\${ey}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4,3"/>
           <circle cx="\${ex}" cy="\${ey}" r="6" fill="#f59e0b" opacity=".25"/>
           <circle cx="\${ex}" cy="\${ey}" r="4" fill="#f59e0b"/>\`;
  }

  document.getElementById('g').innerHTML=svg;
}

function trackMove(){
  if(done)return;
  moves=Math.min(4,moves+1);
  document.getElementById('ec').textContent=moves;
  if(moves>=4){
    document.getElementById('hint').style.display='none';
    document.getElementById('quiz').classList.add('show');
  }
  draw();
}

function answer(el,type){
  if(done)return;
  const opts=document.querySelectorAll('.opt');
  opts.forEach(o=>o.onclick=null);
  el.classList.add(type);
  if(type==='correct'){
    done=true;
    document.getElementById('exp').style.display='block';
    setTimeout(()=>window.parent.postMessage({type:'LAB_COMPLETE',score:100},'*'),1200);
  } else {
    el.textContent+=' ✗';
  }
}

document.getElementById('ss').oninput=trackMove;
document.getElementById('ds').oninput=trackMove;
draw();
</script>
</body>
</html>`;
