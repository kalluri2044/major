import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { userAPI } from "../services/api";
import { getStage } from "../components/DesignSystem";
import { SideNav } from "../components/SideNav";

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
        <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:size * 0.22, color, lineHeight:1, fontWeight:300 }}>{Math.round(v)}</div>
        <div style={{ fontSize:11, color:"var(--text-tertiary)", marginTop:2 }}>/100</div>
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
    userAPI.getDashboard().then(({ data: d }) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const startNew = async () => {
    setStarting(true);
    try { 
      const { data: sd } = await api.post("/user/sessions", { force: true }); 
      navigate(`/demographics?session_id=${sd.session?.id}`); 
    }
    catch { setStarting(false); }
  };

  if (loading) return (
    <div className="page-container">
      <SideNav user={user} logout={logout} />
      <div className="main-content" style={{ alignItems:"center", justifyContent:"center" }}>
        <div className="spinner" style={{ marginBottom:16 }} />
        <div style={{ color:"var(--text-secondary)" }}>Loading dashboard…</div>
      </div>
    </div>
  );

  const ls   = data?.latest_session; // latest complete
  const la   = data?.latest_any;     // absolute latest (might be incomplete)
  
  const isCompleted = ls && ls.stage_label !== null && ls.final_ad_percentage !== null;
  const isPending   = la && !la.is_complete;

  const sm   = isCompleted ? getStage(ls.stage_label) : null;
  const prog = data?.progression;
  const trend = data?.session_trend || [];
  const rec  = data?.recommendation;

  const scoreLabel = isCompleted ? `${(ls.final_ad_percentage||0).toFixed(0)}%` : "Pending";
  const cognitiveLabel = isCompleted ? `${Math.round(100-(ls.final_ad_percentage||0))}` : "Pending";
  const subLabel = isCompleted ? sm?.short : "Assessment incomplete";

  const kpis = [
    { label:"Total Sessions",  value: trend.length || 0, sub:"completed", color:"var(--accent-blue)", icon:"📋" },
    { label:"Latest AD Risk",  value: isPending ? "Wait" : scoreLabel, sub: isPending ? "In Progress" : subLabel, color: isPending ? "var(--accent-amber)" : (sm?.c || "var(--text-secondary)"), icon:"🎯" },
    { label:"Cognitive Score", value: isPending ? "..." : cognitiveLabel, sub:"estimated",  color:"var(--accent-purple)", icon:"🧠" },
    { label:"Progression",     value: prog ? `${(prog?.delta_ad_percentage||0)>0?"+":""}${prog?.delta_ad_percentage?.toFixed(1) || 0}%` : "—", sub:prog?.progression_label||"No history", color: (prog?.delta_ad_percentage||0)>0 ? "var(--accent-red)" : (prog?.delta_ad_percentage||0)<0 ? "var(--accent-teal)" : "var(--accent-amber)", icon:"📈" },
  ];

  return (
    <div className="page-container">
      <SideNav user={user} logout={logout} />
      <div className="main-content">
        <div style={{ padding:"40px 48px", maxWidth:1200, margin:"0 auto", width:"100%" }}>
          {/* Header */}
          <div className="animate-fade-up" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:48 }}>
            <div>
              <div className="badge badge-teal" style={{ marginBottom:12 }}>Patient Portal</div>
              <h1 style={{ fontSize:38, marginBottom:8 }}>Good day, <br/><span className="serif" style={{ color:"var(--accent-teal)", fontStyle:"italic" }}>{user?.name?.split(" ")[0]}</span></h1>
            </div>
            <div style={{ display:"flex", gap:16, alignItems:"center", marginTop:8 }}>
              {isCompleted && <button className="btn-secondary" onClick={() => navigate(`/results/${ls.id}`)}>View Results</button>}
              <button className="btn-primary" onClick={startNew} disabled={starting}>
                {starting ? <><div className="spinner" style={{ borderColor:"var(--bg-main)", borderTopColor:"transparent", width:14, height:14 }} /> Starting…</> : "+ New Assessment"}
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="animate-fade-up delay-100" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:24, marginBottom:32 }}>
            {kpis.map((k, i) => (
              <div key={i} className="glass-panel" style={{ padding:"24px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase", color:"var(--text-tertiary)" }}>{k.label}</div>
                  <span style={{ fontSize:20 }}>{k.icon}</span>
                </div>
                <div className="serif" style={{ fontSize:38, color:k.color, lineHeight:1, marginBottom:8 }}>{k.value}</div>
                <div style={{ fontSize:13, color:"var(--text-secondary)" }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="animate-fade-up delay-200" style={{ display:"flex", gap:24, marginBottom:32, flexWrap:"wrap" }}>
            {/* Score arc */}
            <div className="glass-panel" style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:260, flex:"0 0 260px", justifyContent:"center", padding:"32px 24px" }}>
              {isPending ? (
                <div style={{ textAlign:"center" }}>
                   <div style={{ fontSize:48, marginBottom:16, opacity:.8 }}>⏳</div>
                   <div style={{ fontSize:15, fontWeight:600, color:"var(--accent-amber)", marginBottom:4 }}>Session #{la.id}</div>
                   <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:24 }}>Assessment Pending.<br />Complete all 3 stages.</div>
                   <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                     <button className="btn-primary" style={{ width:"100%" }} onClick={() => navigate(`/demographics?session_id=${la.id}`)}>Resume →</button>
                     <button className="btn-ghost" style={{ fontSize:12, padding:"8px" }} onClick={startNew}>Discard & Start Fresh</button>
                   </div>
                </div>
              ) : isCompleted ? (
                <>
                  <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase", color:"var(--text-tertiary)", marginBottom:24 }}>AD Risk Score</div>
                  <ScoreArc score={ls.final_ad_percentage || 0} color={sm?.c || "var(--accent-teal)"} />
                  <div style={{ marginTop:24, padding:"8px 20px", borderRadius:99, background:sm?.bg, border:`1px solid ${sm?.c}`, color:sm?.c, fontSize:13, fontWeight:600, textAlign:"center" }}>{sm?.short || "—"}</div>
                  <div style={{ fontSize:12, color:"var(--text-tertiary)", marginTop:12 }}>{new Date(ls.created_at).toLocaleDateString("en",{day:"numeric",month:"long",year:"numeric"})}</div>
                </>
              ) : (
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:48, marginBottom:16, opacity:.5 }}>🧠</div>
                  <div style={{ fontSize:15, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:24 }}>No assessment yet.<br />Start your first one.</div>
                  <button className="btn-primary" onClick={startNew}>Begin →</button>
                </div>
              )}
            </div>

            {/* Trend chart */}
            <div className="glass-panel" style={{ flex:1, minWidth:300, padding:"32px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <div><div style={{ fontWeight:600, fontSize:16, marginBottom:4 }}>AD Risk Trend</div><div style={{ fontSize:13, color:"var(--text-secondary)" }}>Session history</div></div>
                {trend.length > 0 && <div className="badge badge-teal">{trend.length} sessions</div>}
              </div>
              {trend.length >= 2 ? (
                <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120, marginTop:16 }}>
                  {trend.slice(-10).map((s, i) => {
                    const tsm = getStage(s.stage);
                    const pct = (s.ad_percentage || 0) / 100 * 100;
                    const isLast = i === Math.min(trend.length, 10) - 1;
                    return (
                      <div key={i} onClick={() => navigate(`/results/${s.session_id}`)}
                        style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer" }}>
                        <div className="mono" style={{ fontSize:10, color:"var(--text-secondary)" }}>{Math.round(s.ad_percentage||0)}</div>
                        <div style={{ width:"100%", height:Math.max(pct, 4), borderRadius:"6px 6px 0 0", background: isLast ? tsm.c : `${tsm.c}88`, transition:"all 0.2s" }} />
                        <div style={{ fontSize:10, color:"var(--text-tertiary)" }}>{new Date(s.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:120, color:"var(--text-tertiary)", fontSize:14 }}>
                  Complete 2+ assessments to see trend
                </div>
              )}
            </div>
            
            {/* Progression */}
            <div className="glass-panel" style={{ flex:"0 0 240px", minWidth:200, padding:"32px 24px" }}>
              <div style={{ fontWeight:600, fontSize:16, marginBottom:4 }}>Progression</div>
              <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:24 }}>vs previous session</div>
              {prog ? (
                <>
                  <div style={{ textAlign:"center", marginBottom:24 }}>
                    <div className="serif" style={{ fontSize:56, lineHeight:1, color: prog.delta_ad_percentage>0 ? "var(--accent-red)" : prog.delta_ad_percentage<0 ? "var(--accent-teal)" : "var(--accent-amber)" }}>
                      {prog.delta_ad_percentage>0 ? "↑" : prog.delta_ad_percentage<0 ? "↓" : "→"}
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, marginTop:12 }}>{prog.progression_label}</div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize:13, color:"var(--text-secondary)" }}>AD Change</span>
                    <span style={{ fontSize:14, fontWeight:600, color: prog.delta_ad_percentage>0 ? "var(--accent-red)" : "var(--accent-teal)" }}>
                      {prog.delta_ad_percentage>0?"+":""}{prog.delta_ad_percentage?.toFixed(1)}%
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ color:"var(--text-tertiary)", fontSize:14, textAlign:"center", paddingTop:24 }}>2+ sessions needed</div>
              )}
            </div>
          </div>

          {/* Recommendations + session history */}
          <div className="animate-fade-up delay-300" style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            <div className="glass-panel" style={{ flex:2, minWidth:320, padding:"32px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <div><div style={{ fontWeight:600, fontSize:16, marginBottom:4 }}>Recommendations</div><div style={{ fontSize:13, color:"var(--text-secondary)" }}>Personalised to your risk profile</div></div>
                {rec && <div className="badge badge-amber">{rec.total_items} items</div>}
              </div>
              {rec?.flat_list?.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {rec.flat_list.slice(0, 4).map((item, i) => {
                    const cats = { Medical:"var(--accent-red)", Lifestyle:"var(--accent-teal)", Cognitive:"var(--accent-purple)", Social:"var(--accent-amber)" };
                    const cc = cats[item.category] || "var(--accent-teal)";
                    return (
                      <div key={i} style={{ display:"flex", gap:16, padding:"16px", borderRadius:"var(--radius-md)", background:"var(--bg-panel)", border:"1px solid var(--border-subtle)" }}>
                        <div style={{ width:4, borderRadius:99, background:cc, flexShrink:0 }} />
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:cc, textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>{item.category}</div>
                          <div style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.6 }}>{item.advice.substring(0,140)}{item.advice.length>140?"…":""}</div>
                        </div>
                      </div>
                    );
                  })}
                  <button className="btn-secondary" onClick={() => navigate("/progression")} style={{ marginTop:8 }}>View all recommendations →</button>
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"40px 24px", color:"var(--text-tertiary)", fontSize:14, lineHeight:1.7 }}>Complete your first assessment<br />to receive personalised recommendations.</div>
              )}
            </div>

            <div className="glass-panel" style={{ flex:1, minWidth:260, padding:"32px" }}>
              <div style={{ fontWeight:600, fontSize:16, marginBottom:4 }}>Session History</div>
              <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:24 }}>Recent assessments</div>
              {trend.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[...trend].reverse().slice(0, 5).map((s, i) => {
                    const ssm = getStage(s.stage);
                    return (
                      <div key={i} onClick={() => navigate(`/results/${s.session_id}`)}
                        className="glass-panel"
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", cursor:"pointer", transition:"all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-focus)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
                        <div style={{ width:36, height:36, borderRadius:8, background:ssm.bg, border:`1px solid ${ssm.c}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:20, color:ssm.c, flexShrink:0 }}>{ssm.g}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:"var(--text-primary)" }}>{ssm.short}</div>
                          <div style={{ fontSize:12, color:"var(--text-tertiary)" }}>{new Date(s.date).toLocaleDateString("en",{day:"numeric",month:"short"})}</div>
                        </div>
                        <div className="mono" style={{ fontSize:14, fontWeight:600, color:ssm.c }}>{Math.round(s.ad_percentage||0)}%</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign:"center", color:"var(--text-tertiary)", fontSize:14, padding:"32px 0" }}>No sessions yet</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
