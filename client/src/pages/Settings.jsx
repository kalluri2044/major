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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#0a1628;color:#fff;-webkit-font-smoothing:antialiased;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.au{animation:fadeUp .38s cubic-bezier(.22,.68,0,1.1) both}
.d1{animation-delay:.07s}.d2{animation-delay:.14s}.d3{animation-delay:.21s}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:99px}
input::placeholder{color:rgba(255,255,255,.2);}
input:focus,textarea:focus{border-color:rgba(0,212,170,.5)!important;outline:none;}
@media(max-width:860px){.settings-layout{flex-direction:column!important;}.settings-sidebar{width:100%!important;flex-direction:row!important;overflow-x:auto;}}
`;

const SECTIONS = [
  { id:"profile",   icon:"👤", label:"Profile" },
  { id:"password",  icon:"🔒", label:"Password" },
  { id:"notifications", icon:"🔔", label:"Notifications" },
  { id:"danger",    icon:"⚠️", label:"Danger Zone" },
];

const IS = { display:"block", width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, fontSize:14, color:"#fff", marginBottom:14 };

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  const c = type === "error" ? T.red : T.teal;
  return (
    <div style={{ position:"fixed", top:24, right:24, zIndex:9999, padding:"12px 20px", borderRadius:12, background:`${c}18`, border:`1px solid ${c}44`, color:c, fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:10 }}>
      {type==="error"?"✕":"✓"} {msg}
      <button onClick={onClose} style={{ background:"none", border:"none", color:c, cursor:"pointer", fontSize:16, padding:0 }}>×</button>
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
    const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
    api.get("/notifications").then(({ data }) => setNotifs(data.notifications || [])).catch(() => {});
    return () => document.head.removeChild(s);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
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
  const notifColor = { info:T.teal, warning:T.amber, success:T.teal, danger:T.red };

  return (
    <div style={{ minHeight:"100vh", background:T.navy }}>
      <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

      {/* Top nav */}
      <div style={{ padding:"16px 32px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:14, position:"sticky", top:0, background:"rgba(10,22,40,.96)", backdropFilter:"blur(12px)", zIndex:10 }}>
        <button onClick={() => navigate("/dashboard")} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 14px", color:T.slateD, fontSize:13, cursor:"pointer" }}>← Dashboard</button>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.teal, textTransform:"uppercase", letterSpacing:".08em", marginBottom:2 }}>Account</div>
          <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:20, color:"#fff" }}>Settings</div>
        </div>
      </div>

      <div style={{ display:"flex", maxWidth:1000, margin:"0 auto", padding:"32px 24px", gap:24 }} className="settings-layout">

        {/* Sidebar */}
        <div className="settings-sidebar" style={{ width:220, flexShrink:0, display:"flex", flexDirection:"column", gap:4 }}>
          {/* User avatar */}
          <div style={{ padding:"16px", background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:10, textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:T.tealDim, border:`2px solid rgba(0,212,170,.3)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:28, color:T.teal, margin:"0 auto 10px" }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2 }}>{user?.name}</div>
            <div style={{ fontSize:11, color:T.slateD }}>{user?.email}</div>
            <div style={{ marginTop:6, padding:"3px 10px", borderRadius:99, background:T.tealDim, color:T.teal, fontSize:10, fontWeight:600, display:"inline-block", textTransform:"capitalize" }}>{user?.role}</div>
          </div>

          {SECTIONS.map(({ id, icon, label }) => (
            <div key={id} onClick={() => setSection(id)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, cursor:"pointer",
              background: section === id ? T.tealDim : "rgba(255,255,255,0.02)",
              border: `1px solid ${section === id ? "rgba(0,212,170,.3)" : T.border}`,
              transition:"all .15s",
            }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <span style={{ fontSize:13, fontWeight:section===id?600:400, color:section===id?T.teal:"rgba(255,255,255,.5)" }}>{label}</span>
              {id === "notifications" && unread > 0 && (
                <span style={{ marginLeft:"auto", padding:"2px 7px", borderRadius:99, background:T.red, color:"#fff", fontSize:10, fontWeight:700 }}>{unread}</span>
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1 }}>

          {/* ── PROFILE ────────────────────────────────────── */}
          {section === "profile" && (
            <div className="au">
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:18, fontWeight:600, color:"#fff", marginBottom:4 }}>Profile Information</div>
                <div style={{ fontSize:13, color:T.slateD }}>Update your name and email address.</div>
              </div>
              <div style={{ background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:16, padding:24 }}>
                <label style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:6 }}>Full Name</label>
                <input style={IS} value={profile.name} onChange={e => setProfile(p => ({...p, name:e.target.value}))} placeholder="Your full name" />
                <label style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:6 }}>Email Address</label>
                <input type="email" style={IS} value={profile.email} onChange={e => setProfile(p => ({...p, email:e.target.value}))} placeholder="you@example.com" />
                <button onClick={saveProfile} disabled={loading} style={{ padding:"12px 24px", background:T.teal, color:T.navy, border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", opacity:loading?.7:1, marginTop:4 }}>
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ── PASSWORD ───────────────────────────────────── */}
          {section === "password" && (
            <div className="au">
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:18, fontWeight:600, color:"#fff", marginBottom:4 }}>Change Password</div>
                <div style={{ fontSize:13, color:T.slateD }}>Keep your account secure with a strong password.</div>
              </div>
              <div style={{ background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:16, padding:24 }}>
                {[["Current Password","old_password","Your current password"],["New Password","new_password","Minimum 6 characters"],["Confirm New Password","confirm","Repeat new password"]].map(([l,k,ph])=>(
                  <div key={k}>
                    <label style={{ fontSize:11, fontWeight:600, color:T.slateD, textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:6 }}>{l}</label>
                    <input type="password" style={IS} placeholder={ph} value={pwForm[k]} onChange={e => setPwForm(p => ({...p,[k]:e.target.value}))} />
                  </div>
                ))}
                <button onClick={savePassword} disabled={loading} style={{ padding:"12px 24px", background:T.teal, color:T.navy, border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", opacity:loading?.7:1, marginTop:4 }}>
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ──────────────────────────────── */}
          {section === "notifications" && (
            <div className="au">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:600, color:"#fff", marginBottom:4 }}>Notifications</div>
                  <div style={{ fontSize:13, color:T.slateD }}>{unread} unread</div>
                </div>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ padding:"8px 16px", background:T.tealDim, border:"1px solid rgba(0,212,170,.3)", borderRadius:8, color:T.teal, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Mark All Read
                  </button>
                )}
              </div>
              <div style={{ background:T.navyCard, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
                {notifs.length === 0 ? (
                  <div style={{ padding:"48px", textAlign:"center", color:T.slateD, fontSize:14 }}>
                    <div style={{ fontSize:32, marginBottom:12, opacity:.3 }}>🔔</div>
                    No notifications yet.
                  </div>
                ) : (
                  notifs.map((n, i) => {
                    const c = notifColor[n.type] || T.teal;
                    return (
                      <div key={n.id} style={{ display:"flex", gap:12, padding:"14px 18px", borderBottom: i < notifs.length-1 ? `1px solid ${T.border}` : "none", opacity: n.is_read ? 0.5 : 1, background: !n.is_read ? "rgba(0,212,170,0.02)" : "transparent", transition:"opacity .2s" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0, marginTop:5 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2 }}>{n.title}</div>
                          <div style={{ fontSize:12, color:T.slateD, lineHeight:1.5 }}>{n.message}</div>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", marginTop:4 }}>
                            {new Date(n.created_at).toLocaleString("en", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                          </div>
                        </div>
                        {!n.is_read && (
                          <button onClick={async () => { try { await api.put(`/notifications/${n.id}/read`); setNotifs(notifs.map(nn => nn.id===n.id?{...nn,is_read:true}:nn)); } catch {} }} style={{ background:"none", border:"none", color:T.slateD, cursor:"pointer", fontSize:11, padding:"0 4px", flexShrink:0, marginTop:2 }}>✓</button>
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
            <div className="au">
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:18, fontWeight:600, color:T.red, marginBottom:4 }}>Danger Zone</div>
                <div style={{ fontSize:13, color:T.slateD }}>These actions are irreversible. Please proceed with caution.</div>
              </div>
              <div style={{ background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:6 }}>Deactivate Account</div>
                <div style={{ fontSize:13, color:T.slateD, marginBottom:20, lineHeight:1.6 }}>
                  Deactivating your account will prevent login and hide your data from the system. Your assessment history is preserved. Contact your clinic to reactivate.
                </div>
                {!showDel ? (
                  <button onClick={() => setShowDel(true)} style={{ padding:"11px 22px", background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.3)", borderRadius:10, color:T.red, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    Deactivate My Account
                  </button>
                ) : (
                  <div>
                    <div style={{ fontSize:12, color:T.slateD, marginBottom:8 }}>Enter your password to confirm:</div>
                    <input type="password" style={{ ...IS, borderColor:"rgba(255,107,107,.3)", marginBottom:12 }} value={delPw} onChange={e => setDelPw(e.target.value)} placeholder="Your password" />
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={() => setShowDel(false)} style={{ padding:"10px 20px", background:"rgba(255,255,255,.05)", border:`1px solid ${T.border}`, borderRadius:9, color:T.slateD, fontSize:13, cursor:"pointer" }}>Cancel</button>
                      <button onClick={deactivateAccount} disabled={loading || !delPw} style={{ padding:"10px 22px", background:T.red, border:"none", borderRadius:9, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", opacity:loading||!delPw?.5:1 }}>
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
