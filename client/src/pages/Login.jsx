import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ email:"", password:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow]       = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === "patient" ? "/dashboard" : "/admin");
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await login(form.email, form.password);
      navigate(u.role === "patient" ? "/dashboard" : "/admin");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg-main)" }}>
      {/* Left decorative panel */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px", position:"relative", overflow:"hidden", background:"var(--bg-panel)" }}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 70% 60% at 30% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 70%)` }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(var(--border-subtle) 1px, transparent 1px)", backgroundSize:"32px 32px" }} />
        
        <div className="animate-fade-up" style={{ position:"relative", zIndex:1, maxWidth:480, textAlign:"center" }}>
          <div style={{ width:80, height:80, borderRadius:24, background:`var(--accent-teal)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:40, color:"var(--bg-main)", margin:"0 auto 32px", boxShadow:`0 0 60px rgba(20, 184, 166, 0.25)` }}>N</div>
          <h1 className="serif" style={{ fontSize:48, color:"var(--text-primary)", marginBottom:16, lineHeight:1.1 }}>
            NeuroScan <em style={{ color:"var(--accent-teal)", fontStyle:"italic" }}>AI</em>
          </h1>
          <p style={{ fontSize:16, color:"var(--text-secondary)", lineHeight:1.8, maxWidth:340, margin:"0 auto" }}>
            Alzheimer's early detection through multimodal AI analysis
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:16, marginTop:64, textAlign:"left" }}>
            {[["🧬","94.7% accuracy","CNN ensemble on 6,400 MRI scans"],["📝","25 clinical questions","MMSE + MoCA + SLUMS"],["📄","Instant PDF reports","AI-generated clinical documentation"]].map(([icon, title, sub], i) => (
              <div key={title} className="glass-panel animate-fade-up" style={{ animationDelay:`${(i+1)*100}ms`, display:"flex", alignItems:"center", gap:16, padding:"16px 20px" }}>
                <span style={{ fontSize:24 }}>{icon}</span>
                <div><div style={{ fontWeight:600, fontSize:15, color:"var(--text-primary)", marginBottom:2 }}>{title}</div><div style={{ fontSize:13, color:"var(--text-secondary)" }}>{sub}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div style={{ width:480, flexShrink:0, borderLeft:"1px solid var(--border-subtle)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"56px 48px", background:"rgba(4, 8, 16, 0.6)", backdropFilter:"blur(20px)" }} className="login-panel">
        <div className="animate-fade-up delay-100" style={{ width:"100%", maxWidth:360 }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <h2 className="serif" style={{ fontSize:32, color:"var(--text-primary)", marginBottom:12 }}>Welcome back</h2>
            <div style={{ fontSize:14, color:"var(--text-secondary)" }}>Sign in to your NeuroScan account</div>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Email address</label>
              <input className="input-field" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} required />
            </div>
            <div style={{ marginBottom:32 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Password</label>
              </div>
              <div style={{ position:"relative" }}>
                <input className="input-field" type={show ? "text" : "password"} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))}
                  style={{ paddingRight:44 }} required />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--text-secondary)", fontSize:16, cursor:"pointer", padding:"4px" }}>
                  {show ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-fade-in" style={{ background:"rgba(239, 68, 68, 0.1)", border:"1px solid rgba(239, 68, 68, 0.3)", borderRadius:"var(--radius-sm)", padding:"12px 16px", color:"var(--accent-red)", fontSize:13, marginBottom:24, display:"flex", alignItems:"center", gap:10 }}>
                <span>⚠️</span>{error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width:"100%", padding:16, fontSize:16, justifyContent:"center" }}>
              {loading ? <><span className="spinner" style={{ marginRight:8 }} /> Signing in…</> : "Sign In →"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:32, fontSize:14, color:"var(--text-secondary)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color:"var(--accent-teal)", fontWeight:600, textDecoration:"none" }}>Create one free</Link>
          </p>
          <p style={{ textAlign:"center", marginTop:16, fontSize:12, color:"var(--text-tertiary)" }}>
            ⚕️ For research use only
          </p>
        </div>
      </div>
{/* 
      <style dangerouslySetInnerHTML={{__html: `
        @media(max-width:860px){
          .login-panel { width:100% !important; border-left:none !important; }
          .auth-left { display:none !important; }
        }
      `}} /> */}
    </div>
  );
}
