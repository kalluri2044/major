import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const T = {
  navy:"#0a1628", teal:"#00d4aa", tealDim:"rgba(0,212,170,0.12)",
  border:"rgba(255,255,255,0.08)", slate:"rgba(255,255,255,0.45)",
  slateD:"rgba(255,255,255,0.22)", navyCard:"rgba(255,255,255,0.04)",
  red:"#ff6b6b", amber:"#fbbf24", orange:"#fb923c",
};

const STAGE_META = {
  "Non-Demented / Healthy":       { color:"#00d4aa", grade:"A", short:"Healthy" },
  "Very Mild Demented (MCI)":     { color:"#fbbf24", grade:"B", short:"V.Mild" },
  "Mild Alzheimer's Disease":     { color:"#fb923c", grade:"C", short:"Mild" },
  "Moderate Alzheimer's Disease": { color:"#ff6b6b", grade:"D", short:"Moderate" },
};
const getStage = (l) => STAGE_META[l] || { color:T.teal, grade:"?", short:"Unknown" };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#0a1628;color:#fff;-webkit-font-smoothing:antialiased;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.au{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.1) both}
.d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
@media(max-width:860px){.prog-layout{flex-direction:column!important;}.prog-sidenav{width:100%!important;height:auto!important;flex-direction:row!important;position:relative!important;overflow-x:auto;}}
@media(max-width:640px){.prog-grid{grid-template-columns:1fr!important;}}
`;

function SideNav({ active }) {
  const { logout } = useAuth();
  return (
    <div className="prog-sidenav" style={{ width:220, flexShrink:0, background:"rgba(0,0,0,0.3)", borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", padding:"28px 0", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
      <div style={{ padding:"0 22px 24px", borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:T.teal, color:T.navy, fontFamily:"'Instrument Serif',serif", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>N</div>
          <div><div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>NeuroScan</div><div style={{ fontSize:10, color:T.slateD }}>Patient Portal</div></div>
        </div>
      </div>
      {[["📊","Dashboard","/dashboard",""],["📈","Progression","/progression","prog"],["📄","Reports","/reports",""],["🧠","Cognitive","/cognitive-test",""],["🔬","MRI","/mri-upload",""]].map(([ic,lb,hr,id])=>(
        <a key={lb} href={hr} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", margin:"0 8px 2px", borderRadius:10, background:id==="prog"?T.tealDim:"transparent", textDecoration:"none" }}>
          <span style={{ fontSize:16 }}>{ic}</span>
          <span style={{ fontSize:13, fontWeight:id==="prog"?600:400, color:id==="prog"?T.teal:"rgba(255,255,255,0.4)" }}>{lb}</span>
          {id==="prog" && <div style={{ width:5, height:5, borderRadius:"50%", background:T.teal, marginLeft:"auto" }} />}
        </a>
      ))}
      <div style={{ marginTop:"auto", padding:"18px 14px 0", borderTop:`1px solid ${T.border}` }}>
        <button onClick={logout} style={{ width:"100%", padding:"9px 14px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:9, color:T.red, fontSize:13, cursor:"pointer" }}>🚪 Sign Out</button>
      </div>
    </div>
  );
}

function LineChart({ sessions }) {
  if (!sessions?.length) return null;
  const W = 600, H = 160, PAD = { t:10, r:20, b:30, l:36 };
  const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  const vals = sessions.map(s => s.ad_percentage || 0);
  const minV = Math.max(0, Math.min(...vals) - 5);
  const maxV = Math.min(100, Math.max(...vals) + 5);
  const scaleX = i => PAD.l + (i / (sessions.length - 1 || 1)) * cW;
  const scaleY = v => PAD.t + cH - ((v - minV) / (maxV - minV || 1)) * cH;

  const pts = sessions.map((s, i) => `${scaleX(i)},${scaleY(s.ad_percentage||0)}`).join(" ");
  const area = `M${scaleX(0)},${H-PAD.b} ` + sessions.map((s,i) => `L${scaleX(i)},${scaleY(s.ad_percentage||0)}`).join(" ") + ` L${scaleX(sessions.length-1)},${H-PAD.b} Z`;

  const yLines = [0, 25, 50, 75, 100].filter(v => v >= minV - 5 && v <= maxV + 5);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.teal} stopOpacity="0.25" />
          <stop offset="100%" stopColor={T.teal} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {yLines.map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={scaleY(v)} x2={W-PAD.r} y2={scaleY(v)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4,4" />
          <text x={PAD.l-6} y={scaleY(v)+4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end" fontFamily="DM Mono">{v}</text>
        </g>
      ))}
      {/* Stage zone bands */}
      <rect x={PAD.l} y={scaleY(25)} width={cW} height={scaleY(0)-scaleY(25)} fill="rgba(0,212,170,0.03)" />
      <rect x={PAD.l} y={scaleY(50)} width={cW} height={scaleY(25)-scaleY(50)} fill="rgba(251,191,36,0.03)" />
      <rect x={PAD.l} y={scaleY(75)} width={cW} height={scaleY(50)-scaleY(75)} fill="rgba(251,146,60,0.03)" />
      <rect x={PAD.l} y={scaleY(100)} width={cW} height={scaleY(75)-scaleY(100)} fill="rgba(255,107,107,0.03)" />
      {/* Area fill */}
      <path d={area} fill="url(#areaGrad)" />
      {/* Line */}
      <polyline points={pts} fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {sessions.map((s, i) => {
        const sm = getStage(s.stage);
        const cx = scaleX(i), cy = scaleY(s.ad_percentage || 0);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="5" fill={sm.color} stroke={T.navy} strokeWidth="2" />
            <text x={cx} y={H - PAD.b + 16} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle" fontFamily="DM Mono">
              {new Date(s.date).toLocaleDateString("en", { month:"short", day:"numeric" })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Progression() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [progRecords, setProgRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
    Promise.all([
      api.get("/user/sessions"),
      api.get("/user/progression"),
    ]).then(([sessRes, progRes]) => {
      const completed = sessRes.data.sessions.filter(s => s.is_complete);
      setSessions(completed);
      setProgRecords(progRes.data.progression || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => document.head.removeChild(s);
  }, []);

  const trendData = sessions.map(s => ({ ad_percentage: s.final_ad_percentage, stage: s.stage_label, date: s.created_at, session_id: s.id })).reverse();
  const sel = sessions[selectedIdx];
  const selStage = sel ? getStage(sel.stage_label) : null;
  const latestProg = progRecords[0];

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:T.navy }}>
      <div style={{ width:28, height:28, border:`3px solid rgba(0,212,170,0.2)`, borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.navy }} className="prog-layout">
      <SideNav />

      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"32px 32px 0" }}>
          <div className="au">
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", color:T.teal, marginBottom:5, textTransform:"uppercase" }}>Disease Tracking</div>
            <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:36, color:"#fff", fontWeight:400, lineHeight:1.1, marginBottom:6 }}>
              Progression<br /><em style={{ color:T.teal }}>Analysis</em>
            </h1>
            <p style={{ fontSize:13, color:T.slate }}>{sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded</p>
          </div>
        </div>

        <div style={{ padding:"24px 32px 40px", display:"flex", flexDirection:"column", gap:20 }}>

          {/* Summary badges */}
          {latestProg && (
            <div className="au" style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {[
                { label:"Latest AD%",     val:`${(sessions[0]?.final_ad_percentage||0).toFixed(1)}%`,  color:selStage?.color||T.teal },
                { label:"Change",         val:`${latestProg.delta_ad_percentage>0?"+":""}${latestProg.delta_ad_percentage?.toFixed(1)}%`, color:latestProg.delta_ad_percentage>0?T.red:T.teal },
                { label:"Trend",          val:latestProg.progression_label,  color:latestProg.delta_ad_percentage>0?T.red:latestProg.delta_ad_percentage<0?T.teal:T.amber },
                { label:"Cognitive Δ",    val:`${latestProg.delta_cognitive>0?"+":""}${latestProg.delta_cognitive?.toFixed(1)}`, color:latestProg.delta_cognitive<0?T.red:T.teal },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ padding:"12px 18px", background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:12 }}>
                  <div style={{ fontSize:10, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>{label}</div>
                  <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:22, color, lineHeight:1 }}>{val}</div>
                </div>
              ))}
              <div style={{ padding:"12px 18px", background:`${latestProg.delta_ad_percentage>0?"rgba(255,107,107,0.08)":"rgba(0,212,170,0.08)"}`, border:`1px solid ${latestProg.delta_ad_percentage>0?"rgba(255,107,107,0.2)":"rgba(0,212,170,0.2)"}`, borderRadius:12, maxWidth:340 }}>
                <div style={{ fontSize:10, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Analysis</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{latestProg.trend_details}</div>
              </div>
            </div>
          )}

          {/* Line chart */}
          <div className="au d1" style={{ background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:20, padding:"22px 24px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:3 }}>AD Risk Over Time</div>
                <div style={{ fontSize:12, color:T.slateD }}>All completed sessions</div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {[{ c:"#00d4aa",l:"Healthy" },{ c:"#fbbf24",l:"V.Mild" },{ c:"#fb923c",l:"Mild" },{ c:"#ff6b6b",l:"Moderate" }].map(({ c,l }) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:c }} />
                    <span style={{ fontSize:10, color:T.slateD }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            {trendData.length >= 2 ? <LineChart sessions={trendData} /> : (
              <div style={{ textAlign:"center", padding:"28px", color:T.slateD, fontSize:13 }}>Complete at least 2 assessments to see the trend chart.</div>
            )}
          </div>

          {/* Session selector + detail */}
          {sessions.length > 0 && (
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              {/* Session list */}
              <div className="au d2" style={{ width:240, flexShrink:0, background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:20, padding:20, display:"flex", flexDirection:"column", gap:8, maxHeight:400, overflowY:"auto" }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Sessions</div>
                {sessions.map((s, i) => {
                  const sm2 = getStage(s.stage_label);
                  const isSel = i === selectedIdx;
                  return (
                    <div key={s.id} onClick={() => setSelectedIdx(i)} style={{ padding:"11px 13px", borderRadius:11, border:`1px solid ${isSel?`${sm2.color}44`:T.border}`, background:isSel?`${sm2.color}0a`:"rgba(255,255,255,0.02)", cursor:"pointer", transition:"all 0.15s" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ fontSize:12, fontWeight:isSel?600:400, color:isSel?"#fff":"rgba(255,255,255,0.6)" }}>Session #{s.id}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:sm2.color }}>{(s.final_ad_percentage||0).toFixed(1)}%</div>
                      </div>
                      <div style={{ fontSize:10, color:T.slateD, marginTop:3 }}>{new Date(s.created_at).toLocaleDateString("en",{day:"numeric",month:"short",year:"numeric"})}</div>
                      <div style={{ marginTop:5, padding:"2px 8px", display:"inline-block", borderRadius:99, background:`${sm2.color}18`, color:sm2.color, fontSize:10, fontWeight:600 }}>{sm2.short}</div>
                    </div>
                  );
                })}
              </div>

              {/* Session detail */}
              {sel && (
                <div className="au d3" style={{ flex:1, minWidth:260, background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:20, padding:22 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>Session #{sel.id}</div>
                      <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, color:selStage.color, lineHeight:1 }}>{sel.stage_label}</div>
                      <div style={{ fontSize:12, color:T.slateD, marginTop:4 }}>{new Date(sel.created_at).toLocaleDateString("en",{ weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
                    </div>
                    <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:44, color:selStage.color, opacity:0.3 }}>{selStage.grade}</div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }} className="prog-grid">
                    {[
                      ["AD Risk Score", `${(sel.final_ad_percentage||0).toFixed(1)}%`, selStage.color],
                      ["Stage",         selStage.short, selStage.color],
                      ["Completed",     sel.is_complete?"Yes":"No", sel.is_complete?T.teal:T.slateD],
                      ["Session ID",    `#${sel.id}`, T.slateD],
                    ].map(([l,v,c]) => (
                      <div key={l} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:10, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{l}</div>
                        <div style={{ fontSize:16, fontWeight:600, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* AD gauge */}
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.slateD, marginBottom:6 }}>
                      <span>AD Risk Gauge</span><span style={{ color:"rgba(255,255,255,0.65)", fontWeight:600 }}>{(sel.final_ad_percentage||0).toFixed(1)}/100</span>
                    </div>
                    <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${sel.final_ad_percentage||0}%`, background:selStage.color, borderRadius:99, transition:"width 0.6s ease" }} />
                    </div>
                  </div>

                  <div style={{ marginTop:16, display:"flex", gap:8 }}>
                    <button onClick={() => navigate(`/reports`)} style={{ flex:1, padding:"10px", background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:9, color:T.slateD, fontSize:12, cursor:"pointer" }}>
                      📄 View Report
                    </button>
                    <button onClick={() => (async()=>{try{const{data}=await api.post("/user/sessions");navigate(`/demographics?session_id=${data.session?.id||""}`)}catch{navigate("/demographics")}})()} style={{ flex:1, padding:"10px", background:T.tealDim, border:`1px solid rgba(0,212,170,0.3)`, borderRadius:9, color:T.teal, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                      + New Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {sessions.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px", background:T.navyCard, borderRadius:20, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:44, marginBottom:16, opacity:0.2 }}>📈</div>
              <div style={{ fontSize:16, color:"rgba(255,255,255,0.3)", marginBottom:20 }}>No sessions yet</div>
              <button onClick={() => (async()=>{try{const{data}=await api.post("/user/sessions");navigate(`/demographics?session_id=${data.session?.id||""}`)}catch{navigate("/demographics")}})()} style={{ padding:"12px 24px", background:T.teal, color:T.navy, border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Start First Assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
