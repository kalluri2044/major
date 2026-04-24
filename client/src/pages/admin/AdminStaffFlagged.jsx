import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout, Card, CardTitle, Spinner, Toast, T, getStage, CSS_BASE } from "./AdminLayout";
import api from "../../services/api";

/* ═══════════════════════════════════════════
   STAFF MANAGEMENT
   ═══════════════════════════════════════════ */
function RoleBadge({ role }) {
  const c = role === "admin" ? "#a78bfa" : T.teal;
  return <span style={{ padding:"3px 10px", borderRadius:99, background:`${c}18`, border:`1px solid ${c}33`, color:c, fontSize:10, fontWeight:600, textTransform:"capitalize" }}>{role}</span>;
}

export function AdminStaff() {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ name:"", email:"", password:"", role:"doctor" });
  const [adding,  setAdding]  = useState(false);
  const [showForm,setShowForm]= useState(false);

  useEffect(() => {
    const s = document.createElement("style"); s.textContent = CSS_BASE; document.head.appendChild(s);
    loadStaff();
    return () => document.head.removeChild(s);
  }, []);

  const loadStaff = () => {
    setLoading(true);
    api.get("/admin/doctors").then(({ data }) => setStaff(data.staff || [])).finally(() => setLoading(false));
  };

  const addStaff = async () => {
    if (!form.name || !form.email || !form.password) { setToast({ msg: "All fields required.", type:"error" }); return; }
    setAdding(true);
    try {
      await api.post("/admin/doctors", form);
      setToast({ msg: `${form.role === "admin" ? "Admin" : "Doctor"} account created.`, type:"success" });
      setForm({ name:"", email:"", password:"", role:"doctor" });
      setShowForm(false);
      loadStaff();
    } catch (e) { setToast({ msg: e.response?.data?.error || "Failed.", type:"error" }); }
    finally { setAdding(false); }
  };

  const toggleActive = async (id, active) => {
    try {
      await api.put(`/admin/doctors/${id}`, { is_active: active });
      setToast({ msg: active ? "Account reactivated." : "Account deactivated.", type:"success" });
      loadStaff();
    } catch { setToast({ msg: "Failed.", type:"error" }); }
  };

  const IS = { display:"block", width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:10, fontSize:13, color:"#fff", marginBottom:12 };

  return (
    <AdminLayout activeId="staff" title="Staff" subtitle="Management">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 420px", gap:20, maxWidth:1100 }}>

        {/* Staff list */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <CardTitle sub={`${staff.length} staff accounts`}>Team Members</CardTitle>
            <button onClick={() => setShowForm(f => !f)} style={{ padding:"9px 18px", background:T.tealDim, border:"1px solid rgba(0,212,170,0.3)", borderRadius:10, color:T.teal, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {showForm ? "× Cancel" : "+ Add Staff"}
            </button>
          </div>

          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner /></div>
          ) : staff.length === 0 ? (
            <div style={{ textAlign:"center", padding:40, color:T.slateD, fontSize:13 }}>No staff accounts yet.</div>
          ) : (
            staff.map(u => (
              <div key={u.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom:`1px solid ${T.border}`, opacity:u.is_active?1:0.45 }}>
                <div style={{ width:44, height:44, borderRadius:12, background: u.role==="admin"?"rgba(160,139,250,0.15)":"rgba(0,212,170,0.12)", border:`1px solid ${u.role==="admin"?"rgba(160,139,250,0.3)":"rgba(0,212,170,0.25)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:22, color: u.role==="admin"?"#a78bfa":T.teal, flexShrink:0 }}>
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{u.name}</span>
                    <RoleBadge role={u.role} />
                    {!u.is_active && <span style={{ fontSize:10, color:T.red, background:"rgba(255,107,107,0.1)", padding:"2px 8px", borderRadius:99, border:"1px solid rgba(255,107,107,0.25)" }}>Inactive</span>}
                  </div>
                  <div style={{ fontSize:12, color:T.slateD }}>{u.email}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:2 }}>Joined {new Date(u.created_at).toLocaleDateString("en",{month:"short",year:"numeric"})}</div>
                </div>
                <button onClick={() => toggleActive(u.id, !u.is_active)} style={{
                  padding:"6px 14px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer",
                  background: u.is_active ? "rgba(255,107,107,0.08)" : "rgba(0,212,170,0.1)",
                  border: `1px solid ${u.is_active ? "rgba(255,107,107,0.2)" : "rgba(0,212,170,0.25)"}`,
                  color: u.is_active ? T.red : T.teal,
                }}>
                  {u.is_active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            ))
          )}
        </Card>

        {/* Add form */}
        <div>
          {showForm && (
            <Card className="au">
              <CardTitle sub="Create a new doctor or admin account">Add Staff Member</CardTitle>
              <label style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="Dr. Jane Smith" style={IS} />
              <label style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="jane@hospital.com" style={IS} />
              <label style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Temporary Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder="Min. 6 characters" style={IS} />
              <label style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Role</label>
              <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                {["doctor","admin"].map(r => (
                  <div key={r} onClick={() => setForm(f => ({...f, role:r}))} style={{
                    flex:1, padding:"12px", borderRadius:10, textAlign:"center", cursor:"pointer",
                    border:`1px solid ${form.role===r?(r==="admin"?"rgba(160,139,250,0.5)":"rgba(0,212,170,0.5)"):T.border}`,
                    background:form.role===r?(r==="admin"?"rgba(160,139,250,0.1)":"rgba(0,212,170,0.1)"):"rgba(255,255,255,0.02)",
                  }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{r==="admin"?"👑":"👨‍⚕️"}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:form.role===r?(r==="admin"?"#a78bfa":T.teal):"rgba(255,255,255,0.5)", textTransform:"capitalize" }}>{r}</div>
                    <div style={{ fontSize:10, color:T.slateD, marginTop:2 }}>{r==="admin"?"Full access":"Patient + reports"}</div>
                  </div>
                ))}
              </div>
              <button onClick={addStaff} disabled={adding} style={{ width:"100%", padding:"12px", background:T.teal, color:T.navy, border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", opacity:adding?0.7:1 }}>
                {adding ? "Creating…" : "Create Account"}
              </button>
            </Card>
          )}

          {/* Stats card */}
          <Card style={{ marginTop: showForm ? 16 : 0 }}>
            <CardTitle>Staff Overview</CardTitle>
            {[
              { label:"Total Staff",  value:staff.length,                                  color:"#fff",   icon:"👥" },
              { label:"Doctors",      value:staff.filter(s=>s.role==="doctor").length,    color:T.teal,   icon:"👨‍⚕️" },
              { label:"Admins",       value:staff.filter(s=>s.role==="admin").length,     color:"#a78bfa",icon:"👑" },
              { label:"Active",       value:staff.filter(s=>s.is_active).length,           color:T.teal,   icon:"✓" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>{icon}</span>
                  <span style={{ fontSize:12, color:T.slateD }}>{label}</span>
                </div>
                <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:22, color, lineHeight:1 }}>{value}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ═══════════════════════════════════════════
   HIGH RISK / FLAGGED PATIENTS
   ═══════════════════════════════════════════ */
export function AdminFlagged() {
  const navigate    = useNavigate();
  const [flagged,   setFlagged]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [threshold, setThreshold] = useState(75);
  const [toast,     setToast]     = useState(null);

  useEffect(() => {
    const s = document.createElement("style"); s.textContent = CSS_BASE; document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/flagged?threshold=${threshold}`).then(({ data }) => setFlagged(data.flagged_patients || [])).finally(() => setLoading(false));
  }, [threshold]);

  return (
    <AdminLayout activeId="flagged" title="High Risk" subtitle="Patients">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header controls */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          {[60,70,75,80,85].map(t => (
            <button key={t} onClick={() => setThreshold(t)} style={{
              padding:"7px 16px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer",
              background:threshold===t?"rgba(255,107,107,0.15)":"rgba(255,255,255,0.04)",
              border:`1px solid ${threshold===t?"rgba(255,107,107,0.4)":T.border}`,
              color:threshold===t?T.red:"rgba(255,255,255,0.45)",
            }}>AD &gt; {t}%</button>
          ))}
        </div>
        <div style={{ padding:"8px 16px", borderRadius:10, background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.2)" }}>
          <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:24, color:T.red }}>{flagged.length}</span>
          <span style={{ fontSize:12, color:T.slateD, marginLeft:8 }}>patients flagged</span>
        </div>
      </div>

      {/* Alert banner */}
      {flagged.length > 0 && (
        <div style={{ padding:"14px 18px", borderRadius:12, background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.2)", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.red, marginBottom:2 }}>Urgent Follow-up Required</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{flagged.length} patient{flagged.length !== 1 ? "s" : ""} with AD risk above {threshold}% require immediate clinical attention.</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner /></div>
      ) : flagged.length === 0 ? (
        <div style={{ textAlign:"center", padding:80, color:T.slateD, fontSize:14 }}>
          <div style={{ fontSize:44, marginBottom:16, opacity:0.2 }}>✅</div>
          No patients above {threshold}% threshold.
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
          {flagged.map((item, i) => {
            const sm = getStage(item.stage);
            return (
              <div key={item.user.id} className="au" style={{ animationDelay:`${i*0.05}s`, background:"rgba(255,107,107,0.04)", border:"1.5px solid rgba(255,107,107,0.22)", borderRadius:16, padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,107,107,0.15)", border:"1px solid rgba(255,107,107,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:20, color:T.red, flexShrink:0 }}>
                      {item.user.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{item.user.name}</div>
                      <div style={{ fontSize:11, color:T.slateD }}>{item.user.email}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, color:T.red, lineHeight:1 }}>{item.ad_percentage}%</div>
                </div>

                {/* Risk bar */}
                <div style={{ height:7, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden", marginBottom:12 }}>
                  <div style={{ height:"100%", width:`${item.ad_percentage}%`, background:T.red, borderRadius:99 }} />
                </div>

                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                  <span style={{ padding:"3px 10px", borderRadius:99, background:sm.bg, color:sm.color, fontSize:10, fontWeight:600 }}>{sm.short}</span>
                  {item.age && <span style={{ padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.06)", color:T.slateD, fontSize:10 }}>Age {item.age}</span>}
                  <span style={{ padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.06)", color:T.slateD, fontSize:10 }}>
                    {new Date(item.last_visit).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}
                  </span>
                </div>

                <Link to={`/admin/patients?id=${item.user.id}`} style={{ display:"block", padding:"9px", textAlign:"center", background:"rgba(255,107,107,0.12)", border:"1px solid rgba(255,107,107,0.28)", borderRadius:9, color:T.red, fontSize:12, fontWeight:600, textDecoration:"none" }}>
                  View Patient Record →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
