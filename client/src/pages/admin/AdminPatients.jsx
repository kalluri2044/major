import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout, Card, CardTitle, Spinner, Toast, T, getStage, CSS_BASE } from "./AdminLayout";
import { exportAPI } from "../../services/api";
import api from "../../services/api";

function PatientRow({ patient, selected, onClick }) {
  const sm = getStage(patient.latest_stage);
  const isActive = patient.is_active !== false;
  return (
    <div onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:14, padding:"13px 16px",
      borderRadius:12, border:`1px solid ${selected?`${sm.color}44`:T.border}`,
      background:selected?`${sm.color}07`:"rgba(255,255,255,0.02)",
      cursor:"pointer", transition:"all 0.15s", marginBottom:8, opacity:isActive?1:0.5,
    }}>
      {/* Avatar */}
      <div style={{ width:40, height:40, borderRadius:12, background:`${sm.color}18`, border:`1px solid ${sm.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:20, color:sm.color, flexShrink:0 }}>
        {patient.name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{patient.name}</div>
        <div style={{ fontSize:11, color:T.slateD }}>{patient.email} · {patient.age ? `Age ${patient.age}` : "—"} · {patient.session_count || 0} sessions</div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:sm.color }}>{patient.latest_ad_percentage != null ? `${patient.latest_ad_percentage}%` : "—"}</div>
        <div style={{ fontSize:10, color:T.slateD }}>{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString("en",{month:"short",day:"numeric"}) : "No visits"}</div>
      </div>
      <div style={{ padding:"4px 10px", borderRadius:99, background:sm.bg, color:sm.color, fontSize:10, fontWeight:600, flexShrink:0 }}>
        {sm.short || "—"}
      </div>
    </div>
  );
}

function PatientDetail({ patient, onClose, onToggleActive, toast }) {
  const sm = getStage(patient.latest_stage);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/patients/${patient.id}`).then(({ data }) => setDetail(data)).finally(() => setLoading(false));
  }, [patient.id]);

  return (
    <div style={{ width:380, flexShrink:0, background:"rgba(0,0,0,0.3)", borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", height:"100vh", overflowY:"auto", position:"sticky", top:0 }}>
      {/* Header */}
      <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${sm.color}18`, border:`1px solid ${sm.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:24, color:sm.color }}>
              {patient.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:600, color:"#fff" }}>{patient.name}</div>
              <div style={{ fontSize:11, color:T.slateD }}>{patient.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.slateD, cursor:"pointer", fontSize:20, padding:"0 4px" }}>×</button>
        </div>

        {/* Score */}
        <div style={{ padding:"12px 14px", borderRadius:12, background:`${sm.color}0a`, border:`1px solid ${sm.color}33`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>Latest AD Risk</div>
            <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, color:sm.color, lineHeight:1 }}>
              {patient.latest_ad_percentage != null ? `${patient.latest_ad_percentage}%` : "—"}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ padding:"5px 14px", borderRadius:99, background:sm.bg, color:sm.color, fontSize:12, fontWeight:600 }}>{sm.short}</div>
            <div style={{ fontSize:10, color:T.slateD, marginTop:4 }}>{patient.session_count || 0} sessions</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner /></div>
      ) : detail && (
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>

          {/* Demographics */}
          {detail.demographics && (
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Demographics</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  ["Age",           detail.demographics.age],
                  ["Gender",        detail.demographics.gender],
                  ["Education",     detail.demographics.education_level],
                  ["Family Hx",     detail.demographics.family_history ? "Yes ⚠️" : "No"],
                  ["Hypertension",  detail.demographics.hypertension   ? "Yes ⚠️" : "No"],
                  ["Diabetes",      detail.demographics.diabetes        ? "Yes ⚠️" : "No"],
                  ["Smoking",       detail.demographics.smoking         ? "Yes ⚠️" : "No"],
                  ["Sleep",         detail.demographics.sleep_quality],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding:"8px 10px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:9, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:12, color:"#fff", textTransform:"capitalize" }}>{v ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend mini chart */}
          {detail.trend?.length > 1 && (
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>AD Risk Trend</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
                {detail.trend.map((t, i) => {
                  const tsm = getStage(t.stage);
                  const h   = Math.max((t.ad_percentage / 100) * 52, 4);
                  return (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                      <div style={{ fontSize:7, color:T.slateD, fontFamily:"'DM Mono',monospace" }}>{Math.round(t.ad_percentage||0)}</div>
                      <div style={{ width:"100%", height:h, borderRadius:"2px 2px 0 0", background:i===detail.trend.length-1?tsm.color:`${tsm.color}66` }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sessions */}
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Session History</div>
            {detail.sessions.slice(0, 4).map(s => {
              const ssm = getStage(s.stage_label);
              return (
                <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize:12, color:"#fff", fontWeight:500 }}>Session #{s.id}</div>
                    <div style={{ fontSize:10, color:T.slateD }}>{new Date(s.created_at).toLocaleDateString("en",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ padding:"3px 8px", borderRadius:99, background:ssm.bg, color:ssm.color, fontSize:10, fontWeight:600 }}>{ssm.short}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:ssm.color }}>{Math.round(s.final_ad_percentage||0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, paddingTop:4 }}>
            <button onClick={() => onToggleActive(patient.id, !patient.is_active)} style={{
              padding:"10px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
              background: patient.is_active ? "rgba(255,107,107,0.08)" : "rgba(0,212,170,0.1)",
              border: `1px solid ${patient.is_active ? "rgba(255,107,107,0.25)" : "rgba(0,212,170,0.25)"}`,
              color: patient.is_active ? T.red : T.teal,
            }}>
              {patient.is_active ? "⚠️ Deactivate Patient" : "✓ Reactivate Patient"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPatients() {
  const navigate = useNavigate();
  const [patients,  setPatients]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [risk,      setRisk]      = useState("");
  const [sort,      setSort]      = useState("newest");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [toast,     setToast]     = useState(null);
  const LIMIT = 15;

  const exportCSV = async () => {
    try {
      const res = await exportAPI.patients();
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url;
      a.download = `neuroscan_patients_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert("Export failed."); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, risk, sort, page, limit: LIMIT });
      const { data } = await api.get(`/admin/patients?${params}`);
      setPatients(data.patients || []);
      setTotal(data.total || 0);
    } catch { }
    finally { setLoading(false); }
  }, [search, risk, sort, page]);

  useEffect(() => {
    const s = document.createElement("style"); s.textContent = CSS_BASE; document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (id, active) => {
    try {
      await api.put(`/admin/patients/${id}`, { is_active: active });
      setToast({ msg: active ? "Patient reactivated." : "Patient deactivated.", type: "success" });
      load();
      setSelected(p => p && p.id === id ? { ...p, is_active: active } : p);
    } catch { setToast({ msg: "Action failed.", type: "error" }); }
  };

  const total_pages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout activeId="patients" title="Patient" subtitle="Management">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display:"flex", gap:0, minHeight:"calc(100vh - 100px)", margin:"-28px -32px -40px" }}>
        {/* List panel */}
        <div style={{ flex:1, padding:"24px 24px", overflowY:"auto" }}>

          {/* Filters */}
          <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:220, position:"relative" }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or email…"
                style={{ width:"100%", padding:"10px 14px 10px 36px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:10, fontSize:13, color:"#fff" }} />
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", opacity:0.4 }}>🔍</span>
            </div>
            <select value={risk} onChange={e => { setRisk(e.target.value); setPage(1); }}
              style={{ padding:"10px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:10, fontSize:13, color:"#fff" }}>
              <option value="">All Risk Levels</option>
              <option value="high">High Risk (&gt;75%)</option>
              <option value="moderate">Moderate (50–75%)</option>
              <option value="low">Low (&lt;50%)</option>
            </select>
            <button onClick={exportCSV} style={{ padding:"9px 16px", background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.25)", borderRadius:10, color:"#60a5fa", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
              ↓ Export CSV
            </button>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding:"10px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:10, fontSize:13, color:"#fff" }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_risk">Highest Risk</option>
            </select>
          </div>

          {/* Count */}
          <div style={{ fontSize:12, color:T.slateD, marginBottom:14 }}>
            Showing {patients.length} of {total} patients
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner /></div>
          ) : patients.length === 0 ? (
            <div style={{ textAlign:"center", padding:60, color:T.slateD, fontSize:14 }}>No patients found.</div>
          ) : (
            <>
              {patients.map(p => (
                <PatientRow key={p.id} patient={p} selected={selected?.id === p.id} onClick={() => setSelected(p)} />
              ))}

              {/* Pagination */}
              {total_pages > 1 && (
                <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:20 }}>
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                    style={{ padding:"7px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:8, color:"rgba(255,255,255,0.5)", cursor:"pointer", opacity:page===1?0.4:1 }}>←</button>
                  <span style={{ padding:"7px 14px", fontSize:12, color:T.slateD }}>Page {page} / {total_pages}</span>
                  <button onClick={() => setPage(p => Math.min(total_pages, p+1))} disabled={page === total_pages}
                    style={{ padding:"7px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:8, color:"rgba(255,255,255,0.5)", cursor:"pointer", opacity:page===total_pages?0.4:1 }}>→</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <PatientDetail
            patient={selected}
            onClose={() => setSelected(null)}
            onToggleActive={handleToggleActive}
            toast={toast}
          />
        )}
      </div>
    </AdminLayout>
  );
}
