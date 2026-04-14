import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const T = {
  navy:"#0a1628", navyMid:"#0f2040", navyLt:"#162035",
  teal:"#00d4aa", tealDim:"rgba(0,212,170,0.12)",
  cream:"#f0ede8", white:"#ffffff",
  slate:"rgba(255,255,255,0.45)", slateD:"rgba(255,255,255,0.2)",
  border:"rgba(255,255,255,0.08)", borderHi:"rgba(255,255,255,0.14)",
};

const RISK_LEVELS = [
  { max:25,  label:"Low Risk",       color:"#00d4aa", bg:"rgba(0,212,170,0.1)"  },
  { max:50,  label:"Moderate Risk",  color:"#ffb347", bg:"rgba(255,179,71,0.1)" },
  { max:75,  label:"High Risk",      color:"#ff8c42", bg:"rgba(255,140,66,0.1)" },
  { max:101, label:"Very High Risk", color:"#ff6b6b", bg:"rgba(255,107,107,0.1)"},
];
const getRisk = s => RISK_LEVELS.find(r => s < r.max) || RISK_LEVELS[3];

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

function RiskArc({ score, color }) {
  const [anim, setAnim] = useState(0);
  const R = 58, C = 2 * Math.PI * R;
  useEffect(() => {
    let v = anim;
    const go = () => { v += (score - v) * 0.1; setAnim(Math.round(v*10)/10); if(Math.abs(score-v)>0.3) requestAnimationFrame(go); };
    requestAnimationFrame(go);
  }, [score]);
  return (
    <div style={{position:"relative",width:150,height:150,margin:"0 auto 12px"}}>
      <svg width="150" height="150" style={{transform:"rotate(-90deg)"}}>
        <circle cx="75" cy="75" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11"/>
        <circle cx="75" cy="75" r={R} fill="none" stroke={color} strokeWidth="11"
          strokeDasharray={C} strokeDashoffset={C-(anim/100)*C}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 0.05s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"38px",color,lineHeight:1}}>{Math.round(anim)}</div>
        <div style={{fontSize:"11px",color:T.slateD,marginTop:2}}>/100</div>
      </div>
    </div>
  );
}

function Chip({ opt, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex:1, padding:"12px 8px", borderRadius:"12px", textAlign:"center", cursor:"pointer",
      border:`1px solid ${active?"rgba(0,212,170,0.45)":T.border}`,
      background:active?T.tealDim:"rgba(255,255,255,0.02)",
      transition:"all 0.18s", userSelect:"none",
    }}>
      <div style={{fontSize:"20px",marginBottom:4}}>{opt.icon}</div>
      <div style={{fontSize:"12px",fontWeight:600,color:active?T.teal:"rgba(255,255,255,0.65)",marginBottom:2}}>{opt.l}</div>
      <div style={{fontSize:"10px",color:T.slateD}}>{opt.sub}</div>
    </div>
  );
}

function Toggle({ icon, label, sub, on, onClick, danger }) {
  const ac = danger?"#ff6b6b":T.teal;
  return (
    <div onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:12,
      border:`1px solid ${on?`${ac}44`:T.border}`,
      background:on?`${ac}09`:"rgba(255,255,255,0.02)",
      cursor:"pointer",transition:"all 0.18s",userSelect:"none",
    }}>
      <span style={{fontSize:19,flexShrink:0}}>{icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:500,color:on?"#fff":"rgba(255,255,255,0.65)"}}>{label}</div>
        <div style={{fontSize:10,color:T.slateD,marginTop:2}}>{sub}</div>
      </div>
      <div style={{width:38,height:21,borderRadius:11,background:on?ac:"rgba(255,255,255,0.1)",position:"relative",flexShrink:0,transition:"background 0.18s"}}>
        <div style={{position:"absolute",top:3,left:on?19:3,width:15,height:15,borderRadius:"50%",background:"#fff",transition:"left 0.18s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#0a1628;color:#fff;-webkit-font-smoothing:antialiased;}
input,select{font-family:'DM Sans',sans-serif;}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.au{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.1) both}
.ai{animation:fadeIn .35s ease both}
.d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:99px}
`;

export default function Demographics() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [sessionId, setSessionId] = useState(params.get("session_id") || null);

  // Auto-start or resume a session so demographics links into the flow
  useEffect(() => {
    if (sessionId) return;
    api.post("/user/sessions")
      .then(({ data }) => {
        const sid = data.session?.id;
        if (sid) {
          setSessionId(String(sid));
          window.history.replaceState(null, "", `/demographics?session_id=${sid}`);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line
  const [step,setStep] = useState(0);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [risk,setRisk] = useState(null);
  const [form,setForm] = useState({
    age:"",gender:"",education_level:"undergraduate",
    family_history:false,hypertension:false,diabetes:false,
    depression_history:false,head_injury:false,hearing_loss:false,
    smoking:false,physical_activity:"moderate",sleep_quality:"average",social_isolation:false,
  });

  useEffect(()=>{
    const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);
    api.get("/demographics").then(({data})=>{if(data.demographics){setForm(f=>({...f,...data.demographics}));setRisk(data.risk_profile);}}).catch(()=>{});
    return()=>document.head.removeChild(s);
  },[]);

  let pt=null;
  const preview = useCallback((data)=>{
    clearTimeout(pt);
    pt=setTimeout(async()=>{
      if(!data.age||!data.gender)return;
      try{const r=await api.post("/demographics/risk-preview",{...data,age:parseInt(data.age)});setRisk(r.data.risk_profile);}catch{}
    },500);
  },[]);

  const upd=(k,v)=>setForm(f=>{const n={...f,[k]:v};preview(n);return n;});
  const tog=(k)=>setForm(f=>{const n={...f,[k]:!f[k]};preview(n);return n;});

  const submit=async()=>{
    setSaving(true);setError("");
    try{await api.post("/demographics/save",{...form,age:parseInt(form.age)});navigate(sessionId ? `/cognitive-test?session_id=${sessionId}` : "/cognitive-test");}
    catch(e){setError(e.response?.data?.error||"Failed to save.");}
    finally{setSaving(false);}
  };

  const ri=risk?getRisk(risk.risk_score):null;

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.navy}}>

      {/* Sidebar */}
      <div style={{width:220,flexShrink:0,background:"rgba(0,0,0,0.3)",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",padding:"28px 0",position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"0 22px 24px",borderBottom:`1px solid ${T.border}`,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:T.teal,color:T.navy,fontFamily:"'Instrument Serif',serif",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>N</div>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>NeuroScan</div>
              <div style={{fontSize:10,color:T.slateD}}>AI Assessment</div>
            </div>
          </div>
        </div>
        {[["👤","Demographics","/demographics","demographics"],["🧠","Cognitive Test","/cognitive-test","cognitive"],["🔬","MRI Upload","/mri-upload","mri"],["📊","Results","/dashboard","results"]].map(([ic,lb,hr,id],i)=>(
          <a key={id} href={hr} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",margin:"0 8px",borderRadius:10,background:id==="demographics"?"rgba(0,212,170,0.1)":"transparent",textDecoration:"none",marginBottom:2}}>
            <div style={{width:28,height:28,borderRadius:8,background:id==="demographics"?T.teal:"rgba(255,255,255,0.06)",color:id==="demographics"?T.navy:"rgba(255,255,255,0.35)",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{i<0?"✓":i+1}</div>
            <span style={{fontSize:13,fontWeight:500,color:id==="demographics"?T.teal:"rgba(255,255,255,0.4)"}}>{lb}</span>
            {id==="demographics"&&<div style={{width:5,height:5,borderRadius:"50%",background:T.teal,marginLeft:"auto"}}/>}
          </a>
        ))}
        <div style={{marginTop:"auto",padding:"18px 22px 0",borderTop:`1px solid ${T.border}`}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",lineHeight:1.5}}>Clinical decision support only — not a replacement for physician diagnosis.</div>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{padding:"36px 40px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div className="au">
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",color:T.teal,marginBottom:6,textTransform:"uppercase"}}>Step {step+1} of 3</div>
            <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:38,color:"#fff",fontWeight:400,lineHeight:1.1,marginBottom:8}}>
              Patient<br/><em style={{color:T.teal}}>Demographics</em>
            </h1>
            <p style={{fontSize:13,color:T.slate,maxWidth:360,lineHeight:1.6}}>Demographics contribute <strong style={{color:"#fff"}}>20%</strong> of the final AD risk score alongside cognitive (35%) and MRI (45%) data.</p>
          </div>

          {/* Step pills */}
          <div style={{display:"flex",gap:8,marginTop:8}} className="ai">
            {STEPS.map((s,i)=>(
              <div key={s} onClick={()=>i<=step&&setStep(i)} style={{
                padding:"8px 14px",borderRadius:99,cursor:i<=step?"pointer":"default",
                background:i===step?T.teal:i<step?"rgba(0,212,170,0.12)":"rgba(255,255,255,0.05)",
                color:i===step?T.navy:i<step?T.teal:"rgba(255,255,255,0.3)",
                border:`1px solid ${i===step?T.teal:i<step?"rgba(0,212,170,0.3)":T.border}`,
                fontSize:12,fontWeight:600,transition:"all 0.2s",
                display:"flex",alignItems:"center",gap:5,
              }}>
                <span>{i<step?"✓":i===0?"👤":i===1?"🏥":"🌿"}</span>{s}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,display:"flex",gap:20,padding:"24px 40px 40px"}}>

          {/* Form */}
          <div style={{flex:1}}>

            {/* STEP 0 */}
            {step===0&&(
              <div className="au">
                <Card>
                  <SecHead icon="👤" title="Personal Information" sub="Used to calibrate age and gender-specific baseline risk models"/>
                  <div style={{display:"flex",gap:14,marginBottom:24}}>
                    <div style={{flex:1}}>
                      <FL>Age</FL>
                      <input type="number" min="18" max="120" placeholder="e.g. 65" value={form.age} onChange={e=>upd("age",e.target.value)} style={IS}/>
                      <FH>Strongest single predictor of Alzheimer's risk</FH>
                    </div>
                    <div style={{flex:1}}>
                      <FL>Gender</FL>
                      <select value={form.gender} onChange={e=>upd("gender",e.target.value)} style={IS}>
                        <option value="">Select gender…</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other / Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <FL>Education Level</FL>
                  <FH>Higher education builds cognitive reserve — a buffer against AD progression</FH>
                  <div style={{display:"flex",gap:10,marginTop:10}}>
                    {EDU.map(o=><Chip key={o.v} opt={o} active={form.education_level===o.v} onClick={()=>upd("education_level",o.v)}/>)}
                  </div>
                </Card>
              </div>
            )}

            {/* STEP 1 */}
            {step===1&&(
              <div className="au">
                <Card>
                  <SecHead icon="🏥" title="Medical History" sub="All data is encrypted and used solely for risk scoring — never shared"/>
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    <Toggle icon="👪" label="Family History of Alzheimer's" sub="First-degree relative (parent/sibling) with AD — doubles baseline risk" on={form.family_history} onClick={()=>tog("family_history")} danger/>
                    <Toggle icon="❤️" label="Hypertension / High Blood Pressure" sub="Midlife hypertension strongly linked to dementia onset" on={form.hypertension} onClick={()=>tog("hypertension")} danger/>
                    <Toggle icon="🩸" label="Type 2 Diabetes" sub="Insulin resistance impairs brain glucose metabolism" on={form.diabetes} onClick={()=>tog("diabetes")} danger/>
                    <Toggle icon="💭" label="History of Depression" sub="Associated with 2× dementia risk in longitudinal studies" on={form.depression_history} onClick={()=>tog("depression_history")} danger/>
                    <Toggle icon="⚡" label="Traumatic Brain Injury" sub="Any significant head injury — increases tau protein accumulation" on={form.head_injury} onClick={()=>tog("head_injury")} danger/>
                    <Toggle icon="👂" label="Untreated Hearing Loss" sub="Largest single modifiable midlife risk factor (Lancet 2020)" on={form.hearing_loss} onClick={()=>tog("hearing_loss")} danger/>
                  </div>
                </Card>
              </div>
            )}

            {/* STEP 2 */}
            {step===2&&(
              <div className="au">
                <Card>
                  <SecHead icon="🌿" title="Lifestyle Factors" sub="Modifiable factors account for up to 40% of dementia risk globally"/>
                  <FL>Physical Activity</FL>
                  <FH>Regular aerobic exercise reduces dementia risk by up to 35% — even brisk walking counts</FH>
                  <div style={{display:"flex",gap:10,marginTop:10,marginBottom:24}}>
                    {ACT.map(o=><Chip key={o.v} opt={o} active={form.physical_activity===o.v} onClick={()=>upd("physical_activity",o.v)}/>)}
                  </div>
                  <FL>Sleep Quality</FL>
                  <FH>Deep sleep clears amyloid-beta proteins from the brain — quality matters as much as duration</FH>
                  <div style={{display:"flex",gap:10,marginTop:10,marginBottom:24}}>
                    {SLP.map(o=><Chip key={o.v} opt={o} active={form.sleep_quality===o.v} onClick={()=>upd("sleep_quality",o.v)}/>)}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    <Toggle icon="🚬" label="Active Smoker" sub="Smoking accelerates vascular and cognitive decline significantly" on={form.smoking} onClick={()=>tog("smoking")} danger/>
                    <Toggle icon="🏠" label="Social Isolation" sub="Limited social engagement linked to accelerated cognitive decline" on={form.social_isolation} onClick={()=>tog("social_isolation")} danger/>
                  </div>
                </Card>
              </div>
            )}

            {error&&<div style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:10,padding:"12px 16px",color:"#ff6b6b",fontSize:13,marginTop:12}}>{error}</div>}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20}}>
              {step>0?<button onClick={()=>setStep(s=>s-1)} style={BSec}>← Back</button>:<div/>}
              {step<2
                ?<button onClick={()=>setStep(s=>s+1)} style={{...BPri,opacity:(form.age>=18&&form.gender)?1:0.35}} disabled={!(form.age>=18&&form.gender)}>Continue: {STEPS[step+1]} →</button>
                :<button onClick={submit} style={{...BPri,opacity:saving?0.7:1}} disabled={saving}>{saving?"Saving…":"Save & Start Cognitive Test →"}</button>
              }
            </div>
          </div>

          {/* Sidebar */}
          <div style={{width:270,flexShrink:0}}>
            <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:20,padding:22,position:"sticky",top:24}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",color:T.slateD,textTransform:"uppercase",marginBottom:20}}>Live Risk Preview</div>
              {risk?(
                <>
                  <RiskArc score={risk.risk_score} color={ri.color}/>
                  <div style={{textAlign:"center",marginBottom:18}}>
                    <span style={{display:"inline-block",padding:"5px 14px",borderRadius:99,background:ri.bg,border:`1px solid ${ri.color}44`,color:ri.color,fontSize:12,fontWeight:600}}>{ri.label}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:11,marginBottom:18}}>
                    {[["Age",risk.age_contribution,"#7c9fd4"],["Education",risk.education_contribution,"#b48cde"],["Lifestyle",risk.lifestyle_contribution,ri.color]].map(([l,v,c])=>(
                      <div key={l}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.slateD,marginBottom:5}}>
                          <span>{l}</span><span style={{color:"rgba(255,255,255,0.65)",fontWeight:500}}>{v.toFixed(1)}%</span>
                        </div>
                        <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${v}%`,background:c,borderRadius:99,transition:"width 0.5s ease"}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                  {risk.risk_factors?.length>0&&(
                    <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14,marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:600,color:"#ff6b6b",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>⚠ Risk Factors</div>
                      {risk.risk_factors.slice(0,3).map((f,i)=>(
                        <div key={i} style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginBottom:5,paddingLeft:10,borderLeft:"2px solid rgba(255,107,107,0.35)",lineHeight:1.4}}>{f.split("(")[0].trim()}</div>
                      ))}
                    </div>
                  )}
                  {risk.protective_factors?.length>0&&(
                    <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.teal,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>✓ Protective</div>
                      {risk.protective_factors.slice(0,2).map((f,i)=>(
                        <div key={i} style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginBottom:5,paddingLeft:10,borderLeft:"2px solid rgba(0,212,170,0.35)",lineHeight:1.4}}>{f}</div>
                      ))}
                    </div>
                  )}
                </>
              ):(
                <div style={{textAlign:"center",padding:"30px 0"}}>
                  <div style={{fontSize:36,opacity:0.15,marginBottom:12}}>📊</div>
                  <div style={{fontSize:12,color:T.slateD,lineHeight:1.6}}>Enter age and gender to see your live risk preview</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({children}){return <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.08)`,borderRadius:18,padding:26,marginBottom:16}}>{children}</div>;}
function SecHead({icon,title,sub}){return <div style={{marginBottom:22}}><div style={{display:"flex",alignItems:"center",gap:9,marginBottom:5}}><span style={{fontSize:18}}>{icon}</span><h2 style={{fontSize:17,fontWeight:600,color:"#fff"}}>{title}</h2></div><p style={{fontSize:12,color:T.slate,paddingLeft:27}}>{sub}</p></div>;}
function FL({children}){return <div style={{fontSize:11,fontWeight:600,color:T.slateD,marginBottom:7,letterSpacing:"0.05em",textTransform:"uppercase"}}>{children}</div>;}
function FH({children}){return <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginBottom:6,lineHeight:1.5}}>{children}</div>;}
const IS={display:"block",width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,fontSize:14,color:"#fff",outline:"none",marginBottom:8};
const BPri={padding:"12px 26px",background:T.teal,color:T.navy,border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"};
const BSec={padding:"11px 22px",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.55)",border:`1px solid ${T.border}`,borderRadius:10,fontSize:14,cursor:"pointer"};
