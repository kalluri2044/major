import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GLOBAL_CSS, C } from "../components/DesignSystem";

export default function Register() {
  const { register } = useAuth();
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
  const strengthColor = ["",C.coral,C.amber,C.gold,C.teal][pw_strength] || C.border;

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS + `
.auth-page{min-height:100vh;display:flex;background:${C.bg};}
.auth-right{width:480px;flex-shrink:0;border-left:1px solid ${C.border};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 48px;background:rgba(7,18,32,0.6);}
.auth-left{flex:1;display:flex;align-items:center;justify-content:center;padding:40px;position:relative;overflow:hidden;}
@media(max-width:860px){.auth-right{width:100%;border-left:none;}.auth-left{display:none;}}
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

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
    <div className="auth-page">
      {/* Left decorative */}
      <div className="auth-left">
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 60% 50% at 40% 50%,rgba(0,212,170,0.07) 0%,transparent 70%)` }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(120,160,255,0.06) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:440 }}>
          <div style={{ width:72, height:72, borderRadius:22, background:`linear-gradient(135deg,${C.teal},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:36, color:"#040C1A", marginBottom:28, boxShadow:`0 0 50px rgba(0,212,170,0.2)` }}>N</div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:38, fontWeight:300, color:C.white, marginBottom:16, lineHeight:1.1 }}>
            Start your<br /><em style={{ color:C.teal }}>assessment today</em>
          </h2>
          <p style={{ fontSize:15, color:C.textDim, lineHeight:1.8, marginBottom:36 }}>
            Join thousands using AI-powered tools for early Alzheimer's detection and monitoring.
          </p>
          {[["✓","Free to register and use"],["✓","Complete assessment in under 20 min"],["✓","Instant AI analysis and PDF report"],["✓","Secure, HIPAA-minded data handling"]].map(([ic, txt]) => (
            <div key={txt} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <div style={{ width:22, height:22, borderRadius:6, background:C.tealDim, border:`1px solid rgba(0,212,170,0.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:C.teal, fontWeight:700, flexShrink:0 }}>{ic}</div>
              <span style={{ fontSize:14, color:C.textDim }}>{txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right">
        <div style={{ width:"100%", maxWidth:380 }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:30, fontWeight:300, color:C.white, marginBottom:8 }}>Create account</div>
            <div style={{ fontSize:14, color:C.textDim }}>Free · No credit card required</div>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom:16 }}>
              <label className="field-label">Full name</label>
              <input className="field" type="text" placeholder="Jane Doe"
                value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} required />
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="field-label">Email address</label>
              <input className="field" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} required />
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="field-label">Password</label>
              <div style={{ position:"relative" }}>
                <input className="field" type={show ? "text" : "password"} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))}
                  style={{ paddingRight:44 }} required />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.textDim, fontSize:16 }}>{show ? "🙈" : "👁"}</button>
              </div>
              {form.password && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i <= pw_strength ? strengthColor : C.border, transition:"background .3s" }} />)}
                  </div>
                  <div style={{ fontSize:11, color:strengthColor }}>{strengthLabel}</div>
                </div>
              )}
            </div>
            <div style={{ marginBottom:24 }}>
              <label className="field-label">Confirm password</label>
              <input className="field" type="password" placeholder="Re-enter password"
                value={form.confirm} onChange={e => setForm(f => ({...f, confirm:e.target.value}))} required />
            </div>

            {error && (
              <div style={{ background:"rgba(255,77,109,0.08)", border:"1px solid rgba(255,77,109,0.2)", borderRadius:12, padding:"12px 16px", color:C.coral, fontSize:13, marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
                <span>⚠️</span>{error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width:"100%", padding:14, fontSize:15, justifyContent:"center" }}>
              {loading ? <><div className="spin" style={{ width:16, height:16, border:"2px solid rgba(4,12,26,0.3)", borderTopColor:"#040C1A", borderRadius:"50%" }} />Creating account…</> : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:28, fontSize:14, color:C.textDim }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color:C.teal, fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
