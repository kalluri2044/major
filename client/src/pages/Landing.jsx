import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GLOBAL_CSS, C } from "../components/DesignSystem";

const FEATURES = [
  { icon:"🧬", title:"CNN Ensemble", sub:"VGG16 + ResNet50", desc:"Dual-model architecture achieves 94.7% classification accuracy across four Alzheimer's severity stages.", c:C.teal },
  { icon:"📝", title:"25-Q Cognitive Test", sub:"MMSE · MoCA · SLUMS", desc:"Seven cognitive domains tested: memory, orientation, attention, language, visuospatial, executive, recall.", c:C.violet },
  { icon:"👤", title:"Evidence-Based Risk", sub:"Lancet Commission", desc:"Age, genetics, education, lifestyle, and 10 comorbidity factors scored against validated clinical weights.", c:C.blue },
  { icon:"⚡", title:"Fusion Engine", sub:"Weighted multimodal", desc:"Demographics (20%) + Cognitive (35%) + MRI (45%) → final AD risk score with confidence interval.", c:C.gold },
  { icon:"📈", title:"Progression Tracking", sub:"Longitudinal analysis", desc:"Session-over-session delta charts reveal disease trajectory. Catch cognitive decline before it worsens.", c:C.amber },
  { icon:"📄", title:"Clinical Reports", sub:"ReportLab PDF", desc:"Auto-generated 9-section clinical report with all data, stage-specific recommendations, and disclaimer.", c:C.coral },
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
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS + `
.nav-glass{background:rgba(4,12,26,0.88);backdrop-filter:blur(20px);border-bottom:1px solid ${C.border};position:sticky;top:0;z-index:100;}
.hero-title{font-family:'Fraunces',serif;font-size:clamp(46px,7vw,86px);font-weight:300;line-height:1.02;color:${C.white};}
.hero-em{font-style:italic;color:${C.teal};}
.hero-gradient{background:radial-gradient(ellipse 80% 50% at 50% -5%,rgba(0,212,170,0.11) 0%,transparent 70%),radial-gradient(ellipse 35% 35% at 85% 55%,rgba(96,165,250,0.06) 0%,transparent 60%);}
.stat-num{font-family:'Fraunces',serif;font-size:clamp(34px,5vw,54px);font-weight:400;line-height:1;}
.feature-card{background:rgba(7,18,32,0.55);border:1px solid ${C.border};border-radius:22px;padding:26px;transition:all .25s cubic-bezier(.22,.68,0,1);}
.feature-card:hover{border-color:rgba(120,160,255,0.18);transform:translateY(-5px);background:rgba(11,26,46,0.75);box-shadow:0 20px 60px rgba(0,0,0,.4);}
.step-box{width:46px;height:46px;border-radius:14px;border:1px solid ${C.borderHi};background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:20px;color:${C.teal};flex-shrink:0;}
.dot-grid{position:absolute;inset:0;background-image:radial-gradient(rgba(120,160,255,0.07) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;}
.section-heading{font-family:'Fraunces',serif;font-weight:400;color:${C.white};line-height:1.1;}
    `;
    document.head.appendChild(s);
    if (user) navigate(user.role === "patient" ? "/dashboard" : "/admin");
    return () => document.head.removeChild(s);
  }, [user, navigate]);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, overflowX:"hidden" }}>

      {/* NAV */}
      <nav className="nav-glass" style={{ padding:"0 clamp(20px,5vw,72px)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", height:66, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.teal},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:18, color:"#040C1A", fontWeight:600 }}>N</div>
            <span style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:C.white }}>NeuroScan <em style={{ color:C.teal }}>AI</em></span>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-ghost" onClick={() => navigate("/login")} style={{ padding:"9px 20px" }}>Sign In</button>
            <button className="btn-primary" onClick={() => navigate("/register")} style={{ padding:"9px 22px" }}>Get Started →</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-gradient" style={{ position:"relative", padding:"clamp(64px,10vh,120px) clamp(20px,5vw,72px) clamp(64px,8vh,100px)", overflow:"hidden" }}>
        <div className="dot-grid" />
        <div style={{ position:"absolute", top:"10%", right:"6%", width:380, height:380, borderRadius:"50%", background:`radial-gradient(circle,rgba(0,212,170,0.09) 0%,transparent 70%)`, filter:"blur(50px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"5%", left:"3%", width:240, height:240, borderRadius:"50%", background:`radial-gradient(circle,rgba(167,139,250,0.07) 0%,transparent 70%)`, filter:"blur(40px)", pointerEvents:"none" }} />
        
        <div style={{ maxWidth:1280, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div className="au d1 badge badge-teal" style={{ marginBottom:30, display:"inline-flex" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.teal, display:"inline-block" }} />
            AI-Powered Alzheimer's Early Detection
          </div>
          <h1 className="au d2 hero-title" style={{ maxWidth:860, marginBottom:30 }}>
            Detect Alzheimer's<br /><em className="hero-em">Earlier. More Accurately.</em>
          </h1>
          <p className="au d3" style={{ fontSize:17, color:C.textDim, maxWidth:540, lineHeight:1.8, marginBottom:48 }}>
            A multimodal diagnostic platform combining brain MRI analysis, cognitive assessment, and demographic risk profiling — engineered for clinicians and researchers.
          </p>
          <div className="au d4" style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:80 }}>
            <button className="btn-primary" onClick={() => navigate("/register")} style={{ padding:"15px 40px", fontSize:16 }}>Begin Assessment →</button>
            <button className="btn-ghost" onClick={() => navigate("/login")} style={{ padding:"15px 28px", fontSize:16 }}>Sign In</button>
          </div>

          {/* Stats */}
          <div className="au d5" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, maxWidth:860 }}>
            {STATS.map((s,i) => (
              <div key={i} className="stat-card" style={{ textAlign:"center", padding:"22px 12px" }}>
                <div className="stat-num grad-text">{s.val}</div>
                <div style={{ fontWeight:600, color:C.text, fontSize:13, marginTop:8 }}>{s.label}</div>
                <div style={{ fontSize:11, color:C.textFaint, marginTop:4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:"80px clamp(20px,5vw,72px)", position:"relative" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <span className="section-tag au">Platform Capabilities</span>
            <h2 className="section-heading au d1" style={{ fontSize:"clamp(30px,4vw,46px)", maxWidth:520, margin:"0 auto" }}>
              Six modules.<br /><em className="hero-em">One complete pipeline.</em>
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:20 }}>
            {FEATURES.map((f,i) => (
              <div key={i} className={`feature-card au d${i+1}`} style={{ borderTop:`2px solid ${f.c}28` }}>
                <div style={{ width:50, height:50, borderRadius:15, background:`${f.c}14`, border:`1px solid ${f.c}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:20 }}>{f.icon}</div>
                <div style={{ fontWeight:700, color:C.white, fontSize:16, marginBottom:5 }}>{f.title}</div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:".07em", color:f.c, textTransform:"uppercase", marginBottom:14 }}>{f.sub}</div>
                <div style={{ fontSize:13, color:C.textDim, lineHeight:1.72 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section style={{ padding:"80px clamp(20px,5vw,72px)", borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <span className="section-tag au">Assessment Flow</span>
            <h2 className="section-heading au d1" style={{ fontSize:"clamp(30px,4vw,44px)" }}>
              From signup to report<br /><em className="hero-em">in minutes</em>
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:0 }}>
            {STEPS.map(([title, desc], i) => (
              <div key={i} className={`au d${i+1}`} style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"24px 12px", position:"relative" }}>
                {i < 5 && <div style={{ position:"absolute", right:0, top:38, color:C.textFaint, fontSize:18, zIndex:1 }}>›</div>}
                <div className="step-box">{i + 1}</div>
                <div style={{ fontWeight:700, color:C.white, marginTop:14, marginBottom:6, fontSize:13 }}>{title}</div>
                <div style={{ fontSize:12, color:C.textDim, lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"80px clamp(20px,5vw,72px)", borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:680, margin:"0 auto", textAlign:"center" }}>
          <h2 className="section-heading au" style={{ fontSize:"clamp(30px,4vw,50px)", marginBottom:20 }}>
            Ready to begin<br /><em className="hero-em">your assessment?</em>
          </h2>
          <p className="au d1" style={{ fontSize:16, color:C.textDim, lineHeight:1.8, marginBottom:40 }}>
            Register for free. Complete the 3-step assessment. Receive a detailed clinical report.
          </p>
          <button className="btn-primary au d2" onClick={() => navigate("/register")} style={{ padding:"16px 52px", fontSize:17 }}>
            Start Free Assessment →
          </button>
          <p className="au d3" style={{ fontSize:11, color:C.textFaint, marginTop:24, lineHeight:1.6 }}>
            ⚕️ For research &amp; clinical decision-support only. Not a replacement for physician diagnosis.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:"28px clamp(20px,5vw,72px)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${C.teal},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:14, color:"#040C1A" }}>N</div>
            <span style={{ fontFamily:"'Fraunces',serif", fontSize:15, color:C.textDim }}>NeuroScan AI</span>
          </div>
          <p style={{ fontSize:12, color:C.textFaint }}>© 2025 NeuroScan AI · Research use only</p>
        </div>
      </footer>
    </div>
  );
}
