// NeuroScan AI — Unified Design System v2
// Aesthetic: Bioluminescent Clinical Intelligence

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Figtree:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`;

export const C = {
  bg:         '#040C1A',
  s1:         '#071220',
  s2:         '#0B1A2E',
  s3:         '#101F35',
  border:     'rgba(120,160,255,0.08)',
  borderHi:   'rgba(120,160,255,0.16)',
  teal:       '#00D4AA',
  tealDim:    'rgba(0,212,170,0.10)',
  tealGlow:   'rgba(0,212,170,0.20)',
  gold:       '#F5B942',
  goldDim:    'rgba(245,185,66,0.12)',
  violet:     '#A78BFA',
  violetDim:  'rgba(167,139,250,0.10)',
  coral:      '#FF4D6D',
  coralDim:   'rgba(255,77,109,0.10)',
  amber:      '#FCA549',
  blue:       '#60A5FA',
  text:       '#D8E8FF',
  textDim:    'rgba(216,232,255,0.45)',
  textFaint:  'rgba(216,232,255,0.20)',
  white:      '#FFFFFF',
};

export const STAGE = {
  'Non-Demented / Healthy':       { c:'#00D4AA', bg:'rgba(0,212,170,0.08)',  g:'A', short:'Healthy',   risk:10 },
  'Very Mild Demented (MCI)':     { c:'#F5B942', bg:'rgba(245,185,66,0.08)', g:'B', short:'Very Mild', risk:35 },
  "Mild Alzheimer's Disease":     { c:'#FCA549', bg:'rgba(252,165,73,0.08)', g:'C', short:'Mild',      risk:65 },
  "Moderate Alzheimer's Disease": { c:'#FF4D6D', bg:'rgba(255,77,109,0.08)',  g:'D', short:'Moderate',  risk:90 },
};

export const getStage = (label) => STAGE[label] || STAGE['Non-Demented / Healthy'];

export const GLOBAL_CSS = `
${FONTS}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{
  font-family:'Figtree',sans-serif;
  background:${C.bg};
  color:${C.text};
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  overflow-x:hidden;
}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(120,160,255,0.15);border-radius:99px;}
::-webkit-scrollbar-thumb:hover{background:rgba(120,160,255,0.3);}
::selection{background:rgba(0,212,170,0.25);color:#fff;}
input,textarea,select{font-family:'Figtree',sans-serif;}
button{font-family:'Figtree',sans-serif;cursor:pointer;}
a{color:inherit;text-decoration:none;}

/* ── Keyframes ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes scanline{0%{top:-4px}100%{top:calc(100% + 4px)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,212,170,0.15)}50%{box-shadow:0 0 40px rgba(0,212,170,0.35)}}
@keyframes ripple{0%{transform:scale(0);opacity:.5}100%{transform:scale(4);opacity:0}}
@keyframes progressBar{from{width:0}to{width:var(--w,100%)}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* ── Utility animations ── */
.au{animation:fadeUp .5s cubic-bezier(.22,.68,0,1.1) both;}
.ai{animation:fadeIn .4s ease both;}
.si{animation:scaleIn .4s cubic-bezier(.22,.68,0,1.1) both;}
.d0{animation-delay:0s}
.d1{animation-delay:.08s}.d2{animation-delay:.16s}.d3{animation-delay:.24s}
.d4{animation-delay:.32s}.d5{animation-delay:.40s}.d6{animation-delay:.48s}
.d7{animation-delay:.56s}.d8{animation-delay:.64s}
.float{animation:float 4s ease-in-out infinite;}
.pulse{animation:pulse 2s ease-in-out infinite;}
.spin{animation:spin .8s linear infinite;}

/* ── Glass card ── */
.glass{
  background:rgba(7,18,32,0.7);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border:1px solid ${C.border};
}
.glass-hi{
  background:rgba(11,26,46,0.8);
  backdrop-filter:blur(24px);
  -webkit-backdrop-filter:blur(24px);
  border:1px solid ${C.borderHi};
}

/* ── Buttons ── */
.btn-primary{
  background:${C.teal};color:#040C1A;border:none;
  font-family:'Figtree',sans-serif;font-weight:700;
  padding:13px 28px;border-radius:12px;font-size:14px;
  cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px;
  position:relative;overflow:hidden;
}
.btn-primary:hover{background:#00EFC2;transform:translateY(-1px);box-shadow:0 8px 30px rgba(0,212,170,0.35);}
.btn-primary:active{transform:translateY(0);}
.btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none;}

.btn-ghost{
  background:transparent;border:1px solid ${C.borderHi};
  color:${C.textDim};font-family:'Figtree',sans-serif;font-weight:500;
  padding:11px 22px;border-radius:12px;font-size:14px;
  cursor:pointer;transition:all .2s;
}
.btn-ghost:hover{border-color:${C.teal};color:${C.teal};background:${C.tealDim};}

.btn-danger{
  background:rgba(255,77,109,0.1);border:1px solid rgba(255,77,109,0.25);
  color:${C.coral};font-family:'Figtree',sans-serif;font-weight:600;
  padding:11px 22px;border-radius:12px;font-size:14px;cursor:pointer;transition:all .2s;
}
.btn-danger:hover{background:rgba(255,77,109,0.18);border-color:rgba(255,77,109,0.45);}

/* ── Input ── */
.field{
  background:rgba(255,255,255,0.03);border:1px solid ${C.border};
  border-radius:12px;padding:12px 16px;font-size:14px;color:${C.text};
  width:100%;font-family:'Figtree',sans-serif;transition:all .2s;outline:none;
}
.field:focus{border-color:${C.teal};background:rgba(0,212,170,0.04);box-shadow:0 0 0 3px rgba(0,212,170,0.08);}
.field::placeholder{color:${C.textFaint};}
.field-label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${C.textDim};margin-bottom:8px;display:block;}

/* ── Badge ── */
.badge{
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;
  letter-spacing:.04em;
}
.badge-teal{background:${C.tealDim};border:1px solid rgba(0,212,170,0.2);color:${C.teal};}
.badge-gold{background:${C.goldDim};border:1px solid rgba(245,185,66,0.2);color:${C.gold};}
.badge-coral{background:${C.coralDim};border:1px solid rgba(255,77,109,0.2);color:${C.coral};}
.badge-amber{background:rgba(252,165,73,0.1);border:1px solid rgba(252,165,73,0.2);color:${C.amber};}
.badge-violet{background:${C.violetDim};border:1px solid rgba(167,139,250,0.2);color:${C.violet};}

/* ── Progress ── */
.progress-track{height:6px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;}
.progress-bar{height:100%;border-radius:99px;transition:width .8s cubic-bezier(.22,.68,0,1.1);}

/* ── Mesh grid background ── */
.mesh-bg{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(120,160,255,0.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(120,160,255,0.03) 1px,transparent 1px);
  background-size:48px 48px;
  pointer-events:none;
}

/* ── Sidebar nav ── */
.sidenav{
  width:236px;flex-shrink:0;
  background:linear-gradient(180deg,rgba(7,18,32,.95) 0%,rgba(4,12,26,.98) 100%);
  border-right:1px solid ${C.border};
  display:flex;flex-direction:column;
  position:sticky;top:0;height:100vh;overflow-y:auto;
}
.nav-item{
  display:flex;align-items:center;gap:10px;
  padding:10px 14px;margin:0 10px 2px;
  border-radius:10px;cursor:pointer;transition:all .2s;
  font-size:13px;font-weight:500;
}
.nav-item:hover{background:rgba(255,255,255,0.04);color:${C.text};}
.nav-item.active{background:rgba(0,212,170,0.1);color:${C.teal};}
.nav-item .icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}

/* ── Stat card ── */
.stat-card{
  background:rgba(11,26,46,0.6);border:1px solid ${C.border};
  border-radius:20px;padding:20px 24px;
  transition:border-color .2s,transform .2s;
}
.stat-card:hover{border-color:${C.borderHi};transform:translateY(-2px);}

/* ── Section tag ── */
.section-tag{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.teal};margin-bottom:6px;display:block;}
.section-title{font-family:'Fraunces',serif;font-weight:400;color:${C.white};line-height:1.1;}

/* ── Gradient text ── */
.grad-text{background:linear-gradient(135deg,${C.teal} 0%,${C.blue} 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.grad-gold{background:linear-gradient(135deg,${C.gold} 0%,${C.amber} 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

/* ── Toast ── */
.toast{
  position:fixed;bottom:28px;right:28px;z-index:9999;
  padding:14px 20px;border-radius:14px;font-size:13px;font-weight:500;
  display:flex;align-items:center;gap:10px;
  animation:fadeUp .3s cubic-bezier(.22,.68,0,1.1);
  min-width:260px;max-width:420px;
  backdrop-filter:blur(20px);
}
.toast-success{background:rgba(0,212,170,0.12);border:1px solid rgba(0,212,170,0.25);color:${C.teal};}
.toast-error  {background:rgba(255,77,109,0.12);border:1px solid rgba(255,77,109,0.25);color:${C.coral};}
.toast-info   {background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.25);color:${C.blue};}

/* ── Responsive ── */
@media(max-width:900px){
  .sidenav{display:none;}
  .main-scroll{padding:20px!important;}
}
@media(max-width:640px){
  .stat-grid-4{grid-template-columns:1fr 1fr!important;}
  .two-col{flex-direction:column!important;}
}
`;
