import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, user } = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]       = useState({ name:"", email:"", password:"", confirm:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow]       = useState(false);

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const pw_strength = strength(form.password);
  const strengthLabel = ["","Weak","Fair","Good","Strong"][pw_strength] || "";
  const strengthColor = ["","var(--accent-red)","var(--accent-amber)","#fb923c","var(--accent-teal)"][pw_strength] || "var(--border-subtle)";

  useEffect(() => {
    if (user) navigate(user.role === "patient" ? "/dashboard" : "/admin");
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(""); setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg-main)" }}>
      {/* Left decorative */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px", position:"relative", overflow:"hidden", background:"var(--bg-panel)" }}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 60% 50% at 40% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 70%)` }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(var(--border-subtle) 1px, transparent 1px)", backgroundSize:"32px 32px" }} />
        
        <div className="animate-fade-up" style={{ position:"relative", zIndex:1, maxWidth:480 }}>
          <div style={{ width:72, height:72, borderRadius:24, background:`var(--accent-teal)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:36, color:"var(--bg-main)", marginBottom:32, boxShadow:`0 0 50px rgba(20, 184, 166, 0.25)` }}>N</div>
          <h2 className="serif" style={{ fontSize:42, color:"var(--text-primary)", marginBottom:16, lineHeight:1.1 }}>
            Start your<br /><em style={{ color:"var(--accent-teal)", fontStyle:"italic" }}>assessment today</em>
          </h2>
          <p style={{ fontSize:16, color:"var(--text-secondary)", lineHeight:1.8, marginBottom:48 }}>
            Join thousands using AI-powered tools for early Alzheimer's detection and monitoring.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[["✓","Free to register and use"],["✓","Complete assessment in under 20 min"],["✓","Instant AI analysis and PDF report"],["✓","Secure, HIPAA-minded data handling"]].map(([ic, txt], i) => (
              <div key={txt} className="animate-fade-up" style={{ animationDelay:`${(i+1)*100}ms`, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:24, height:24, borderRadius:6, background:"var(--accent-teal-dim)", border:`1px solid rgba(20, 184, 166, 0.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"var(--accent-teal)", fontWeight:700, flexShrink:0 }}>{ic}</div>
                <span style={{ fontSize:15, color:"var(--text-secondary)" }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div style={{ width:480, flexShrink:0, borderLeft:"1px solid var(--border-subtle)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"56px 48px", background:"rgba(4, 8, 16, 0.6)", backdropFilter:"blur(20px)" }} className="login-panel">
        <div className="animate-fade-up delay-100" style={{ width:"100%", maxWidth:360 }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <h2 className="serif" style={{ fontSize:32, color:"var(--text-primary)", marginBottom:12 }}>Create account</h2>
            <div style={{ fontSize:14, color:"var(--text-secondary)" }}>Free · No credit card required</div>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Full name</label>
              <input className="input-field" type="text" placeholder="Jane Doe"
                value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} required />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Email address</label>
              <input className="input-field" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} required />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Password</label>
              <div style={{ position:"relative" }}>
                <input className="input-field" type={show ? "text" : "password"} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))}
                  style={{ paddingRight:44 }} required />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--text-secondary)", fontSize:16, cursor:"pointer", padding:"4px" }}>{show ? "🙈" : "👁"}</button>
              </div>
              {form.password && (
                <div className="animate-fade-in" style={{ marginTop:8 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:6 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:4, borderRadius:99, background: i <= pw_strength ? strengthColor : "var(--border-subtle)", transition:"background .3s" }} />)}
                  </div>
                  <div style={{ fontSize:12, color:strengthColor, fontWeight:500 }}>{strengthLabel}</div>
                </div>
              )}
            </div>
            <div style={{ marginBottom:32 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Confirm password</label>
              <input className="input-field" type="password" placeholder="Re-enter password"
                value={form.confirm} onChange={e => setForm(f => ({...f, confirm:e.target.value}))} required />
            </div>

            {error && (
              <div className="animate-fade-in" style={{ background:"rgba(239, 68, 68, 0.1)", border:"1px solid rgba(239, 68, 68, 0.3)", borderRadius:"var(--radius-sm)", padding:"12px 16px", color:"var(--accent-red)", fontSize:13, marginBottom:24, display:"flex", alignItems:"center", gap:10 }}>
                <span>⚠️</span>{error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width:"100%", padding:16, fontSize:16, justifyContent:"center" }}>
              {loading ? <><span className="spinner" style={{ marginRight:8 }} />Creating account…</> : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:32, fontSize:14, color:"var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color:"var(--accent-teal)", fontWeight:600, textDecoration:"none" }}>Sign in</Link>
          </p>
        </div>
      </div>
      {/* 
      <style dangerouslySetInnerHTML={{__html: `
        @media(max-width:860px){
          .login-panel { width:100% !important; border-left:none !important; }
        }
      `}} /> */}
    </div>
  );
}
