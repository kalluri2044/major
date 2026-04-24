import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PILLARS = [
  { 
    icon:"🧬", 
    title:"94.7% Accuracy", 
    sub:"CNN Ensemble Architecture", 
    desc:"Our proprietary VGG16 + ResNet50 neural network ensemble was trained on 6,400 high-resolution MRI scans.",
    c:"#14B8A6" 
  },
  { 
    icon:"📝", 
    title:"25 Clinical Questions", 
    sub:"MMSE + MoCA + SLUMS", 
    desc:"A comprehensive cognitive assessment battery covering memory, orientation, attention, and executive function.",
    c:"#8B5CF6" 
  },
  { 
    icon:"📄", 
    title:"Instant PDF Reports", 
    sub:"Standardized Documentation", 
    desc:"Receive clear, clinical-grade diagnostic reports with stage-specific recommendations immediately upon completion.",
    c:"#3B82F6" 
  },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === "patient" ? "/dashboard" : "/admin");
  }, [user, navigate]);

  return (
    <div style={{ minHeight:"100vh", background:"#0B1120", color:"#FFFFFF", overflowX:"hidden", display:"flex", flexDirection:"column" }}>

      {/* Floating Header */}
      <nav style={{ padding:"0 clamp(20px, 5vw, 64px)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(11, 17, 32, 0.7)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", height:80, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:14, background:"linear-gradient(135deg, #14B8A6, #3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:24, color:"#0B1120", fontWeight:700, boxShadow:"0 0 20px rgba(20, 184, 166, 0.3)" }}>N</div>
            <span style={{ fontFamily:"'Outfit', sans-serif", fontSize:22, fontWeight:700, letterSpacing:"-0.01em" }}>NeuroScan <span className="serif" style={{ color:"#14B8A6", fontStyle:"italic", fontWeight:400 }}>AI</span></span>
          </div>
          <div style={{ display:"flex", gap:16 }}>
            <button className="btn-secondary" style={{ padding:"10px 24px", fontSize:14 }} onClick={() => navigate("/login")}>Sign In</button>
            <button className="btn-primary" style={{ padding:"10px 28px", fontSize:14 }} onClick={() => navigate("/register")}>Get Started</button>
          </div>
        </div>
      </nav>

      <main style={{ flex:1, paddingTop:80 }}>
        
        {/* HERO SECTION */}
        <section style={{ position:"relative", padding:"clamp(100px, 15vh, 200px) clamp(20px, 5vw, 64px) clamp(100px, 12vh, 160px)", textAlign:"center" }}>
          {/* Animated Background */}
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:"20%", left:"10%", width:"30vw", height:"30vw", background:"radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 60%)", filter:"blur(100px)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:"20%", right:"10%", width:"30vw", height:"30vw", background:"radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)", filter:"blur(100px)", pointerEvents:"none" }} />
          
          <div style={{ maxWidth:1200, margin:"0 auto", position:"relative", zIndex:1 }}>
            <div className="badge badge-teal animate-fade-up" style={{ marginBottom:32 }}>
              Clinical Intelligence Pipeline
            </div>
            
            <h1 className="animate-fade-up delay-100" style={{ fontSize:"clamp(44px, 7vw, 92px)", fontWeight:300, lineHeight:1.02, letterSpacing:"-0.03em", maxWidth:1000, margin:"0 auto 40px" }}>
              Quantifying Neural Health with <br />
              <span style={{ color:"#14B8A6" }}>Multimodal</span> <em className="serif" style={{ fontStyle:"italic" }}>Deep Learning.</em>
            </h1>
            
            <p className="animate-fade-up delay-200" style={{ fontSize:"clamp(17px, 2vw, 22px)", color:"rgba(255,255,255,0.6)", maxWidth:700, margin:"0 auto 56px", lineHeight:1.6 }}>
              Evidence-based Alzheimer's early detection combining volumetric MRI analysis with advanced cognitive linguistics.
            </p>
            
            <div className="animate-fade-up delay-300" style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn-primary" onClick={() => navigate("/register")} style={{ padding:"18px 48px", fontSize:17, boxShadow:"0 15px 30px rgba(20, 184, 166, 0.15)" }}>
                Start Assessment Pipeline →
              </button>
            </div>
          </div>
        </section>

        {/* PILLARS SECTION - The 24 p1 points */}
        <section style={{ padding:"0 clamp(20px, 5vw, 64px) 160px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:32 }}>
            {PILLARS.map((p,i) => (
              <div key={i} className="glass-panel animate-fade-up" style={{ 
                padding:40, 
                transition:"transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                animationDelay:`${(i+4)*100}ms`,
                borderTop:`4px solid ${p.c}`,
                background:"linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)"
              }}>
                <div style={{ width:64, height:64, borderRadius:20, background:`${p.c}1a`, border:`1px solid ${p.c}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, marginBottom:32 }}>
                  {p.icon}
                </div>
                <h3 style={{ fontSize:26, marginBottom:8 }}>{p.title}</h3>
                <div style={{ color:p.c, fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:24 }}>{p.sub}</div>
                <p style={{ color:"rgba(255,255,255,0.55)", fontSize:15, lineHeight:1.7 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* REFINED CTA */}
        <section style={{ padding:"80px clamp(20px, 5vw, 64px) 160px", background:"linear-gradient(180deg, transparent, rgba(20, 184, 166, 0.05))" }}>
          <div className="glass-panel animate-fade-up" style={{ 
            maxWidth:1000, 
            margin:"0 auto", 
            padding:"80px 40px", 
            textAlign:"center",
            background:"rgba(255,255,255,0.01)",
            borderColor:"rgba(255,255,255,0.05)"
          }}>
            <h2 className="serif" style={{ fontSize:"clamp(32px, 4vw, 56px)", marginBottom:24, fontStyle:"italic" }}>Precision. Vision. Clarity.</h2>
            <p style={{ color:"rgba(255,255,255,0.6)", maxWidth:500, margin:"0 auto 48px", lineHeight:1.6 }}>Empowering clinicians with the data needed to catch cognitive decline years before the first clinical symptoms appear.</p>
            <button className="btn-primary" onClick={() => navigate("/register")} style={{ padding:"16px 40px" }}>Create Clinical Account →</button>
          </div>
        </section>

      </main>

      <footer style={{ padding:"60px clamp(20px, 5vw, 64px)", borderTop:"1px solid rgba(255,255,255,0.05)", background:"rgba(4, 8, 16, 0.3)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14 }}>N</div>
            <span style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.4)" }}>NeuroScan AI</span>
          </div>
          <div style={{ display:"flex", gap:32, color:"rgba(255,255,255,0.3)", fontSize:13 }}>
            <span>Privacy</span>
            <span>Security</span>
            <span>GDPR / HIPAA</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .glass-panel:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
