import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const T = {
  navy:"#0a1628", teal:"#00d4aa", tealDim:"rgba(0,212,170,0.12)",
  border:"rgba(255,255,255,0.08)", slate:"rgba(255,255,255,0.45)",
  slateD:"rgba(255,255,255,0.22)", navyCard:"rgba(255,255,255,0.04)",
  red:"#ff6b6b", amber:"#fbbf24",
};

const STAGE_META = {
  "Non-Demented / Healthy":       { color:"#00d4aa", grade:"A", short:"Healthy" },
  "Very Mild Demented (MCI)":     { color:"#fbbf24", grade:"B", short:"Very Mild" },
  "Mild Alzheimer's Disease":     { color:"#fb923c", grade:"C", short:"Mild" },
  "Moderate Alzheimer's Disease": { color:"#ff6b6b", grade:"D", short:"Moderate" },
};
const getStage = (l) => STAGE_META[l] || { color:T.teal, grade:"?", short:"Unknown" };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#0a1628;color:#fff;-webkit-font-smoothing:antialiased;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.au{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.1) both}
.d1{animation-delay:.07s}.d2{animation-delay:.14s}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
@media(max-width:860px){.rpt-layout{flex-direction:column!important;}}
@media(max-width:640px){.rpt-grid{grid-template-columns:1fr!important;}}
`;

function SideNav() {
  const { logout } = useAuth();
  return (
    <div style={{ width:220, flexShrink:0, background:"rgba(0,0,0,0.3)", borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", padding:"28px 0", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
      <div style={{ padding:"0 22px 24px", borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:T.teal, color:T.navy, fontFamily:"'Instrument Serif',serif", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>N</div>
          <div><div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>NeuroScan</div><div style={{ fontSize:10, color:T.slateD }}>Patient Portal</div></div>
        </div>
      </div>
      {[["📊","Dashboard","/dashboard",""],["📈","Progression","/progression",""],["📄","Reports","/reports","rpt"],["🧠","Cognitive","/cognitive-test",""],["🔬","MRI","/mri-upload",""]].map(([ic,lb,hr,id])=>(
        <a key={lb} href={hr} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", margin:"0 8px 2px", borderRadius:10, background:id==="rpt"?T.tealDim:"transparent", textDecoration:"none" }}>
          <span style={{ fontSize:16 }}>{ic}</span>
          <span style={{ fontSize:13, fontWeight:id==="rpt"?600:400, color:id==="rpt"?T.teal:"rgba(255,255,255,0.4)" }}>{lb}</span>
          {id==="rpt" && <div style={{ width:5, height:5, borderRadius:"50%", background:T.teal, marginLeft:"auto" }} />}
        </a>
      ))}
      <div style={{ marginTop:"auto", padding:"18px 14px 0", borderTop:`1px solid ${T.border}` }}>
        <button onClick={logout} style={{ width:"100%", padding:"9px 14px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:9, color:T.red, fontSize:13, cursor:"pointer" }}>🚪 Sign Out</button>
      </div>
    </div>
  );
}

/* PDF preview card */
function ReportCard({ session, report, onGenerate, onDownload, generating, idx }) {
  const sm = getStage(session?.stage_label);
  const hasReport = !!report;
  return (
    <div className={`au`} style={{ animationDelay:`${idx*0.07}s`, background:T.navyCard, border:`1px solid ${hasReport?`${sm.color}22`:T.border}`, borderRadius:20, padding:22, display:"flex", flexDirection:"column", gap:16 }}>
      {/* Top */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>Session #{session?.id}</div>
          <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:20, color:sm.color, lineHeight:1.1 }}>{sm.short}</div>
          <div style={{ fontSize:12, color:T.slateD, marginTop:4 }}>{session?.created_at ? new Date(session.created_at).toLocaleDateString("en",{ day:"numeric", month:"long", year:"numeric" }) : "—"}</div>
        </div>
        <div style={{ width:50, height:50, borderRadius:13, background:`${sm.color}14`, border:`1px solid ${sm.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:24, color:sm.color, flexShrink:0 }}>{sm.grade}</div>
      </div>

      {/* Score bar */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.slateD, marginBottom:5 }}>
          <span>AD Risk Score</span><span style={{ color:"rgba(255,255,255,0.65)", fontWeight:600 }}>{(session?.final_ad_percentage||0).toFixed(1)}/100</span>
        </div>
        <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${session?.final_ad_percentage||0}%`, background:sm.color, borderRadius:99, transition:"width 0.6s ease" }} />
        </div>
      </div>

      {/* Report status */}
      {hasReport ? (
        <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(0,212,170,0.06)", border:"1px solid rgba(0,212,170,0.2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:T.teal, marginBottom:2 }}>✓ Report Ready</div>
            <div style={{ fontSize:10, color:T.slateD }}>Generated {new Date(report.generated_at).toLocaleDateString()}</div>
          </div>
          <button onClick={() => onDownload(session.id)} style={{ padding:"7px 14px", background:T.teal, color:T.navy, border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            ↓ PDF
          </button>
        </div>
      ) : (
        <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:12, color:T.slateD }}>No report generated yet</div>
          <button onClick={() => onGenerate(session.id)} disabled={generating === session.id} style={{ padding:"7px 14px", background:generating===session.id?"rgba(0,212,170,0.2)":T.tealDim, color:T.teal, border:"1px solid rgba(0,212,170,0.3)", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            {generating === session.id ? <span style={{ width:12, height:12, border:"2px solid rgba(0,212,170,0.2)", borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} /> : "⚡"} Generate
          </button>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const [sessions,   setSessions]   = useState([]);
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(null);
  const [toast,      setToast]      = useState(null);

  useEffect(() => {
    const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
    Promise.all([api.get("/user/sessions"), api.get("/report/list")]).then(([sRes, rRes]) => {
      setSessions(sRes.data.sessions.filter(s => s.is_complete));
      setReports(rRes.data.reports || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => document.head.removeChild(s);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleGenerate = async (sessionId) => {
    setGenerating(sessionId);
    try {
      await api.post(`/report/generate/${sessionId}`);
      const rRes = await api.get("/report/list");
      setReports(rRes.data.reports || []);
      showToast("Report generated successfully!");
    } catch (e) {
      showToast(e.response?.data?.error || "Generation failed.", "error");
    } finally { setGenerating(null); }
  };

  const handleDownload = async (sessionId) => {
    try {
      const res = await api.get(`/report/download/${sessionId}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `neuroscan_report_session_${sessionId}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast("PDF downloaded!");
    } catch { showToast("Download failed.", "error"); }
  };

  const getReport = (sessionId) => reports.find(r => r.session_id === sessionId);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:T.navy }}>
      <div style={{ width:28, height:28, border:`3px solid rgba(0,212,170,0.2)`, borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  const pending = sessions.filter(s => !getReport(s.id)).length;
  const ready   = sessions.filter(s => getReport(s.id)).length;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.navy }} className="rpt-layout">
      <SideNav />

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:999, padding:"12px 20px", borderRadius:12, background:toast.type==="error"?"rgba(255,107,107,0.15)":"rgba(0,212,170,0.15)", border:`1px solid ${toast.type==="error"?"rgba(255,107,107,0.35)":"rgba(0,212,170,0.35)"}`, color:toast.type==="error"?T.red:T.teal, fontSize:13, fontWeight:500, animation:"fadeUp 0.3s ease", backdropFilter:"blur(8px)" }}>
          {toast.type==="error"?"✕ ":"✓ "}{toast.msg}
        </div>
      )}

      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"32px 32px 0" }}>
          <div className="au">
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", color:T.teal, marginBottom:5, textTransform:"uppercase" }}>Clinical Records</div>
            <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:36, color:"#fff", fontWeight:400, lineHeight:1.1, marginBottom:6 }}>
              Diagnostic<br /><em style={{ color:T.teal }}>Reports</em>
            </h1>
          </div>
        </div>

        <div style={{ padding:"24px 32px 40px" }}>
          {/* Summary bar */}
          <div className="au" style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
            {[
              { label:"Total Sessions",   val:sessions.length, color:"#fff",  icon:"📋" },
              { label:"Reports Ready",    val:ready,           color:T.teal,  icon:"✅" },
              { label:"Pending Reports",  val:pending,         color:T.amber, icon:"⏳" },
            ].map(({ label, val, color, icon }) => (
              <div key={label} style={{ padding:"14px 20px", background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:14, minWidth:140 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
                </div>
                <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, color, lineHeight:1 }}>{val}</div>
              </div>
            ))}
            {pending > 0 && (
              <button onClick={() => sessions.filter(s => !getReport(s.id)).forEach(s => handleGenerate(s.id))}
                style={{ padding:"14px 22px", background:T.tealDim, border:"1px solid rgba(0,212,170,0.3)", borderRadius:14, color:T.teal, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                ⚡ Generate All Pending ({pending})
              </button>
            )}
          </div>

          {/* Reports grid */}
          {sessions.length > 0 ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }} className="rpt-grid">
              {sessions.map((session, i) => (
                <ReportCard
                  key={session.id}
                  session={session}
                  report={getReport(session.id)}
                  onGenerate={handleGenerate}
                  onDownload={handleDownload}
                  generating={generating}
                  idx={i}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"60px", background:T.navyCard, borderRadius:20, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:48, marginBottom:16, opacity:0.2 }}>📄</div>
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.3)", marginBottom:20 }}>No completed assessments yet</div>
              <button onClick={() => (async()=>{try{const{data}=await api.post("/user/sessions");navigate(`/demographics?session_id=${data.session?.id||""}`)}catch{navigate("/demographics")}})()} style={{ padding:"12px 24px", background:T.teal, color:T.navy, border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Start Your First Assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
