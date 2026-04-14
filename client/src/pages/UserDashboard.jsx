import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import { GLOBAL_CSS, C, getStage, STAGE } from "../components/DesignSystem";

function ScoreArc({ score, color, size = 180 }) {
  const [v, setV] = useState(0);
  const R = size * 0.37, circ = 2 * Math.PI * R;
  useEffect(() => {
    let cur = 0;
    const go = () => { cur += (score - cur) * 0.08; setV(Math.round(cur * 10) / 10); if (Math.abs(score - cur) > 0.2) requestAnimationFrame(go); };
    const t = setTimeout(() => requestAnimationFrame(go), 400);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div style={{ position:"relative", width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={circ - (v / 100) * circ}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset .05s", filter:`drop-shadow(0 0 8px ${color}55)` }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:size * 0.22, color, lineHeight:1, fontWeight:300 }}>{Math.round(v)}</div>
        <div style={{ fontSize:11, color:C.textFaint, marginTop:2 }}>/100</div>
      </div>
    </div>
  );
}

function SideNav({ user, logout }) {
  const navigate = useNavigate();
  const [sid, setSid] = useState(null);
  const startAssessment = async (path) => {
    try { const { data } = await userAPI.startSession(); navigate(`${path}?session_id=${data.session?.id||""}`); }
    catch { navigate(path); }
  };
  const links = [
    { icon:"🏠", label:"Dashboard",   path:"/dashboard",      active:true,  session:false },
    { icon:"📈", label:"Progression", path:"/progression",    active:false, session:false },
    { icon:"📄", label:"Reports",     path:"/reports",        active:false, session:false },
    { icon:"👤", label:"Demographics",path:"/demographics",   active:false, session:true  },
    { icon:"🧠", label:"Cognitive",   path:"/cognitive-test", active:false, session:true  },
    { icon:"🔬", label:"MRI Upload",  path:"/mri-upload",     active:false, session:true  },
    { icon:"⚙️", label:"Settings",    path:"/settings",       active:false, session:false },
  ];
  return (
    <div className="sidenav">
      <div style={{ padding:"22px 18px 18px", borderBottom:`1px solid ${C.border}`, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.teal},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:16, color:"#040C1A", fontWeight:600, flexShrink:0 }}>N</div>
          <div><div style={{ fontSize:14, fontWeight:700, color:C.white }}>NeuroScan</div><div style={{ fontSize:10, color:C.textFaint }}>Patient Portal</div></div>
        </div>
      </div>
      <div style={{ flex:1, padding:"0 8px" }}>
        {links.map(({ icon, label, path, active, session }) => (
          <div key={label} className={`nav-item ${active ? "active" : ""}`}
            onClick={() => session ? startAssessment(path) : navigate(path)}
            style={{ color: active ? C.teal : C.textDim }}>
            <div className="icon" style={{ background: active ? `${C.teal}20` : "rgba(255,255,255,0.04)", fontSize:15 }}>{icon}</div>
            <span>{label}</span>
            {active && <div style={{ width:5, height:5, borderRadius:"50%", background:C.teal, marginLeft:"auto", flexShrink:0 }} />}
          </div>
        ))}
      </div>
      <div style={{ padding:"12px 8px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ padding:"10px 14px", borderRadius:12, background:"rgba(255,255,255,0.03)", marginBottom:8 }}>
          <div style={{ fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</div>
          <div style={{ fontSize:11, color:C.textFaint, overflow:"hidden", textOverflow:"ellipsis" }}>{user?.email}</div>
        </div>
        <button onClick={logout} style={{ width:"100%", padding:"9px 14px", background:"rgba(255,77,109,0.07)", border:"1px solid rgba(255,77,109,0.15)", borderRadius:10, color:C.coral, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <span>🚪</span>Sign out
        </button>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [data, setData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS + `
.main-scroll{flex:1;overflow-y:auto;padding:36px;}
.stat-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.dash-card{background:rgba(7,18,32,0.55);border:1px solid ${C.border};border-radius:20px;padding:22px 24px;transition:border-color .2s;}
.dash-card:hover{border-color:${C.borderHi};}
.bar{height:100%;border-radius:99px 99px 0 0;transition:height .7s cubic-bezier(.22,.68,0,1);}
@media(max-width:900px){.stat-grid-4{grid-template-columns:1fr 1fr;}}
    `;
    document.head.appendChild(s);
    userAPI.getDashboard().then(({ data: d }) => setData(d)).catch(() => {}).finally(() => setLoading(false));
    return () => document.head.removeChild(s);
  }, []);

  const startNew = async () => {
    setStarting(true);
    try { const { data: sd } = await userAPI.startSession(); navigate(`/demographics?session_id=${sd.session?.id}`); }
    catch { setStarting(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <SideNav user={user} logout={logout} />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div className="spin" style={{ width:32, height:32, border:`3px solid rgba(0,212,170,0.15)`, borderTopColor:C.teal, borderRadius:"50%" }} />
        <div style={{ fontSize:14, color:C.textDim }}>Loading dashboard…</div>
      </div>
    </div>
  );

  const ls   = data?.latest_session;
  const sm   = ls ? getStage(ls.stage_label) : null;
  const prog = data?.progression;
  const trend = data?.session_trend || [];
  const rec  = data?.recommendation;

  const kpis = [
    { label:"Total Sessions",  value: trend.length || 0,                       sub:"completed",        color:C.blue,   icon:"📋" },
    { label:"Latest AD Risk",  value: ls ? `${(ls.final_ad_percentage||0).toFixed(0)}%` : "—", sub:sm?.short||"No data", color:sm?.c||C.textDim, icon:"🎯" },
    { label:"Cognitive Score", value: ls ? `${Math.round(100-(ls.final_ad_percentage||0))}` : "—", sub:"estimated",  color:C.violet, icon:"🧠" },
    { label:"Progression",     value: prog ? `${prog.delta_ad_percentage>0?"+":""}${prog.delta_ad_percentage?.toFixed(1)}%` : "—", sub:prog?.progression_label||"No history", color: prog?.delta_ad_percentage>0 ? C.coral : prog?.delta_ad_percentage<0 ? C.teal : C.amber, icon:"📈" },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <SideNav user={user} logout={logout} />
      <div className="main-scroll">

        {/* Header */}
        <div className="au" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32, flexWrap:"wrap", gap:16 }}>
          <div>
            <span className="section-tag">Patient Portal</span>
            <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:300, color:C.white, lineHeight:1.1 }}>
              Good day,<br /><em style={{ color:C.teal }}>{user?.name?.split(" ")[0]}</em>
            </h1>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:6 }}>
            {ls && <button className="btn-ghost" onClick={() => navigate(`/results/${ls.id}`)} style={{ padding:"10px 18px" }}>View Results</button>}
            <button className="btn-primary" onClick={startNew} disabled={starting} style={{ padding:"10px 22px" }}>
              {starting ? <><div className="spin" style={{ width:14, height:14, border:"2px solid rgba(4,12,26,0.3)", borderTopColor:"#040C1A", borderRadius:"50%" }} />Starting…</> : "+ New Assessment"}
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="stat-grid-4 au d1" style={{ marginBottom:24 }}>
          {kpis.map((k, i) => (
            <div key={i} className="stat-card" style={{ background:"rgba(7,18,32,0.55)", border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:C.textDim }}>{k.label}</div>
                <span style={{ fontSize:18 }}>{k.icon}</span>
              </div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:34, fontWeight:300, color:k.color, lineHeight:1, marginBottom:6 }}>{k.value}</div>
              <div style={{ fontSize:12, color:C.textFaint }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div className="au d2" style={{ display:"flex", gap:20, marginBottom:24, flexWrap:"wrap" }}>

          {/* Score arc */}
          <div className="dash-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:220, flex:"0 0 220px", justifyContent:"center" }}>
            {ls ? (
              <>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:C.textDim, marginBottom:16 }}>AD Risk Score</div>
                <ScoreArc score={ls.final_ad_percentage || 0} color={sm?.c || C.teal} />
                <div style={{ marginTop:16, padding:"6px 18px", borderRadius:99, background:sm?.bg, border:`1px solid ${sm?.c}44`, color:sm?.c, fontSize:12, fontWeight:700, textAlign:"center" }}>{sm?.short || "—"}</div>
                <div style={{ fontSize:11, color:C.textFaint, marginTop:8 }}>{new Date(ls.created_at).toLocaleDateString("en",{day:"numeric",month:"long",year:"numeric"})}</div>
              </>
            ) : (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:14, opacity:.15 }}>🧠</div>
                <div style={{ fontSize:14, color:C.textDim, lineHeight:1.7, marginBottom:20 }}>No assessment yet.<br />Start your first one.</div>
                <button className="btn-primary" onClick={startNew} style={{ padding:"10px 22px" }}>Begin →</button>
              </div>
            )}
          </div>

          {/* Trend chart */}
          <div className="dash-card" style={{ flex:1, minWidth:260 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div><div style={{ fontWeight:700, color:C.white, fontSize:15 }}>AD Risk Trend</div><div style={{ fontSize:12, color:C.textDim, marginTop:3 }}>Session history</div></div>
              {trend.length > 0 && <div className="badge badge-teal">{trend.length} sessions</div>}
            </div>
            {trend.length >= 2 ? (
              <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:90, marginTop:16 }}>
                {trend.slice(-10).map((s, i) => {
                  const tsm = getStage(s.stage);
                  const pct = (s.ad_percentage || 0) / 100 * 80;
                  const isLast = i === Math.min(trend.length, 10) - 1;
                  return (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                      <div style={{ fontSize:8, color:C.textFaint, fontFamily:"'JetBrains Mono',monospace" }}>{Math.round(s.ad_percentage||0)}</div>
                      <div style={{ width:"100%", height:Math.max(pct, 4), borderRadius:"4px 4px 0 0", background: isLast ? tsm.c : `${tsm.c}55`, border: isLast ? `1px solid ${tsm.c}` : "none", transition:"height .5s ease" }} />
                      <div style={{ fontSize:7, color:C.textFaint }}>{new Date(s.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:90, color:C.textFaint, fontSize:13 }}>
                Complete 2+ assessments to see trend
              </div>
            )}
          </div>

          {/* Progression */}
          <div className="dash-card" style={{ flex:"0 0 200px", minWidth:180 }}>
            <div style={{ fontWeight:700, color:C.white, fontSize:15, marginBottom:4 }}>Progression</div>
            <div style={{ fontSize:12, color:C.textDim, marginBottom:18 }}>vs previous session</div>
            {prog ? (
              <>
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:52, fontWeight:300, lineHeight:1, color: prog.delta_ad_percentage>0 ? C.coral : prog.delta_ad_percentage<0 ? C.teal : C.amber }}>
                    {prog.delta_ad_percentage>0 ? "↑" : prog.delta_ad_percentage<0 ? "↓" : "→"}
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.white, marginTop:8 }}>{prog.progression_label}</div>
                </div>
                {[["AD Change", `${prog.delta_ad_percentage>0?"+":""}${prog.delta_ad_percentage?.toFixed(1)}%`, prog.delta_ad_percentage>0?C.coral:C.teal]].map(([l,v,c]) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.textDim }}>{l}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ color:C.textFaint, fontSize:13, textAlign:"center", paddingTop:16 }}>2+ sessions needed</div>
            )}
          </div>
        </div>

        {/* Recommendations + session history */}
        <div className="au d3" style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          <div className="dash-card" style={{ flex:2, minWidth:280 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div><div style={{ fontWeight:700, color:C.white, fontSize:15 }}>Recommendations</div><div style={{ fontSize:12, color:C.textDim, marginTop:3 }}>Personalised to your risk profile</div></div>
              {rec && <div className="badge badge-teal">{rec.total_items} items</div>}
            </div>
            {rec?.flat_list?.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {rec.flat_list.slice(0, 4).map((item, i) => {
                  const cats = { Medical:C.coral, Lifestyle:C.teal, Cognitive:C.violet, Social:C.gold };
                  const cc = cats[item.category] || C.teal;
                  return (
                    <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}` }}>
                      <div style={{ width:3, borderRadius:99, background:cc, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:cc, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>{item.category}</div>
                        <div style={{ fontSize:12, color:C.textDim, lineHeight:1.6 }}>{item.advice.substring(0,130)}{item.advice.length>130?"…":""}</div>
                      </div>
                    </div>
                  );
                })}
                <button className="btn-ghost" onClick={() => navigate("/progression")} style={{ padding:"9px", fontSize:12, textAlign:"center" }}>View all recommendations →</button>
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:"28px", color:C.textFaint, fontSize:13, lineHeight:1.7 }}>Complete your first assessment<br />to receive personalised recommendations.</div>
            )}
          </div>

          <div className="dash-card" style={{ flex:1, minWidth:220 }}>
            <div style={{ fontWeight:700, color:C.white, fontSize:15, marginBottom:4 }}>Session History</div>
            <div style={{ fontSize:12, color:C.textDim, marginBottom:18 }}>Recent assessments</div>
            {trend.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[...trend].reverse().slice(0, 5).map((s, i) => {
                  const ssm = getStage(s.stage);
                  return (
                    <div key={i} onClick={() => navigate(`/results/${s.session_id}`)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`, cursor:"pointer", transition:"border-color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
                      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                      <div style={{ width:34, height:34, borderRadius:10, background:ssm.bg, border:`1px solid ${ssm.c}33`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:16, color:ssm.c, flexShrink:0 }}>{ssm.g}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:C.white }}>{ssm.short}</div>
                        <div style={{ fontSize:11, color:C.textFaint }}>{new Date(s.date).toLocaleDateString("en",{day:"numeric",month:"short"})}</div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:ssm.c, fontFamily:"'JetBrains Mono',monospace" }}>{Math.round(s.ad_percentage||0)}%</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign:"center", color:C.textFaint, fontSize:13, padding:"20px 0" }}>No sessions yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
