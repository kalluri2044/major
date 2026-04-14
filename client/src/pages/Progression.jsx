import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getStage } from "../components/DesignSystem";

function SideNav() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const startAssessment = async (path) => {
    try { const { data } = await api.post("/user/sessions"); navigate(`${path}?session_id=${data.session?.id||""}`); }
    catch { navigate(path); }
  };
  const links = [
    { icon:"🏠", label:"Dashboard",   path:"/dashboard",      active:false, session:false },
    { icon:"📈", label:"Progression", path:"/progression",    active:true,  session:false },
    { icon:"📄", label:"Reports",     path:"/reports",        active:false, session:false },
    { icon:"👤", label:"Demographics",path:"/demographics",   active:false, session:true  },
    { icon:"🧠", label:"Cognitive",   path:"/cognitive-test", active:false, session:true  },
    { icon:"🔬", label:"MRI Upload",  path:"/mri-upload",     active:false, session:true  },
    { icon:"⚙️", label:"Settings",    path:"/settings",       active:false, session:false },
  ];
  return (
    <div className="sidebar">
      <div style={{ padding:"24px 20px 16px", borderBottom:"1px solid var(--border-subtle)", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"var(--accent-teal)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:20, color:"var(--bg-main)", fontWeight:600, flexShrink:0 }}>N</div>
          <div><div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>NeuroScan</div><div style={{ fontSize:11, color:"var(--accent-teal)" }}>Patient Portal</div></div>
        </div>
      </div>
      <div style={{ flex:1, padding:"0 8px" }}>
        {links.map(({ icon, label, path, active, session }) => (
          <div key={label} className={`nav-link ${active ? "active" : ""}`}
            onClick={() => session ? startAssessment(path) : navigate(path)}
            style={{ cursor:"pointer" }}>
            <div style={{ fontSize:16, width:24, textAlign:"center" }}>{icon}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding:"16px", borderTop:"1px solid var(--border-subtle)" }}>
        <button onClick={logout} className="btn-secondary" style={{ width:"100%", color:"var(--accent-red)", borderColor:"transparent" }}>
          <span>🚪</span> Sign out
        </button>
      </div>
    </div>
  );
}

function LineChart({ sessions }) {
  if (!sessions?.length) return null;
  const W = 600, H = 200, PAD = { t:20, r:20, b:40, l:45 };
  const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  const vals = sessions.map(s => s.ad_percentage || 0);
  const minV = Math.max(0, Math.min(...vals) - 10);
  const maxV = Math.min(100, Math.max(...vals) + 10);
  const scaleX = i => PAD.l + (i / (sessions.length - 1 || 1)) * cW;
  const scaleY = v => PAD.t + cH - ((v - minV) / (maxV - minV || 1)) * cH;

  const pts = sessions.map((s, i) => `${scaleX(i)},${scaleY(s.ad_percentage||0)}`).join(" ");
  const area = `M${scaleX(0)},${H-PAD.b} ` + sessions.map((s,i) => `L${scaleX(i)},${scaleY(s.ad_percentage||0)}`).join(" ") + ` L${scaleX(sessions.length-1)},${H-PAD.b} Z`;

  const yLines = [0, 25, 50, 75, 100].filter(v => v >= minV - 5 && v <= maxV + 5);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {yLines.map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={scaleY(v)} x2={W-PAD.r} y2={scaleY(v)} stroke="rgba(255,255,255,0.08)" strokeDasharray="4,4" />
          <text x={PAD.l-8} y={scaleY(v)+4} fill="var(--text-tertiary)" fontSize="11" textAnchor="end" className="mono">{v}</text>
        </g>
      ))}
      
      {/* Area fill */}
      <path d={area} fill="url(#areaGrad)" />
      {/* Line */}
      <polyline points={pts} fill="none" stroke="var(--accent-teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter:"drop-shadow(0 4px 6px rgba(20,184,166,0.3))" }} />
      {/* Data points */}
      {sessions.map((s, i) => {
        const sm = getStage(s.stage);
        const cx = scaleX(i), cy = scaleY(s.ad_percentage || 0);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="6" fill={sm.c} stroke="var(--bg-main)" strokeWidth="2" />
            <text x={cx} y={H - PAD.b + 20} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
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
    Promise.all([
      api.get("/user/sessions"),
      api.get("/user/progression"),
    ]).then(([sessRes, progRes]) => {
      const completed = sessRes.data.sessions.filter(s => s.stage_label !== null && s.final_ad_percentage !== null);
      setSessions(completed);
      setProgRecords(progRes.data.progression || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const trendData = sessions.map(s => ({ ad_percentage: s.final_ad_percentage, stage: s.stage_label, date: s.created_at, session_id: s.id })).reverse();
  const sel = sessions[selectedIdx];
  const selStage = sel ? getStage(sel.stage_label) : null;
  const latestProg = progRecords[0];

  if (loading) return (
    <div className="page-container" style={{ alignItems:"center", justifyContent:"center" }}>
      <div className="spinner" style={{ marginBottom:16 }} />
      <div style={{ color:"var(--text-secondary)" }}>Loading progression data…</div>
    </div>
  );

  return (
    <div className="page-container">
      <SideNav />

      <div className="main-content">
        <div style={{ padding:"48px", maxWidth:1200, margin:"0 auto", width:"100%" }}>
          <div className="animate-fade-up" style={{ marginBottom:48 }}>
            <div className="badge badge-teal" style={{ marginBottom:12, background:"rgba(20, 184, 166, 0.1)", color:"var(--accent-teal)", border:"1px solid rgba(20, 184, 166, 0.2)" }}>Disease Tracking</div>
            <h1 style={{ fontSize:38, marginBottom:8 }}>Progression <span className="serif" style={{ color:"var(--accent-teal)", fontStyle:"italic" }}>Analysis</span></h1>
            <p style={{ color:"var(--text-secondary)", fontSize:15, maxWidth:500, lineHeight:1.6 }}>
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded. Track changes in your Alzheimer's Disease risk profile over time.
            </p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

            {/* Summary badges */}
            {latestProg && (
              <div className="animate-fade-up delay-100" style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {[
                  { label:"Latest AD Risk",     val:`${(sessions[0]?.final_ad_percentage||0).toFixed(1)}%`,  color:selStage?.c||"var(--accent-teal)" },
                  { label:"Risk Change",         val:`${latestProg.delta_ad_percentage>0?"+":""}${latestProg.delta_ad_percentage?.toFixed(1)}%`, color:latestProg.delta_ad_percentage>0?"var(--accent-red)":"var(--accent-teal)" },
                  { label:"Overall Trend",          val:latestProg.progression_label,  color:latestProg.delta_ad_percentage>0?"var(--accent-red)":latestProg.delta_ad_percentage<0?"var(--accent-teal)":"var(--accent-amber)" },
                  { label:"Cognitive Δ",    val:`${latestProg.delta_cognitive>0?"+":""}${latestProg.delta_cognitive?.toFixed(1)}`, color:latestProg.delta_cognitive<0?"var(--accent-red)":"var(--accent-teal)" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="glass-panel" style={{ padding:"20px 24px", flex:"1" }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>{label}</div>
                    <div className="serif" style={{ fontSize:36, color, lineHeight:1 }}>{val}</div>
                  </div>
                ))}
                <div className="glass-panel" style={{ padding:"20px 24px", background:`${latestProg.delta_ad_percentage>0?"rgba(239, 68, 68, 0.05)":"rgba(20, 184, 166, 0.05)"}`, borderColor:`${latestProg.delta_ad_percentage>0?"rgba(239, 68, 68, 0.2)":"rgba(20, 184, 166, 0.2)"}`, flex:"2" }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Clinical Context</div>
                  <div style={{ fontSize:14, color:"var(--text-primary)", lineHeight:1.6 }}>{latestProg.trend_details}</div>
                </div>
              </div>
            )}

            {/* Line chart */}
            <div className="glass-panel animate-fade-up delay-200" style={{ padding:"32px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <div>
                  <h2 style={{ fontSize:18, fontWeight:600, color:"var(--text-primary)", marginBottom:4 }}>AD Risk Over Time</h2>
                  <div style={{ fontSize:14, color:"var(--text-secondary)" }}>Timeline of all completed sessions</div>
                </div>
                <div style={{ display:"flex", gap:16 }}>
                  {[{ c:"var(--accent-teal)",l:"Healthy" },{ c:"var(--accent-amber)",l:"V.Mild" },{ c:"#fb923c",l:"Mild" },{ c:"var(--accent-red)",l:"Moderate" }].map(({ c,l }) => (
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:c }} />
                      <span style={{ fontSize:12, color:"var(--text-secondary)" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              {trendData.length >= 2 ? <LineChart sessions={trendData} /> : (
                <div style={{ textAlign:"center", padding:"48px", color:"var(--text-tertiary)", fontSize:15 }}>Complete at least 2 assessments to see the trend chart.</div>
              )}
            </div>

            {/* Session selector + detail */}
            {sessions.length > 0 && (
              <div className="animate-fade-up delay-300" style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                {/* Session list */}
                <div className="glass-panel" style={{ width:300, flexShrink:0, padding:"24px", display:"flex", flexDirection:"column", gap:12, maxHeight:500, overflowY:"auto" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Session History</div>
                  {sessions.map((s, i) => {
                    const sm2 = getStage(s.stage_label);
                    const isSel = i === selectedIdx;
                    return (
                      <div key={s.id} onClick={() => setSelectedIdx(i)} style={{ padding:"16px", borderRadius:"var(--radius-md)", border:`1px solid ${isSel?sm2.c:"var(--border-subtle)"}`, background:isSel?sm2.bg:"var(--bg-panel)", cursor:"pointer", transition:"all 0.2s" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ fontSize:14, fontWeight:isSel?600:500, color:isSel?"var(--text-primary)":"var(--text-secondary)" }}>Session #{s.id}</div>
                          <div className="mono" style={{ fontSize:15, fontWeight:600, color:sm2.c }}>{(s.final_ad_percentage||0).toFixed(1)}%</div>
                        </div>
                        <div style={{ fontSize:12, color:"var(--text-tertiary)", marginTop:6 }}>{new Date(s.created_at).toLocaleDateString("en",{day:"numeric",month:"short",year:"numeric"})}</div>
                        <div style={{ marginTop:8, padding:"4px 10px", display:"inline-block", borderRadius:99, background:`${sm2.c}22`, color:sm2.c, fontSize:11, fontWeight:600 }}>{sm2.short}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Session detail */}
                {sel && (
                  <div className="glass-panel" style={{ flex:1, minWidth:320, padding:"32px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32 }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Selected Session: #{sel.id}</div>
                        <div className="serif" style={{ fontSize:38, color:selStage.c, lineHeight:1, marginBottom:8 }}>{sel.stage_label}</div>
                        <div style={{ fontSize:14, color:"var(--text-secondary)" }}>{new Date(sel.created_at).toLocaleDateString("en",{ weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
                      </div>
                      <div className="serif" style={{ fontSize:64, color:selStage.c, opacity:0.3 }}>{selStage.g}</div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                      {[
                        ["AD Risk Score", `${(sel.final_ad_percentage||0).toFixed(1)}%`, selStage.c],
                        ["Stage",         selStage.short, selStage.c],
                        ["Completed",     "Yes", "var(--accent-teal)"],
                        ["Session ID",    `#${sel.id}`, "var(--text-secondary)"],
                      ].map(([l,v,c]) => (
                        <div key={l} style={{ padding:"16px 20px", background:"var(--bg-panel)", borderRadius:"var(--radius-md)", border:`1px solid var(--border-subtle)` }}>
                          <div style={{ fontSize:11, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>{l}</div>
                          <div style={{ fontSize:18, fontWeight:600, color:c }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* AD gauge */}
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--text-secondary)", marginBottom:8 }}>
                        <span>AD Risk Gauge</span><span style={{ color:"var(--text-primary)", fontWeight:600 }}>{(sel.final_ad_percentage||0).toFixed(1)}/100</span>
                      </div>
                      <div style={{ height:8, background:"var(--bg-panel-hover)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${sel.final_ad_percentage||0}%`, background:selStage.c, borderRadius:99, transition:"width 0.8s ease" }} />
                      </div>
                    </div>

                    <div style={{ marginTop:32, display:"flex", gap:16 }}>
                      <button className="btn-secondary" onClick={() => navigate(`/results/${sel.id}`)} style={{ flex:1 }}>
                        📄 View Report
                      </button>
                      <button className="btn-primary" onClick={() => (async()=>{try{const{data}=await api.post("/user/sessions");navigate(`/demographics?session_id=${data.session?.id||""}`)}catch{navigate("/demographics")}})()} style={{ flex:1 }}>
                        + New Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sessions.length === 0 && (
              <div className="glass-panel animate-fade-up delay-200" style={{ textAlign:"center", padding:"80px 40px" }}>
                <div style={{ fontSize:56, marginBottom:20, opacity:0.5 }}>📈</div>
                <div style={{ fontSize:18, color:"var(--text-primary)", marginBottom:12, fontWeight:500 }}>No sessions yet</div>
                <p style={{ fontSize:15, color:"var(--text-secondary)", marginBottom:32, maxWidth:400, margin:"0 auto 32px" }}>Complete the multi-modal assessment pipeline to track your disease progression.</p>
                <button className="btn-primary" onClick={() => (async()=>{try{const{data}=await api.post("/user/sessions");navigate(`/demographics?session_id=${data.session?.id||""}`)}catch{navigate("/demographics")}})()}>
                  Start First Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
