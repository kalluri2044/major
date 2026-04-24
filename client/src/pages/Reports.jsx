import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getStage } from "../components/DesignSystem";

import { SideNav } from "../components/SideNav";

function ReportCard({ session, report, onGenerate, onDownload, generating, idx }) {
  const isCompleted = session && session.stage_label !== null && session.final_ad_percentage !== null;
  const sm = isCompleted ? getStage(session?.stage_label) : null;
  const hasReport = !!report;

  if (!isCompleted) {
    return (
      <div className="glass-panel animate-fade-up" style={{ animationDelay:`${idx*0.07}s`, padding:"24px", display:"flex", flexDirection:"column", gap:16, opacity: 0.7 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Session #{session?.id}</div>
            <div style={{ fontSize:18, color:"var(--text-secondary)", fontWeight:500 }}>Incomplete</div>
            <div style={{ fontSize:12, color:"var(--text-tertiary)", marginTop:4 }}>{session?.created_at ? new Date(session.created_at).toLocaleDateString("en",{ day:"numeric", month:"long", year:"numeric" }) : "—"}</div>
          </div>
          <div style={{ width:48, height:48, borderRadius:"var(--radius-sm)", background:"var(--bg-panel-hover)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"var(--text-tertiary)", flexShrink:0 }}>⏳</div>
        </div>
        <div style={{ padding:"12px 16px", borderRadius:"var(--radius-md)", background:"var(--bg-panel-hover)", border:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto" }}>
          <div style={{ fontSize:12, color:"var(--text-tertiary)" }}>Complete assessment first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-up" style={{ animationDelay:`${idx*0.07}s`, padding:"24px", display:"flex", flexDirection:"column", gap:20, borderColor: hasReport ? sm?.c : "var(--border-subtle)" }}>
      {/* Top */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Session #{session?.id}</div>
          <div className="serif" style={{ fontSize:28, color:sm?.c, lineHeight:1 }}>{sm?.short}</div>
          <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:6 }}>{session?.created_at ? new Date(session.created_at).toLocaleDateString("en",{ day:"numeric", month:"long", year:"numeric" }) : "—"}</div>
        </div>
        <div style={{ width:48, height:48, borderRadius:"var(--radius-sm)", background:sm?.bg, border:`1px solid ${sm?.c}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:24, color:sm?.c, flexShrink:0 }}>{sm?.g}</div>
      </div>

      {/* Score bar */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-secondary)", marginBottom:8 }}>
          <span>AD Risk Score</span><span style={{ color:"var(--text-primary)", fontWeight:600 }}>{(session?.final_ad_percentage||0).toFixed(1)}/100</span>
        </div>
        <div style={{ height:6, background:"var(--bg-panel)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${session?.final_ad_percentage||0}%`, background:sm?.c, borderRadius:99, transition:"width 0.6s ease" }} />
        </div>
      </div>

      {/* Report status */}
      {hasReport ? (
        <div style={{ padding:"12px 16px", borderRadius:"var(--radius-md)", background:"rgba(20, 184, 166, 0.1)", border:"1px solid rgba(20, 184, 166, 0.3)", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--accent-teal)", marginBottom:2 }}>✓ Report Ready</div>
            <div style={{ fontSize:11, color:"var(--text-secondary)" }}>Generated {new Date(report.generated_at).toLocaleDateString()}</div>
          </div>
          <button className="btn-primary" onClick={() => onDownload(session.id)} style={{ padding:"8px 16px", fontSize:13 }}>
            Download PDF
          </button>
        </div>
      ) : (
        <div style={{ padding:"12px 16px", borderRadius:"var(--radius-md)", background:"var(--bg-panel-hover)", border:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto" }}>
          <div style={{ fontSize:12, color:"var(--text-secondary)" }}>No report generated</div>
          <button className="btn-secondary" onClick={() => onGenerate(session.id)} disabled={generating === session.id} style={{ padding:"8px 16px", fontSize:13, color:"var(--accent-teal)", borderColor:"var(--accent-teal-dim)" }}>
            {generating === session.id ? <span className="spinner" style={{ width:14, height:14, marginRight:6 }} /> : "⚡ "} Generate Data
          </button>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions,   setSessions]   = useState([]);
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(null);
  const [toast,      setToast]      = useState(null);

  useEffect(() => {
    Promise.all([api.get("/user/sessions"), api.get("/report/list")]).then(([sRes, rRes]) => {
      // Include all sessions, but we'll mark the incomplete ones in UI
      setSessions(sRes.data.sessions);
      setReports(rRes.data.reports || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
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
      showToast("PDF downloaded successfully!");
    } catch { showToast("Download failed.", "error"); }
  };

  const getReport = (sessionId) => reports.find(r => r.session_id === sessionId);

  if (loading) return (
    <div className="page-container">
      <SideNav user={user} logout={logout} />
      <div className="main-content" style={{ alignItems:"center", justifyContent:"center" }}>
        <div className="spinner" style={{ marginBottom:16 }} />
        <div style={{ color:"var(--text-secondary)" }}>Loading reports…</div>
      </div>
    </div>
  );

  const completedSessions = sessions.filter(s => s.stage_label !== null && s.final_ad_percentage !== null);
  const pendingCount = completedSessions.filter(s => !getReport(s.id)).length;
  const readyCount   = completedSessions.filter(s => getReport(s.id)).length;

  return (
    <div className="page-container">
      <SideNav user={user} logout={logout} />

      {/* Toast Notification */}
      {toast && (
        <div className="animate-fade-up" style={{ position:"fixed", top:32, right:32, zIndex:999, padding:"16px 24px", borderRadius:"var(--radius-md)", background:toast.type==="error"?"rgba(239, 68, 68, 0.15)":"rgba(20, 184, 166, 0.15)", border:`1px solid ${toast.type==="error"?"rgba(239, 68, 68, 0.4)":"rgba(20, 184, 166, 0.4)"}`, color:toast.type==="error"?"var(--accent-red)":"var(--accent-teal)", fontSize:14, fontWeight:500, backdropFilter:"blur(12px)", boxShadow:"var(--shadow-panel)", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:18 }}>{toast.type==="error"?"❌":"✅"}</span> {toast.msg}
        </div>
      )}

      <div className="main-content">
        <div style={{ padding:"48px", maxWidth:1200, margin:"0 auto", width:"100%" }}>
          <div className="animate-fade-up" style={{ marginBottom:48 }}>
            <div className="badge badge-purple" style={{ marginBottom:12, background:"rgba(139, 92, 246, 0.1)", color:"var(--accent-purple)", border:"1px solid rgba(139, 92, 246, 0.2)" }}>Clinical Records</div>
            <h1 style={{ fontSize:38, marginBottom:8 }}>Diagnostic <span className="serif" style={{ color:"var(--accent-purple)", fontStyle:"italic" }}>Reports</span></h1>
            <p style={{ color:"var(--text-secondary)", fontSize:15, maxWidth:500, lineHeight:1.6 }}>
              Generate, download, and review comprehensive PDF reports containing detailed analytical breakdowns of your ensemble AI assessments.
            </p>
          </div>

          {/* Summary bar */}
          <div className="animate-fade-up delay-100" style={{ display:"flex", gap:24, marginBottom:40, flexWrap:"wrap" }}>
            {[
              { label:"Completed Sessions", val:completedSessions.length, color:"var(--text-primary)",  icon:"📋" },
              { label:"Reports Ready",    val:readyCount,           color:"var(--accent-teal)",  icon:"✅" },
              { label:"Pending Generation",  val:pendingCount,         color:"var(--accent-amber)", icon:"⏳" },
            ].map(({ label, val, color, icon }) => (
              <div key={label} className="glass-panel" style={{ padding:"24px", flex:"1", minWidth:200 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:20 }}>{icon}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</span>
                </div>
                <div className="serif" style={{ fontSize:36, color, lineHeight:1 }}>{val}</div>
              </div>
            ))}
            {pendingCount > 0 && (
              <button className="btn-secondary" onClick={() => completedSessions.filter(s => !getReport(s.id)).forEach(s => handleGenerate(s.id))}
                style={{ alignSelf:"stretch", display:"flex", alignItems:"center", gap:12, padding:"0 32px", color:"var(--accent-teal)", borderColor:"var(--accent-teal-dim)", background:"rgba(20, 184, 166, 0.05)" }}>
                <span style={{ fontSize:20 }}>⚡</span>
                <span>Generate All Pending ({pendingCount})</span>
              </button>
            )}
          </div>

          {/* Reports grid */}
          {sessions.length > 0 ? (
            <div className="animate-fade-up delay-200" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:24 }}>
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
            <div className="glass-panel animate-fade-up delay-200" style={{ textAlign:"center", padding:"80px 40px" }}>
              <div style={{ fontSize:56, marginBottom:20, opacity:0.5 }}>📄</div>
              <div style={{ fontSize:18, fontWeight:500, color:"var(--text-primary)", marginBottom:12 }}>No assessments found</div>
              <p style={{ fontSize:15, color:"var(--text-secondary)", marginBottom:32, maxWidth:400, margin:"0 auto 32px" }}>Complete the multi-modal assessment pipeline to generate clinical diagnostic reports.</p>
              <button className="btn-primary" onClick={() => (async()=>{try{const{data}=await api.post("/user/sessions");navigate(`/demographics?session_id=${data.session?.id||""}`)}catch{navigate("/demographics")}})()}>
                Start First Assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
