import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon:"🧬", title:"CNN Ensemble", sub:"VGG16 + ResNet50", desc:"Dual-model architecture achieves 94.7% classification accuracy across four Alzheimer's severity stages.", c:"var(--accent-teal)" },
  { icon:"📝", title:"25-Q Cognitive Test", sub:"MMSE · MoCA · SLUMS", desc:"Seven cognitive domains tested: memory, orientation, attention, language, visuospatial, executive, recall.", c:"var(--accent-purple)" },
  { icon:"👤", title:"Evidence-Based Risk", sub:"Lancet Commission", desc:"Age, genetics, education, lifestyle, and 10 comorbidity factors scored against validated clinical weights.", c:"var(--accent-blue)" },
  { icon:"⚡", title:"Fusion Engine", sub:"Weighted multimodal", desc:"Demographics (20%) + Cognitive (35%) + MRI (45%) → final AD risk score with confidence interval.", c:"var(--accent-amber)" },
  { icon:"📈", title:"Progression Tracking", sub:"Longitudinal analysis", desc:"Session-over-session delta charts reveal disease trajectory. Catch cognitive decline before it worsens.", c:"#fb923c" },
  { icon:"📄", title:"Clinical Reports", sub:"ReportLab PDF", desc:"Auto-generated 9-section clinical report with all data, stage-specific recommendations, and disclaimer.", c:"var(--accent-red)" },
];

const STATS = [
  { val:"94.7%", label:"Model accuracy", sub:"CNN ensemble on test set" },
  { val:"25",    label:"Clinical questions", sub:"MMSE + MoCA + SLUMS" },
  { val:"4",     label:"Severity stages", sub:"Non → Mild → Moderate" },
  { val:"100+",  label:"Recommendations", sub:"Evidence-based per stage" },
];

const STEPS = [
  ["Register","Create your secure patient account"],
  ["Demographics","12-field evidence-based risk form"],
  ["Cognitive Test","25 MMSE+MoCA questions, 7 domains"],
  ["MRI Upload","JPEG · PNG · DICOM · NIfTI"],
  ["AI Analysis","VGG16 + ResNet50 ensemble inference"],
  ["Results","Full report with recommendations"],
];

export default function Landing() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === "patient" ? "/dashboard" : "/admin");
  }, [user, navigate]);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-main)", color:"var(--text-primary)", overflowX:"hidden", display:"flex", flexDirection:"column" }}>

      {/* NAV */}
      <nav style={{ padding:"0 clamp(20px, 5vw, 64px)", background:"rgba(4, 8, 16, 0.8)", backdropFilter:"blur(16px)", borderBottom:"1px solid var(--border-subtle)", position:"fixed", top:0, left:0, right:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", height:72, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"var(--accent-teal)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:22, color:"var(--bg-main)", fontWeight:600 }}>N</div>
            <span style={{ fontFamily:"'Outfit', sans-serif", fontSize:20, fontWeight:700, letterSpacing:"0.5px" }}>NeuroScan <em className="serif" style={{ color:"var(--accent-teal)", fontStyle:"italic", fontWeight:400 }}>AI</em></span>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button className="btn-secondary" onClick={() => navigate("/login")}>Sign In</button>
            <button className="btn-primary" onClick={() => navigate("/register")}>Get Started</button>
          </div>
        </div>
      </nav>

      <main style={{ flex:1, paddingTop:72 }}>
        {/* HERO */}
        <section style={{ position:"relative", padding:"clamp(80px, 12vh, 160px) clamp(20px, 5vw, 64px) clamp(80px, 10vh, 140px)", overflow:"hidden" }}>
          {/* Background decorations */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(var(--border-subtle) 1px, transparent 1px)", backgroundSize:"40px 40px", opacity:0.5, pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:"-10%", right:"0%", width:"50vw", height:"50vw", background:"radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 60%)", filter:"blur(80px)", pointerEvents:"none", borderRadius:"50%" }} />
          <div style={{ position:"absolute", bottom:"-10%", left:"-10%", width:"50vw", height:"50vw", background:"radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 60%)", filter:"blur(80px)", pointerEvents:"none", borderRadius:"50%" }} />
          
          <div style={{ maxWidth:1200, margin:"0 auto", position:"relative", zIndex:1 }}>
            <div className="badge badge-teal animate-fade-up" style={{ marginBottom:32, display:"inline-flex", background:"rgba(20, 184, 166, 0.1)", border:"1px solid rgba(20, 184, 166, 0.2)" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent-teal)", display:"inline-block", marginRight:8 }} />
              AI-Powered Alzheimer's Early Detection
            </div>
            
            <h1 className="animate-fade-up delay-100" style={{ fontSize:"clamp(48px, 8vw, 96px)", fontWeight:300, lineHeight:1.05, letterSpacing:"-0.02em", maxWidth:900, marginBottom:32 }}>
              Detect Alzheimer's<br /><em className="serif" style={{ color:"var(--accent-teal)", fontStyle:"italic" }}>Earlier. More Accurately.</em>
            </h1>
            
            <p className="animate-fade-up delay-200" style={{ fontSize:"clamp(16px, 2vw, 20px)", color:"var(--text-secondary)", maxWidth:600, lineHeight:1.6, marginBottom:48 }}>
              A multimodal diagnostic platform combining brain MRI analysis, cognitive assessment, and demographic risk profiling — engineered for clinicians and researchers.
            </p>
            
            <div className="animate-fade-up delay-300" style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:96 }}>
              <button className="btn-primary" onClick={() => navigate("/register")} style={{ padding:"16px 48px", fontSize:16 }}>Begin Assessment →</button>
              <button className="btn-secondary" onClick={() => navigate("/login")} style={{ padding:"16px 32px", fontSize:16, border:"1px solid var(--border-subtle)" }}>Sign In</button>
            </div>

            {/* Stats */}
            <div className="animate-fade-up delay-300" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:24, maxWidth:1000 }}>
              {STATS.map((s,i) => (
                <div key={i} className="glass-panel" style={{ textAlign:"center", padding:"32px 24px", background:"rgba(255, 255, 255, 0.02)" }}>
                  <div className="serif" style={{ fontSize:"clamp(36px, 4vw, 48px)", color:"transparent", backgroundClip:"text", WebkitBackgroundClip:"text", backgroundImage:"linear-gradient(135deg, var(--text-primary), var(--accent-teal))", lineHeight:1, marginBottom:12 }}>{s.val}</div>
                  <div style={{ fontWeight:600, color:"var(--text-primary)", fontSize:14, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:12, color:"var(--text-tertiary)" }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding:"120px clamp(20px, 5vw, 64px)", position:"relative", zIndex:2 }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:80 }}>
              <div className="badge badge-purple animate-fade-up" style={{ marginBottom:20, display:"inline-flex", background:"rgba(139, 92, 246, 0.1)", border:"1px solid rgba(139, 92, 246, 0.2)", color:"var(--accent-purple)" }}>Platform Capabilities</div>
              <h2 className="animate-fade-up delay-100" style={{ fontSize:"clamp(36px, 5vw, 56px)", fontWeight:300, lineHeight:1.1, maxWidth:600, margin:"0 auto" }}>
                Six modules.<br /><em className="serif" style={{ color:"var(--accent-purple)", fontStyle:"italic" }}>One complete pipeline.</em>
              </h2>
            </div>
            
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:24 }}>
              {FEATURES.map((f,i) => (
                <div key={i} className="glass-panel animate-fade-up" style={{ padding:"32px", animationDelay:`${i*100}ms`, borderTopColor:`${f.c}44`, borderTopWidth:3 }}>
                  <div style={{ width:56, height:56, borderRadius:"var(--radius-sm)", background:`${f.c}1a`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:24, border:`1px solid ${f.c}33` }}>{f.icon}</div>
                  <div style={{ fontWeight:600, color:"var(--text-primary)", fontSize:18, marginBottom:8 }}>{f.title}</div>
                  <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.08em", color:f.c, textTransform:"uppercase", marginBottom:16 }}>{f.sub}</div>
                  <div style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.7 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STEPS */}
        <section style={{ padding:"120px clamp(20px, 5vw, 64px)", background:"var(--bg-panel)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:80 }}>
              <div className="badge badge-teal animate-fade-up" style={{ marginBottom:20, display:"inline-flex", background:"rgba(20, 184, 166, 0.1)", border:"1px solid rgba(20, 184, 166, 0.2)" }}>Assessment Flow</div>
              <h2 className="animate-fade-up delay-100" style={{ fontSize:"clamp(36px, 5vw, 56px)", fontWeight:300, lineHeight:1.1 }}>
                From signup to report<br /><em className="serif" style={{ color:"var(--accent-teal)", fontStyle:"italic" }}>in minutes</em>
              </h2>
            </div>
            
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:0 }}>
              {STEPS.map(([title, desc], i) => (
                <div key={i} className="animate-fade-up" style={{ animationDelay:`${i*100}ms`, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"32px 16px", position:"relative" }}>
                  {i < STEPS.length - 1 && <div style={{ position:"absolute", right:-10, top:48, color:"var(--border-subtle)", fontSize:24, zIndex:1 }} className="step-arrow">›</div>}
                  <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--bg-main)", border:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:28, color:"var(--accent-teal)", marginBottom:20 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontWeight:600, color:"var(--text-primary)", fontSize:15, marginBottom:8 }}>{title}</div>
                  <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding:"120px clamp(20px, 5vw, 64px)" }}>
          <div className="glass-panel animate-fade-up" style={{ maxWidth:800, margin:"0 auto", textAlign:"center", padding:"80px 40px", background:"linear-gradient(180deg, rgba(20, 184, 166, 0.05) 0%, rgba(4, 8, 16, 0) 100%)", borderColor:"rgba(20, 184, 166, 0.2)" }}>
            <h2 style={{ fontSize:"clamp(36px, 5vw, 56px)", fontWeight:300, marginBottom:24 }}>
              Ready to begin<br /><em className="serif" style={{ color:"var(--accent-teal)", fontStyle:"italic" }}>your assessment?</em>
            </h2>
            <p style={{ fontSize:18, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:48, maxWidth:500, margin:"0 auto 48px" }}>
              Register for free. Complete the 3-step assessment pipeline. Receive a detailed clinical AI report.
            </p>
            <button className="btn-primary" onClick={() => navigate("/register")} style={{ padding:"18px 64px", fontSize:18 }}>
              Start Free Assessment →
            </button>
            <p style={{ fontSize:12, color:"var(--text-tertiary)", marginTop:32 }}>
              ⚕️ For research &amp; clinical decision-support only. Not a replacement for physician diagnosis.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid var(--border-subtle)", padding:"40px clamp(20px, 5vw, 64px)", background:"var(--bg-panel)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"var(--accent-teal)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Instrument Serif',serif", fontSize:16, color:"var(--bg-main)" }}>N</div>
            <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:600, color:"var(--text-secondary)" }}>NeuroScan AI</span>
          </div>
          <p style={{ fontSize:13, color:"var(--text-tertiary)" }}>© 2026 NeuroScan AI · Research use only</p>
        </div>
      </footer>
    </div>
  );
}
