import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GLOBAL_CSS, C } from "../components/DesignSystem";

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ email:"", password:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow]       = useState(false);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS + `
.auth-page{min-height:100vh;display:flex;background:${C.bg};}
.auth-left{flex:1;display:flex;align-items:center;justify-content:center;padding:40px;position:relative;overflow:hidden;}
.auth-right{width:460px;flex-shrink:0;border-left:1px solid ${C.border};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 48px;position:relative;background:rgba(7,18,32,0.6);}
.auth-logo{font-family:'Fraunces',serif;font-size:32px;font-weight:300;color:${C.white};margin-bottom:8px;}
.auth-sub{font-size:14px;color:${C.textDim};margin-bottom:48px;}
@media(max-width:860px){.auth-right{width:100%;border-left:none;}.auth-left{display:none;}}
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

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
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-left">
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 70% 60% at 30% 50%,rgba(0,212,170,0.08) 0%,transparent 70%)` }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(120,160,255,0.06) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:480, textAlign:"center" }}>
          <div style={{ width:80, height:80, borderRadius:24, background:`linear-gradient(135deg,${C.teal},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:40, color:"#040C1A", margin:"0 auto 32px", boxShadow:`0 0 60px rgba(0,212,170,0.25)` }}>N</div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:42, fontWeight:300, color:C.white, marginBottom:16, lineHeight:1.1 }}>
            NeuroScan<br /><em style={{ color:C.teal }}>AI</em>
          </h1>
          <p style={{ fontSize:16, color:C.textDim, lineHeight:1.8, maxWidth:340, margin:"0 auto" }}>
            Alzheimer's early detection through multimodal AI analysis
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:48, textAlign:"left" }}>
            {[["🧬","94.7% accuracy","CNN ensemble on 6,400 MRI scans"],["📝","25 clinical questions","MMSE + MoCA + SLUMS"],["📄","Instant PDF reports","AI-generated clinical documentation"]].map(([icon, title, sub]) => (
              <div key={title} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background:"rgba(255,255,255,0.03)", borderRadius:14, border:`1px solid ${C.border}` }}>
                <span style={{ fontSize:22 }}>{icon}</span>
                <div><div style={{ fontWeight:600, fontSize:14, color:C.white }}>{title}</div><div style={{ fontSize:12, color:C.textDim }}>{sub}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="auth-right">
        <div style={{ width:"100%", maxWidth:360 }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div className="auth-logo">Welcome back</div>
            <div className="auth-sub">Sign in to your NeuroScan account</div>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom:20 }}>
              <label className="field-label">Email address</label>
              <input className="field" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} required />
            </div>
            <div style={{ marginBottom:28 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <label className="field-label" style={{ margin:0 }}>Password</label>
              </div>
              <div style={{ position:"relative" }}>
                <input className="field" type={show ? "text" : "password"} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))}
                  style={{ paddingRight:44 }} required />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.textDim, fontSize:16, lineHeight:1, padding:"2px 4px" }}>
                  {show ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background:"rgba(255,77,109,0.08)", border:"1px solid rgba(255,77,109,0.2)", borderRadius:12, padding:"12px 16px", color:C.coral, fontSize:13, marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <span>⚠️</span>{error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width:"100%", padding:14, fontSize:15, justifyContent:"center" }}>
              {loading ? <><div className="spin" style={{ width:16, height:16, border:"2px solid rgba(4,12,26,0.3)", borderTopColor:"#040C1A", borderRadius:"50%" }} /> Signing in…</> : "Sign In →"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:28, fontSize:14, color:C.textDim }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color:C.teal, fontWeight:600 }}>Create one free</Link>
          </p>
          <p style={{ textAlign:"center", marginTop:8, fontSize:12, color:C.textFaint }}>
            ⚕️ For research use only
          </p>
        </div>
      </div>
    </div>
  );
}
