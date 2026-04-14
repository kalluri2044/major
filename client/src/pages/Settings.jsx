import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SECTIONS = [
  { id:"profile",       icon:"👤", label:"Profile" },
  { id:"password",      icon:"🔒", label:"Password" },
  { id:"notifications", icon:"🔔", label:"Notifications" },
  { id:"danger",        icon:"⚠️", label:"Danger Zone" },
];

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  const isError = type === "error";
  return (
    <div className="animate-fade-up" style={{ position:"fixed", top:32, right:32, zIndex:9999, padding:"16px 24px", borderRadius:"var(--radius-md)", background:isError?"rgba(239, 68, 68, 0.15)":"rgba(20, 184, 166, 0.15)", border:`1px solid ${isError?"rgba(239, 68, 68, 0.4)":"rgba(20, 184, 166, 0.4)"}`, color:isError?"var(--accent-red)":"var(--accent-teal)", fontSize:14, fontWeight:500, display:"flex", alignItems:"center", gap:12, backdropFilter:"blur(12px)", boxShadow:"var(--shadow-panel)" }}>
      <span style={{ fontSize:18 }}>{isError?"❌":"✅"}</span> {msg}
      <button onClick={onClose} style={{ background:"none", border:"none", color:"inherit", cursor:"pointer", fontSize:18, padding:"0 4px", marginLeft:8 }}>×</button>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("profile");
  const [toast,   setToast]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifs,  setNotifs]  = useState([]);

  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
  const [pwForm,  setPwForm]  = useState({ old_password:"", new_password:"", confirm:"" });
  const [delPw,   setDelPw]   = useState("");
  const [showDel, setShowDel] = useState(false);

  useEffect(() => {
    api.get("/notifications").then(({ data }) => setNotifs(data.notifications || [])).catch(() => {});
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      await api.put("/settings/profile", profile);
      showToast("Profile updated successfully.");
    } catch (e) { showToast(e.response?.data?.error || "Update failed.", "error"); }
    finally { setLoading(false); }
  };

  const savePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm) { showToast("New passwords do not match.", "error"); return; }
    if (pwForm.new_password.length < 6) { showToast("Password must be at least 6 characters.", "error"); return; }
    setLoading(true);
    try {
      await api.put("/settings/password", { old_password: pwForm.old_password, new_password: pwForm.new_password });
      showToast("Password changed successfully.");
      setPwForm({ old_password:"", new_password:"", confirm:"" });
    } catch (e) { showToast(e.response?.data?.error || "Failed.", "error"); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifs(notifs.map(n => ({ ...n, is_read: true })));
      showToast("All notifications marked as read.");
    } catch { showToast("Failed to mark notifications.", "error"); }
  };

  const deactivateAccount = async () => {
    setLoading(true);
    try {
      await api.delete("/settings/account", { data: { password: delPw } });
      logout();
      navigate("/login");
    } catch (e) { showToast(e.response?.data?.error || "Incorrect password.", "error"); }
    finally { setLoading(false); }
  };

  const unread = notifs.filter(n => !n.is_read).length;
  const notifColor = { info:"var(--accent-teal)", warning:"var(--accent-amber)", success:"var(--accent-teal)", danger:"var(--accent-red)" };

  return (
    <div className="page-container" style={{ flexDirection:"column" }}>
      <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

      {/* Top nav */}
      <div style={{ padding:"20px 40px", borderBottom:`1px solid var(--border-subtle)`, display:"flex", alignItems:"center", gap:16, position:"sticky", top:0, background:"rgba(11, 17, 32, 0.8)", backdropFilter:"blur(12px)", zIndex:10 }}>
        <button onClick={() => navigate("/dashboard")} className="btn-secondary" style={{ padding:"8px 16px" }}>← Dashboard</button>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:2 }}>Account</div>
          <div style={{ fontSize:18, fontWeight:600, color:"var(--text-primary)" }}>Settings</div>
        </div>
      </div>

      <div style={{ display:"flex", maxWidth:1100, margin:"0 auto", padding:"48px", gap:32, width:"100%" }}>

        {/* Sidebar */}
        <div style={{ width:260, flexShrink:0, display:"flex", flexDirection:"column", gap:8 }}>
          {/* User avatar */}
          <div className="glass-panel" style={{ padding:"24px", marginBottom:16, textAlign:"center" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--accent-teal-dim)", border:`2px solid rgba(20, 184, 166, 0.3)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:32, color:"var(--accent-teal)", margin:"0 auto 12px" }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:"var(--text-primary)", marginBottom:4 }}>{user?.name}</div>
            <div style={{ fontSize:13, color:"var(--text-secondary)" }}>{user?.email}</div>
            <div style={{ marginTop:12, padding:"4px 12px", borderRadius:99, background:"var(--accent-teal-dim)", color:"var(--accent-teal)", fontSize:11, fontWeight:600, display:"inline-block", textTransform:"capitalize" }}>{user?.role}</div>
          </div>

          {SECTIONS.map(({ id, icon, label }) => (
            <div key={id} onClick={() => setSection(id)} style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:"var(--radius-md)", cursor:"pointer",
              background: section === id ? "var(--accent-teal-dim)" : "var(--bg-panel)",
              border: `1px solid ${section === id ? "rgba(20, 184, 166, 0.3)" : "transparent"}`,
              transition:"all .2s",
            }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ fontSize:14, fontWeight:section===id?600:500, color:section===id?"var(--accent-teal)":"var(--text-secondary)" }}>{label}</span>
              {id === "notifications" && unread > 0 && (
                <span style={{ marginLeft:"auto", padding:"2px 8px", borderRadius:99, background:"var(--accent-red)", color:"var(--bg-main)", fontSize:11, fontWeight:700 }}>{unread}</span>
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1 }}>

          {/* ── PROFILE ────────────────────────────────────── */}
          {section === "profile" && (
            <div className="animate-fade-up">
              <div style={{ marginBottom:24 }}>
                <h2 style={{ fontSize:22, fontWeight:600, color:"var(--text-primary)", marginBottom:6 }}>Profile Information</h2>
                <div style={{ fontSize:14, color:"var(--text-secondary)" }}>Update your name and email address.</div>
              </div>
              <div className="glass-panel" style={{ padding:"32px" }}>
                <label style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:8 }}>Full Name</label>
                <input className="input-field" style={{ marginBottom:20 }} value={profile.name} onChange={e => setProfile(p => ({...p, name:e.target.value}))} placeholder="Your full name" />
                <label style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:8 }}>Email Address</label>
                <input type="email" className="input-field" style={{ marginBottom:24 }} value={profile.email} onChange={e => setProfile(p => ({...p, email:e.target.value}))} placeholder="you@example.com" />
                <button className="btn-primary" onClick={saveProfile} disabled={loading}>
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ── PASSWORD ───────────────────────────────────── */}
          {section === "password" && (
            <div className="animate-fade-up">
              <div style={{ marginBottom:24 }}>
                <h2 style={{ fontSize:22, fontWeight:600, color:"var(--text-primary)", marginBottom:6 }}>Change Password</h2>
                <div style={{ fontSize:14, color:"var(--text-secondary)" }}>Keep your account secure with a strong password.</div>
              </div>
              <div className="glass-panel" style={{ padding:"32px" }}>
                {[["Current Password","old_password","Your current password"],["New Password","new_password","Minimum 6 characters"],["Confirm New Password","confirm","Repeat new password"]].map(([l,k,ph])=>(
                  <div key={k} style={{ marginBottom:20 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:8 }}>{l}</label>
                    <input type="password" className="input-field" placeholder={ph} value={pwForm[k]} onChange={e => setPwForm(p => ({...p,[k]:e.target.value}))} />
                  </div>
                ))}
                <button className="btn-primary" onClick={savePassword} disabled={loading} style={{ marginTop:8 }}>
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ──────────────────────────────── */}
          {section === "notifications" && (
            <div className="animate-fade-up">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <div>
                  <h2 style={{ fontSize:22, fontWeight:600, color:"var(--text-primary)", marginBottom:6 }}>Notifications</h2>
                  <div style={{ fontSize:14, color:"var(--text-secondary)" }}>{unread} unread</div>
                </div>
                {unread > 0 && (
                  <button className="btn-secondary" onClick={markAllRead} style={{ color:"var(--accent-teal)", borderColor:"var(--accent-teal-dim)", background:"rgba(20, 184, 166, 0.05)" }}>
                    Mark All Read
                  </button>
                )}
              </div>
              <div className="glass-panel" style={{ overflow:"hidden" }}>
                {notifs.length === 0 ? (
                  <div style={{ padding:"64px 32px", textAlign:"center", color:"var(--text-secondary)", fontSize:15 }}>
                    <div style={{ fontSize:40, marginBottom:16, opacity:.5 }}>🔔</div>
                    No notifications yet.
                  </div>
                ) : (
                  notifs.map((n, i) => {
                    const c = notifColor[n.type] || "var(--accent-teal)";
                    return (
                      <div key={n.id} style={{ display:"flex", gap:16, padding:"20px 24px", borderBottom: i < notifs.length-1 ? `1px solid var(--border-subtle)` : "none", opacity: n.is_read ? 0.6 : 1, background: !n.is_read ? "rgba(20, 184, 166, 0.03)" : "transparent", transition:"opacity .2s" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0, marginTop:8 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:4 }}>{n.title}</div>
                          <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>{n.message}</div>
                          <div style={{ fontSize:11, color:"var(--text-tertiary)", marginTop:8 }}>
                            {new Date(n.created_at).toLocaleString("en", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                          </div>
                        </div>
                        {!n.is_read && (
                          <button onClick={async () => { try { await api.put(`/notifications/${n.id}/read`); setNotifs(notifs.map(nn => nn.id===n.id?{...nn,is_read:true}:nn)); } catch {} }} className="btn-secondary" style={{ padding:"4px 12px", fontSize:12 }}>Mark read</button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── DANGER ZONE ────────────────────────────────── */}
          {section === "danger" && (
            <div className="animate-fade-up">
              <div style={{ marginBottom:24 }}>
                <h2 style={{ fontSize:22, fontWeight:600, color:"var(--accent-red)", marginBottom:6 }}>Danger Zone</h2>
                <div style={{ fontSize:14, color:"var(--text-secondary)" }}>These actions are irreversible. Please proceed with caution.</div>
              </div>
              <div className="glass-panel" style={{ background:"rgba(239, 68, 68, 0.05)", border:"1px solid rgba(239, 68, 68, 0.2)", padding:"32px" }}>
                <div style={{ fontSize:16, fontWeight:600, color:"var(--text-primary)", marginBottom:8 }}>Deactivate Account</div>
                <div style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:24, lineHeight:1.6 }}>
                  Deactivating your account will prevent login and hide your data from the system. Your assessment history is preserved. Contact your clinic to reactivate.
                </div>
                {!showDel ? (
                  <button className="btn-primary" onClick={() => setShowDel(true)} style={{ background:"rgba(239, 68, 68, 0.15)", color:"var(--accent-red)" }}>
                    Deactivate My Account
                  </button>
                ) : (
                  <div className="animate-fade-in">
                    <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:8 }}>Enter your password to confirm:</div>
                    <input type="password" className="input-field" style={{ borderColor:"rgba(239, 68, 68, 0.3)", marginBottom:16 }} value={delPw} onChange={e => setDelPw(e.target.value)} placeholder="Your password" />
                    <div style={{ display:"flex", gap:12 }}>
                      <button className="btn-secondary" onClick={() => setShowDel(false)}>Cancel</button>
                      <button className="btn-primary" onClick={deactivateAccount} disabled={loading || !delPw} style={{ background:"var(--accent-red)" }}>
                        {loading ? "Processing…" : "Confirm Deactivation"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
