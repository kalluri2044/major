import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import AssessmentSidebar from "../components/AssessmentSidebar";

const EDU = [
  {v:"postgraduate",l:"Postgrad",sub:"Masters / PhD",icon:"🎓"},
  {v:"undergraduate",l:"Degree",sub:"Bachelor's",icon:"📚"},
  {v:"school",l:"School",sub:"Secondary",icon:"🏫"},
  {v:"none",l:"None",sub:"Self-taught",icon:"📖"},
];
const ACT = [
  {v:"high",l:"Active",sub:"5+ days/wk",icon:"🏃"},
  {v:"moderate",l:"Moderate",sub:"2–4 days/wk",icon:"🚶"},
  {v:"low",l:"Sedentary",sub:"Rarely",icon:"🪑"},
];
const SLP = [
  {v:"good",l:"Good",sub:"7–9 hrs",icon:"😴"},
  {v:"average",l:"Average",sub:"Some issues",icon:"🌙"},
  {v:"poor",l:"Poor",sub:"Chronic",icon:"😓"},
];
const STEPS = ["Personal Info","Medical History","Lifestyle"];

function Chip({ opt, active, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor:"pointer", transition:"all 0.18s" }}
      className={`glass-panel ${active ? 'active-chip' : ''}`}
    >
      <div style={{ padding:"16px 12px", textAlign:"center", background: active ? 'var(--accent-teal-dim)' : 'transparent', border: active ? '1px solid var(--border-focus)' : '1px solid transparent', borderRadius:'inherit' }}>
        <div style={{fontSize:"24px",marginBottom:6}}>{opt.icon}</div>
        <div style={{fontSize:"13px",fontWeight:600,color:active?"var(--accent-teal)":"var(--text-secondary)",marginBottom:2}}>{opt.l}</div>
        <div style={{fontSize:"11px",color:"var(--text-tertiary)"}}>{opt.sub}</div>
      </div>
    </div>
  );
}

function Toggle({ icon, label, sub, on, onClick, danger }) {
  const ac = danger ? "var(--accent-red)" : "var(--accent-teal)";
  const bg = danger ? "rgba(239, 68, 68, 0.08)" : "var(--accent-teal-dim)";
  return (
    <div onClick={onClick} className="glass-panel" style={{ cursor:"pointer", userSelect:"none", transition:"all 0.18s", background: on ? bg : "var(--bg-panel)", borderColor: on ? ac : "var(--border-subtle)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px" }}>
        <span style={{fontSize:22, flexShrink:0}}>{icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14, fontWeight:500, color:on?"var(--text-primary)":"var(--text-secondary)"}}>{label}</div>
          <div style={{fontSize:12, color:"var(--text-tertiary)", marginTop:2}}>{sub}</div>
        </div>
        <div style={{width:42, height:24, borderRadius:12, background:on?ac:"rgba(255,255,255,0.1)", position:"relative", flexShrink:0, transition:"background 0.2s"}}>
          <div style={{position:"absolute", top:4, left:on?22:4, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 2px 4px rgba(0,0,0,0.2)"}}/>
        </div>
      </div>
    </div>
  );
}

export default function Demographics() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [sessionId, setSessionId] = useState(params.get("session_id") || null);

  useEffect(() => {
    if (sessionId) return;
    // If no session ID in URL, we create a fresh one
    api.post("/user/sessions", { force: true })
      .then(({ data }) => {
        const sid = data.session?.id;
        if (sid) {
          setSessionId(String(sid));
          window.history.replaceState(null, "", `/demographics?session_id=${sid}`);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    age:"",gender:"",education_level:"undergraduate",
    family_history:false,hypertension:false,diabetes:false,
    depression_history:false,head_injury:false,hearing_loss:false,
    smoking:false,physical_activity:"moderate",sleep_quality:"average",social_isolation:false,
  });

  useEffect(() => {
    api.get("/demographics").then(({data}) => {
      if(data.demographics) setForm(f => ({...f,...data.demographics}));
    }).catch(()=>{});
  }, []);

  const upd = (k,v) => setForm(f => ({ ...f, [k]: v }));
  const tog = (k) => setForm(f => ({ ...f, [k]: !f[k] }));

  const submit = async () => {
    setSaving(true); setError("");
    try {
      await api.post("/demographics/save", { ...form, age: parseInt(form.age) });
      navigate(sessionId ? `/cognitive-test?session_id=${sessionId}` : "/cognitive-test");
    } catch(e) {
      setError(e.response?.data?.error || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <AssessmentSidebar activeStep="demographics" sessionId={sessionId} />


      {/* Main Content */}
      <div className="main-content">
        <div style={{ padding:"40px 48px", maxWidth:1100, margin:"0 auto", width:"100%" }}>
          
          {/* Header */}
          <div className="animate-fade-up" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:40 }}>
            <div>
              <div className="badge badge-teal" style={{ marginBottom:12 }}>Step {step+1} of 3</div>
              <h1 style={{ fontSize:42, marginBottom:8 }}>Patient <span className="serif" style={{ color:"var(--text-secondary)", fontStyle:"italic" }}>Demographics</span></h1>
              <p style={{ color:"var(--text-secondary)", fontSize:15, maxWidth:450, lineHeight:1.6 }}>
                Comprehensive background information helps the ensemble models compute a precise and personalized cognitive baseline.
              </p>
            </div>
            
            <div style={{ display:"flex", gap:8 }}>
              {STEPS.map((s, i) => (
                <div key={s} 
                  onClick={() => i <= step && setStep(i)} 
                  style={{
                    padding:"10px 16px", borderRadius:99, cursor:i<=step?"pointer":"default",
                    background: i===step ? "var(--accent-teal)" : i<step ? "var(--bg-panel-hover)" : "var(--bg-panel)",
                    color: i===step ? "var(--bg-main)" : i<step ? "var(--accent-teal)" : "var(--text-tertiary)",
                    border: `1px solid ${i===step ? "var(--border-focus)" : "var(--border-subtle)"}`,
                    fontSize:13, fontWeight:600, transition:"all 0.2s ease"
                  }}>
                  {i<step ? "✓ " : ""}{s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:32 }}>
            <div style={{ flex:1 }}>
              
              {step === 0 && (
                <div className="glass-panel animate-fade-up" style={{ padding: "32px" }}>
                  <h3 style={{ fontSize:20, marginBottom:8 }}>Personal Information</h3>
                  <p style={{ color:"var(--text-tertiary)", fontSize:13, marginBottom:28 }}>Basic physiological data for age and gender calibration.</p>
                  
                  <div style={{ display:"flex", gap:20, marginBottom:28 }}>
                    <div style={{ flex:1 }}>
                      <label style={{ display:"block", fontSize:13, color:"var(--text-secondary)", marginBottom:8, fontWeight:500 }}>Age</label>
                      <input type="number" min="18" max="120" placeholder="e.g. 65" value={form.age} onChange={e=>upd("age", e.target.value)} className="input-field"/>
                    </div>
                    <div style={{ flex:1 }}>
                      <label style={{ display:"block", fontSize:13, color:"var(--text-secondary)", marginBottom:8, fontWeight:500 }}>Gender</label>
                      <select value={form.gender} onChange={e=>upd("gender", e.target.value)} className="input-field">
                        <option value="">Select gender…</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <label style={{ display:"block", fontSize:13, color:"var(--text-secondary)", marginBottom:12, fontWeight:500 }}>Highest Education Level</label>
                  <div style={{ display:"flex", gap:12 }}>
                    {EDU.map(o => <Chip key={o.v} opt={o} active={form.education_level === o.v} onClick={() => upd("education_level", o.v)}/>)}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="glass-panel animate-fade-up" style={{ padding: "32px" }}>
                  <h3 style={{ fontSize:20, marginBottom:8 }}>Medical History</h3>
                  <p style={{ color:"var(--text-tertiary)", fontSize:13, marginBottom:28 }}>All data is encrypted and used securely for multi-modal risk scoring.</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <Toggle icon="👪" label="Family History of Alzheimer's" sub="First-degree relative (parent or sibling)" on={form.family_history} onClick={()=>tog("family_history")} danger/>
                    <Toggle icon="❤️" label="Hypertension" sub="High blood pressure history" on={form.hypertension} onClick={()=>tog("hypertension")} danger/>
                    <Toggle icon="🩸" label="Type 2 Diabetes" sub="Insulin resistance impacts cognitive reserve" on={form.diabetes} onClick={()=>tog("diabetes")} danger/>
                    <Toggle icon="💭" label="History of Depression" sub="Can accelerate cognitive decline" on={form.depression_history} onClick={()=>tog("depression_history")} danger/>
                    <Toggle icon="⚡" label="Traumatic Brain Injury" sub="Any significant head trauma" on={form.head_injury} onClick={()=>tog("head_injury")} danger/>
                    <Toggle icon="👂" label="Untreated Hearing Loss" sub="A major modifiable risk factor" on={form.hearing_loss} onClick={()=>tog("hearing_loss")} danger/>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="glass-panel animate-fade-up" style={{ padding: "32px" }}>
                  <h3 style={{ fontSize:20, marginBottom:8 }}>Lifestyle Factors</h3>
                  <p style={{ color:"var(--text-tertiary)", fontSize:13, marginBottom:28 }}>Modifiable behaviors that influence long-term cognitive health.</p>
                  
                  <label style={{ display:"block", fontSize:13, color:"var(--text-secondary)", marginBottom:12, fontWeight:500 }}>Physical Activity</label>
                  <div style={{ display:"flex", gap:12, marginBottom:28 }}>
                    {ACT.map(o=><Chip key={o.v} opt={o} active={form.physical_activity===o.v} onClick={()=>upd("physical_activity",o.v)}/>)}
                  </div>

                  <label style={{ display:"block", fontSize:13, color:"var(--text-secondary)", marginBottom:12, fontWeight:500 }}>Sleep Quality</label>
                  <div style={{ display:"flex", gap:12, marginBottom:28 }}>
                    {SLP.map(o=><Chip key={o.v} opt={o} active={form.sleep_quality===o.v} onClick={()=>upd("sleep_quality",o.v)}/>)}
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <Toggle icon="🚬" label="Active Smoker" sub="Tobacco use limits vascular health" on={form.smoking} onClick={()=>tog("smoking")} danger/>
                    <Toggle icon="🏠" label="Social Isolation" sub="Limited engagement with others" on={form.social_isolation} onClick={()=>tog("social_isolation")} danger/>
                  </div>
                </div>
              )}

              {error && <div className="glass-panel" style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", color: "var(--accent-red)", padding: "16px", marginTop: "24px", borderRadius: "var(--radius-md)" }}>{error}</div>}

              <div style={{ display:"flex", justifyContent:"space-between", marginTop:28 }}>
                {step > 0 ? <button className="btn-secondary" onClick={()=>setStep(s=>s-1)}>← Back</button> : <div/>}
                {step < 2
                  ? <button className="btn-primary" onClick={()=>setStep(s=>s+1)} disabled={!(form.age >= 18 && form.gender)}>Continue to {STEPS[step+1]} →</button>
                  : <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save & Proceed to Cognitive Test →"}</button>
                }
              </div>
            </div>

            {/* Informational Sidebar */}
            <div style={{ width: 320, flexShrink:0 }}>
              <div className="glass-panel animate-fade-up delay-100" style={{ padding: "28px", position: "sticky", top: 40 }}>
                <div className="badge badge-blue" style={{ marginBottom:16 }}>Assessment Info</div>
                <h4 style={{ fontSize:18, marginBottom:12 }}>Why we need this data</h4>
                <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:20 }}>
                  NeuroScan's ensemble algorithms require an accurate demographic baseline to contextually analyze the MRI and Cognitive components later.
                </p>
                <div style={{ padding: "16px", background: "rgba(59, 130, 246, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
                  <strong style={{ display:"block", fontSize:13, color:"var(--text-primary)", marginBottom:4 }}>100% Secure</strong>
                  <span style={{ fontSize:12, color:"var(--accent-blue)", lineHeight:1.5, display:"block" }}>
                    Your personal information is securely encrypted. We do not share health data with third parties.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
