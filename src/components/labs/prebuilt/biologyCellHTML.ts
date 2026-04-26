/* eslint-disable */
export const BIOLOGY_CELL_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;padding:12px;font-size:13px}
h1{font-size:15px;font-weight:800;color:#f1f5f9;margin-bottom:2px}
.sub{font-size:11px;color:#64748b;margin-bottom:10px}
.layout{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start}
.panel{background:#1e293b;border-radius:10px;padding:10px;min-width:130px}
.panel h2{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px}
.organelle{border:1.5px solid rgba(255,255,255,.12);border-radius:7px;padding:7px 10px;font-size:12px;cursor:pointer;margin-bottom:5px;transition:all .15s;user-select:none}
.organelle:hover{border-color:rgba(99,102,241,.6);background:rgba(99,102,241,.08)}
.organelle.selected{border-color:#6366f1;background:rgba(99,102,241,.18);color:#a5b4fc}
.organelle.placed{border-color:rgba(255,255,255,.06);color:#475569;cursor:default;font-style:italic}
.cell-wrap{background:#1e293b;border-radius:10px;padding:10px}
svg{width:100%;display:block;max-height:320px}
.zone{cursor:pointer;transition:opacity .15s}
.zone:hover ellipse,.zone:hover circle,.zone:hover rect{opacity:.85}
.zone-label{font-size:9px;fill:#94a3b8;text-anchor:middle;pointer-events:none}
.zone-name{font-size:8.5px;fill:#64748b;text-anchor:middle;pointer-events:none}
.score-bar{margin-top:10px;text-align:center;font-size:11px;color:#64748b}
.score-val{color:#f1f5f9;font-weight:700}
.success{display:none;margin-top:10px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:12px;text-align:center;font-size:12px;color:#6ee7b7}
</style>
</head>
<body>
<h1>🔬 Build the Cell</h1>
<p class="sub">Select an organelle, then click its correct location in the cell</p>

<div class="layout">
  <div class="panel">
    <h2>Organelles</h2>
    <div class="organelle" id="org-nucleus" onclick="select('nucleus')">🔵 Nucleus</div>
    <div class="organelle" id="org-mito" onclick="select('mito')">⚡ Mitochondria</div>
    <div class="organelle" id="org-ribo" onclick="select('ribo')">🟠 Ribosome</div>
    <div class="organelle" id="org-chloro" onclick="select('chloro')">🌿 Chloroplast</div>
    <div class="organelle" id="org-golgi" onclick="select('golgi')">🌀 Golgi Apparatus</div>
    <div class="organelle" id="org-er" onclick="select('er')">🔗 Endoplasmic Reticulum</div>
  </div>

  <div class="cell-wrap">
    <svg viewBox="0 0 260 300" id="cellsvg">
      <!-- Cell outer membrane -->
      <ellipse cx="130" cy="155" rx="118" ry="138" fill="#0d1f3c" stroke="#334155" stroke-width="2.5"/>
      <!-- Cell inner fill -->
      <ellipse cx="130" cy="155" rx="113" ry="133" fill="#0f2038"/>

      <!-- Zone: Nucleus (center) -->
      <g class="zone" id="z-nucleus" onclick="place('nucleus')">
        <circle cx="130" cy="148" r="34" fill="#1e293b" stroke="#475569" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text class="zone-label" x="130" y="144">Control</text>
        <text class="zone-name" x="130" y="155">Center</text>
        <text class="zone-label" x="130" y="165">❓</text>
      </g>

      <!-- Zone: Mitochondria (upper right) -->
      <g class="zone" id="z-mito" onclick="place('mito')">
        <ellipse cx="186" cy="100" rx="28" ry="16" fill="#1e293b" stroke="#475569" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text class="zone-label" x="186" y="97">Energy</text>
        <text class="zone-name" x="186" y="107">Producer ❓</text>
      </g>

      <!-- Zone: Ribosome (lower left area) -->
      <g class="zone" id="z-ribo" onclick="place('ribo')">
        <circle cx="82" cy="200" r="18" fill="#1e293b" stroke="#475569" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text class="zone-label" x="82" y="197">Protein</text>
        <text class="zone-name" x="82" y="207">Factory ❓</text>
      </g>

      <!-- Zone: Chloroplast (left) -->
      <g class="zone" id="z-chloro" onclick="place('chloro')">
        <ellipse cx="72" cy="118" rx="26" ry="16" fill="#1e293b" stroke="#475569" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text class="zone-label" x="72" y="115">Light</text>
        <text class="zone-name" x="72" y="125">Absorber ❓</text>
      </g>

      <!-- Zone: Golgi (lower right) -->
      <g class="zone" id="z-golgi" onclick="place('golgi')">
        <ellipse cx="182" cy="208" rx="30" ry="17" fill="#1e293b" stroke="#475569" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text class="zone-label" x="182" y="205">Shipping</text>
        <text class="zone-name" x="182" y="215">Center ❓</text>
      </g>

      <!-- Zone: ER (upper left) -->
      <g class="zone" id="z-er" onclick="place('er')">
        <ellipse cx="94" cy="72" rx="28" ry="14" fill="#1e293b" stroke="#475569" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text class="zone-label" x="94" y="69">Transport</text>
        <text class="zone-name" x="94" y="79">Network ❓</text>
      </g>
    </svg>

    <div class="score-bar">Placed: <span class="score-val" id="placed">0</span> / 6</div>
  </div>
</div>

<div class="success" id="success">
  🏆 <strong>Excellent!</strong> You've correctly placed all 6 organelles!<br>
  <small style="color:#94a3b8;margin-top:4px;display:block">Each organelle has a specialized function that keeps the cell alive.</small>
</div>

<script>
const MATCHES={nucleus:'nucleus',mito:'mito',ribo:'ribo',chloro:'chloro',golgi:'golgi',er:'er'};
const COLORS={nucleus:'#6366f1',mito:'#f59e0b',ribo:'#f97316',chloro:'#22c55e',golgi:'#ec4899',er:'#06b6d4'};
const LABELS={
  nucleus:['Control','Center','🔵'],
  mito:['Energy','Producer','⚡'],
  ribo:['Protein','Factory','🟠'],
  chloro:['Light','Absorber','🌿'],
  golgi:['Shipping','Center','🌀'],
  er:['Transport','Network','🔗']
};
const NAMES={nucleus:'Nucleus',mito:'Mitochondria',ribo:'Ribosome',chloro:'Chloroplast',golgi:'Golgi Body',er:'ER'};

let selected=null;
let placed=0;
const placedSet=new Set();

function select(id){
  if(placedSet.has(id))return;
  document.querySelectorAll('.organelle').forEach(el=>el.classList.remove('selected'));
  selected=id;
  document.getElementById('org-'+id).classList.add('selected');
}

function place(zoneId){
  if(!selected)return;
  const correct=MATCHES[selected]===zoneId;
  if(correct){
    placedSet.add(selected);
    // Update zone visually
    const zone=document.getElementById('z-'+zoneId);
    const color=COLORS[selected];
    const [l1,l2,icon]=LABELS[zoneId];
    const name=NAMES[selected];
    // Replace zone content
    const shapes={
      nucleus:\`<circle cx="130" cy="148" r="34" fill="\${color}22" stroke="\${color}" stroke-width="2"/>\`,
      mito:\`<ellipse cx="186" cy="100" rx="28" ry="16" fill="\${color}22" stroke="\${color}" stroke-width="2"/>\`,
      ribo:\`<circle cx="82" cy="200" r="18" fill="\${color}22" stroke="\${color}" stroke-width="2"/>\`,
      chloro:\`<ellipse cx="72" cy="118" rx="26" ry="16" fill="\${color}22" stroke="\${color}" stroke-width="2"/>\`,
      golgi:\`<ellipse cx="182" cy="208" rx="30" ry="17" fill="\${color}22" stroke="\${color}" stroke-width="2"/>\`,
      er:\`<ellipse cx="94" cy="72" rx="28" ry="14" fill="\${color}22" stroke="\${color}" stroke-width="2"/>\`
    };
    // Re-render the zone group without onclick, showing placed name
    const centers={nucleus:[130,148],mito:[186,100],ribo:[82,200],chloro:[72,118],golgi:[182,208],er:[94,72]};
    const [cx,cy]=centers[zoneId];
    zone.innerHTML=shapes[zoneId]+
      \`<text class="zone-label" x="\${cx}" y="\${cy-4}" fill="\${color}" font-size="9">\${icon} \${name}</text>
       <text class="zone-name" x="\${cx}" y="\${cy+8}" fill="\${color}" font-size="8.5">✓ placed</text>\`;
    zone.onclick=null;
    zone.style.cursor='default';

    // Mark organelle as placed
    const el=document.getElementById('org-'+selected);
    el.classList.remove('selected');
    el.classList.add('placed');
    el.textContent=icon+' '+NAMES[selected]+' ✓';

    selected=null;
    placed++;
    document.getElementById('placed').textContent=placed;
    if(placed===6){
      document.getElementById('success').style.display='block';
      setTimeout(()=>window.parent.postMessage({type:'LAB_COMPLETE',score:100},'*'),800);
    }
  } else {
    // Wrong — flash the zone
    const zone=document.getElementById('z-'+zoneId);
    zone.style.opacity='0.3';
    setTimeout(()=>zone.style.opacity='',500);
  }
}
</script>
</body>
</html>`;
