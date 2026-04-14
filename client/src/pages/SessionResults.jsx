import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const STAGE_META = {
  "Non-Demented / Healthy":       { color:"var(--accent-teal)",   bg:"rgba(20, 184, 166, 0.1)",  grade:"A", emoji:"✅" },
  "Very Mild Demented (MCI)":     { color:"var(--accent-amber)",  bg:"rgba(245, 158, 11, 0.1)",  grade:"B", emoji:"⚠️" },
  "Mild Alzheimer's Disease":     { color:"#fb923c",              bg:"rgba(251, 146, 60, 0.1)",  grade:"C", emoji:"🔶" },
  "Moderate Alzheimer's Disease": { color:"var(--accent-red)",    bg:"rgba(239, 68, 68, 0.1)",   grade:"D", emoji:"🔴" },
};
const getStage = (l) => STAGE_META[l] || { color:"var(--accent-teal)", bg:"var(--bg-panel)", grade:"?", emoji:"📊" };

function Arc({ score, color, size=180 }) {
  const [v,setV]=useState(0);
  const R=size*.38,C=2*Math.PI*R;
  useEffect(()=>{
    let cur=0;
    const go=()=>{cur+=(score-cur)*.1;setV(Math.round(cur*10)/10);if(Math.abs(score-cur)>.2)requestAnimationFrame(go);};
    const t = setTimeout(()=>requestAnimationFrame(go),400);
    return () => clearTimeout(t);
  },[score]);
  return (
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={C} strokeDashoffset={C-(v/100)*C} strokeLinecap="round" style={{transition:"stroke-dashoffset .05s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontFamily:"'Instrument Serif',serif",fontSize:size*.24,color,lineHeight:1,animation:"fadeUp .5s ease .5s both"}}>{Math.round(v)}</div>
        <div style={{fontSize:11,color:"var(--text-tertiary)",marginTop:2}}>/100</div>
      </div>
    </div>
  );
}

function Card({children,style:s,className:c=""}){return <div className={`glass-panel ${c}`} style={{padding:"24px",...s}}>{children}</div>;}
function SH({children,sub}){return <div style={{marginBottom:16}}><div style={{fontSize:15,fontWeight:600,color:"var(--text-primary)",marginBottom:sub?3:0}}>{children}</div>{sub&&<div style={{fontSize:13,color:"var(--text-secondary)"}}>{sub}</div>}</div>;}

export default function SessionResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading,setLoading]= useState(true);
  const [genRpt, setGenRpt] = useState(false);
  const [tab, setTab]       = useState("overview");

  useEffect(()=>{
    api.get(`/results/${sessionId}`).then(({data})=>setData(data)).catch(()=>navigate("/dashboard")).finally(()=>setLoading(false));
  },[sessionId, navigate]);

  if(loading) return <div className="page-container" style={{alignItems:"center",justifyContent:"center",flexDirection:"column"}}><div className="spinner" style={{marginBottom:16}}/><div style={{fontSize:14,color:"var(--text-secondary)"}}>Compiling results…</div></div>;
  if(!data) return null;

  const sess=data.session, sm=getStage(sess.stage_label);
  const cog=data.cognitive, mri=data.mri, prog=data.progression;
  const rec=data.recommendation||{}, demo=data.demographics;
  const adPct=sess.final_ad_percentage||0;
  const catColors={Medical:"var(--accent-red)",Safety:"#fb923c",Lifestyle:"var(--accent-teal)",Cognitive:"var(--accent-purple)",Social:"var(--accent-amber)"};

  const generateReport = async () => {
    setGenRpt(true);
    try {
      const res=await api.get(`/report/download/${sessionId}`,{responseType:"blob"});
      const url=URL.createObjectURL(new Blob([res.data],{type:"application/pdf"}));
      const a=document.createElement("a");a.href=url;a.download=`neuroscan_report_session_${sessionId}.pdf`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    } catch {}
    finally{setGenRpt(false);}
  };

  const TABS=[{id:"overview",label:"Overview"},{id:"modalities",label:"Modalities"},{id:"recommendations",label:"Recommendations"},{id:"progression",label:"Progression"}];

  return (
    <div className="page-container" style={{flexDirection:"column"}}>
      {/* Sticky header */}
      <div style={{padding:"20px 40px",borderBottom:`1px solid var(--border-subtle)`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"rgba(11, 17, 32, 0.8)",backdropFilter:"blur(12px)",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <button className="btn-secondary" onClick={()=>navigate("/dashboard")} style={{padding:"8px 16px"}}>← Dashboard</button>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:"var(--accent-teal)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Session #{sessionId}</div>
            <div style={{fontSize:16,fontWeight:600,color:"var(--text-primary)"}}>{sess.stage_label}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:12}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px",borderRadius:"var(--radius-md)",border:`1px solid ${tab===t.id?sm.color:"transparent"}`,background:tab===t.id?sm.bg:"transparent",color:tab===t.id?sm.color:"var(--text-secondary)",fontSize:13,fontWeight:tab===t.id?500:400,cursor:"pointer",transition:"all 0.2s"}}>
              {t.label}
            </button>
          ))}
          <button className="btn-primary" onClick={generateReport} disabled={genRpt} style={{padding:"8px 16px",fontSize:13,opacity:genRpt?.7:1}}>
            {genRpt?<span className="spinner" style={{width:14,height:14}}/>:"↓ PDF Report"}
          </button>
        </div>
      </div>

      <div style={{padding:"40px 48px", flex:1, overflowY:"auto"}}>

        {/* ── OVERVIEW TAB ─────────────────────────────────── */}
        {tab==="overview" && (
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:32,maxWidth:1200,margin:"0 auto"}} className="results-grid">
            {/* Score card */}
            <div className="animate-fade-up">
              <Card style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:300,background:sm.bg,borderColor:sm.color}}>
                <div style={{fontSize:12,fontWeight:600,color:sm.color,textTransform:"uppercase",letterSpacing:".08em",marginBottom:24}}>Final AD Risk Score</div>
                <Arc score={adPct} color={sm.color} size={220}/>
                <div style={{marginTop:24,padding:"8px 24px",borderRadius:99,background:sm.bg,border:`1px solid ${sm.color}`,color:sm.color,fontSize:15,fontWeight:600}}>{sess.stage_label}</div>
                <div style={{marginTop:12,fontSize:13,color:"var(--text-secondary)"}}>CI: {Math.max(0,adPct-4).toFixed(1)}–{Math.min(100,adPct+4).toFixed(1)}%</div>
                <div style={{marginTop:24,width:"100%"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text-secondary)",marginBottom:8}}><span>Risk gauge</span><span style={{color:"var(--text-primary)",fontWeight:600}}>{adPct.toFixed(1)}/100</span></div>
                  <div style={{height:8,background:"var(--bg-main)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${adPct}%`,background:sm.color,borderRadius:99,transition:"width 1s ease"}}/></div>
                </div>
              </Card>
            </div>

            {/* Right grid */}
            <div style={{display:"flex",flexDirection:"column",gap:24}}>
              {/* Component contributions */}
              <Card className="animate-fade-up delay-100">
                <SH sub="Weighted contribution of each input modality">Fusion Breakdown</SH>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {[
                    {label:"Demographics",icon:"👤",val:demo?Math.round(.2*((demo.age>70?55:demo.age>60?35:20)+(demo.family_history?20:0))):0,color:"#60a5fa",w:"20%"},
                    {label:"Cognitive",icon:"🧠",val:cog?Math.round(.35*(100-cog.normalized_score)):0,color:"var(--accent-purple)",w:"35%"},
                    {label:"MRI Analysis",icon:"🔬",val:mri?Math.round(.45*(mri.mri_risk_score||0)):0,color:"var(--accent-teal)",w:"45%"},
                  ].map(({label,icon,val,color,w})=>(
                    <div key={label}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>{icon}</span><span style={{fontSize:14,color:"var(--text-primary)",fontWeight:500}}>{label}</span><span style={{fontSize:11,color:"var(--text-tertiary)"}}>weight: {w}</span></div>
                        <span className="serif" style={{fontSize:24,color}}>{val}%</span>
                      </div>
                      <div style={{height:8,background:"var(--bg-panel)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${val}%`,background:color,borderRadius:99,transition:"width .7s ease"}}/></div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Stats row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {[
                  {label:"Cognitive Score",val:cog?`${cog.normalized_score.toFixed(1)}/100`:"—",color:"var(--accent-purple)",icon:"🧠"},
                  {label:"MRI Stage",val:mri?.ensemble_stage||"—",color:"var(--accent-teal)",icon:"🔬"},
                  {label:"Progression",val:prog?.progression_label||"First Visit",color:prog?.progression_label==="Worsened"?"var(--accent-red)":prog?.progression_label==="Improved"?"var(--accent-teal)":"var(--accent-amber)",icon:"📈"},
                ].map(({label,val,color,icon})=>(
                  <Card key={label} className="animate-fade-up delay-200" style={{padding:"20px"}}>
                    <div style={{fontSize:20,marginBottom:12}}>{icon}</div>
                    <div style={{fontSize:11,fontWeight:600,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{label}</div>
                    <div style={{fontSize:16,fontWeight:600,color}}>{val}</div>
                  </Card>
                ))}
              </div>

              {/* Trend mini bars */}
              {data.session_trend?.length>1 && (
                <Card className="animate-fade-up delay-300">
                  <SH sub="AD risk across all your sessions">Your Risk Trend</SH>
                  <div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>
                    {(data.session_trend||[]).slice(-10).map((s,i)=>{
                      const tsm=getStage(s.stage);
                      const isLast=i===(data.session_trend||[]).slice(-10).length-1;
                      return(
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                          <div className="mono" style={{fontSize:10,color:"var(--text-secondary)"}}>{Math.round(s.ad_percentage||0)}</div>
                          <div style={{width:"100%",height:`${Math.max((s.ad_percentage||0)/100*70,4)}px`,borderRadius:"4px 4px 0 0",background:isLast?tsm.color:tsm.bg,border:isLast?`1px solid ${tsm.color}`:"none",transition:"height .6s ease"}}/>
                          <div style={{fontSize:10,color:"var(--text-tertiary)"}}>{new Date(s.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ── MODALITIES TAB ───────────────────────────────── */}
        {tab==="modalities" && (
          <div style={{maxWidth:1100,margin:"0 auto",display:"flex",flexDirection:"column",gap:24}}>
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              {/* Demographics */}
              {demo && (
                <Card className="animate-fade-up" style={{flex:1,minWidth:320}}>
                  <SH sub="Baseline risk factors from your profile">Demographics</SH>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[["Age",demo.age],["Gender",demo.gender],["Education",demo.education_level],["Family Hx",demo.family_history?"Yes ⚠️":"No"],["Hypertension",demo.hypertension?"Yes ⚠️":"No"],["Diabetes",demo.diabetes?"Yes ⚠️":"No"],["Smoking",demo.smoking?"Yes":"No"],["Sleep",demo.sleep_quality]].map(([l,v])=>(
                      <div key={l} style={{padding:"12px 14px",background:"var(--bg-panel)",border:`1px solid var(--border-subtle)`,borderRadius:"var(--radius-sm)"}}>
                        <div style={{fontSize:11,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{l}</div>
                        <div style={{fontSize:14,color:"var(--text-primary)",fontWeight:500,textTransform:"capitalize"}}>{v??""}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {/* Cognitive */}
              {cog && (
                <Card className="animate-fade-up delay-100" style={{flex:1,minWidth:320}}>
                  <SH sub="25-question MMSE + MoCA assessment">Cognitive Assessment</SH>
                  <div style={{textAlign:"center",marginBottom:24,marginTop:16}}>
                    <div className="serif" style={{fontSize:56,color:"var(--accent-purple)",lineHeight:1}}>{cog.normalized_score.toFixed(1)}</div>
                    <div style={{fontSize:13,color:"var(--text-secondary)",marginTop:4}}>/100 normalized</div>
                  </div>
                  <div style={{height:8,background:"var(--bg-panel)",borderRadius:99,overflow:"hidden",marginBottom:12}}>
                    <div style={{height:"100%",width:`${cog.normalized_score}%`,background:"var(--accent-purple)",borderRadius:99}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--text-secondary)"}}>
                    <span>Raw: {cog.raw_score}/50</span>
                    <span style={{color:"var(--accent-purple)",fontWeight:600}}>{cog.normalized_score>=85?"Normal":cog.normalized_score>=70?"Mild Concern":cog.normalized_score>=50?"MCI":"Impaired"}</span>
                  </div>
                </Card>
              )}
            </div>
            {/* MRI */}
            {mri && (
              <Card className="animate-fade-up delay-200">
                <SH sub="VGG16 + ResNet50 ensemble prediction">MRI Analysis</SH>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:16,marginTop:20}}>
                  {[{label:"VGG16",val:mri.vgg16_prediction,conf:mri.vgg16_confidence,color:"var(--accent-blue)"},{label:"ResNet50",val:mri.resnet50_prediction,conf:mri.resnet50_confidence,color:"var(--accent-purple)"},{label:"Ensemble",val:mri.ensemble_stage,conf:mri.ensemble_confidence,color:"var(--accent-teal)"},{label:"MRI Risk",val:`${mri.mri_risk_score}/100`,conf:null,color:sm.color}].map(m=>(
                    <div key={m.label} style={{padding:"20px",background:"var(--bg-panel)",border:`1px solid var(--border-subtle)`,borderRadius:"var(--radius-md)",textAlign:"center"}}>
                      <div style={{fontSize:11,fontWeight:600,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:12}}>{m.label}</div>
                      <div style={{fontSize:15,fontWeight:600,color:m.color,marginBottom:m.conf?6:0}}>{m.val}</div>
                      {m.conf!=null&&<div style={{fontSize:12,color:"var(--text-secondary)"}}>{(m.conf*100).toFixed(1)}% conf</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── RECOMMENDATIONS TAB ──────────────────────────── */}
        {tab==="recommendations" && (
          <div style={{maxWidth:1000,margin:"0 auto"}}>
            {rec.follow_up && (
              <div className="animate-fade-up" style={{marginBottom:24,padding:"16px 20px",borderRadius:"var(--radius-md)",background:"var(--accent-teal-dim)",border:"1px solid rgba(20, 184, 166,0.3)",display:"flex",alignItems:"center",gap:16}}>
                <span style={{fontSize:24}}>📅</span>
                <div><div style={{fontSize:13,fontWeight:600,color:"var(--accent-teal)",marginBottom:2}}>Follow-up Schedule</div><div style={{fontSize:14,color:"var(--text-primary)"}}>{rec.follow_up}</div></div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(360px, 1fr))",gap:20}}>
              {Object.entries(rec.categories||{}).map(([cat,items],i)=>{
                const c=catColors[cat.charAt(0).toUpperCase()+cat.slice(1)]||"var(--accent-teal)";
                return(
                  <Card key={cat} className="animate-fade-up" style={{animationDelay:`${i*100}ms`}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                      <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:`${c}18`,border:`1px solid ${c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{cat==="medical"?"🏥":cat==="safety"?"⚠️":cat==="lifestyle"?"🌿":cat==="cognitive"?"🧠":"👥"}</div>
                      <div style={{fontSize:15,fontWeight:600,color:c,textTransform:"capitalize"}}>{cat}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      {(items||[]).slice(0,4).map((item,i)=>(
                        <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:i<(items.length>4?3:items.length-1)?`1px solid var(--border-subtle)`:"none"}}>
                          <div style={{width:4,borderRadius:99,background:c,flexShrink:0,marginTop:6,height:4}}/>
                          <div style={{fontSize:14,color:"var(--text-secondary)",lineHeight:1.6}}>{item.substring(0,180)}{item.length>180?"…":""}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PROGRESSION TAB ──────────────────────────────── */}
        {tab==="progression" && (
          <div style={{maxWidth:1000,margin:"0 auto",display:"flex",flexDirection:"column",gap:24}}>
            {prog ? (
              <>
                <div className="animate-fade-up" style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                  {[
                    {label:"AD Change",val:`${prog.delta_ad_percentage>0?"+":""}${prog.delta_ad_percentage?.toFixed(1)}%`,color:prog.delta_ad_percentage>0?"var(--accent-red)":"var(--accent-teal)"},
                    {label:"Cognitive Δ",val:`${prog.delta_cognitive>0?"+":""}${prog.delta_cognitive?.toFixed(1)}`,color:prog.delta_cognitive<0?"var(--accent-red)":"var(--accent-teal)"},
                    {label:"Trend",val:prog.progression_label,color:prog.progression_label==="Worsened"?"var(--accent-red)":prog.progression_label==="Improved"?"var(--accent-teal)":"var(--accent-amber)"},
                  ].map(({label,val,color})=>(
                    <Card key={label} style={{flex:1,minWidth:200,padding:"24px"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:12}}>{label}</div>
                      <div className="serif" style={{fontSize:36,color,lineHeight:1}}>{val}</div>
                    </Card>
                  ))}
                </div>
                <Card className="animate-fade-up delay-100" style={{padding:"24px 32px"}}>
                  <div style={{fontSize:15,color:"var(--text-secondary)",lineHeight:1.8}}>{prog.trend_details}</div>
                </Card>
                <Card className="animate-fade-up delay-200" style={{padding:"32px"}}>
                  <SH sub="vs previous session">Comparison</SH>
                  <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:24}}>
                    {[["AD Percentage",prog.prev_ad_percentage?.toFixed(1)+"%",adPct.toFixed(1)+"%",adPct>prog.prev_ad_percentage?"var(--accent-red)":"var(--accent-teal)"],["Cognitive Score",prog.prev_cognitive?.toFixed(1)||"—",cog?.normalized_score?.toFixed(1)||"—",cog?.normalized_score<prog.prev_cognitive?"var(--accent-red)":"var(--accent-teal)"],["MRI Stage",prog.prev_mri_stage||"—",mri?.ensemble_stage||"—","var(--text-primary)"]].map(([l,prev,curr,color])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",border:`1px solid var(--border-subtle)`,background:"var(--bg-panel)",borderRadius:"var(--radius-sm)"}}>
                        <span style={{fontSize:14,color:"var(--text-secondary)",fontWeight:500}}>{l}</span>
                        <div style={{display:"flex",gap:20,alignItems:"center"}}>
                          <span style={{fontSize:13,color:"var(--text-tertiary)"}}>{prev} (prev)</span>
                          <span style={{fontSize:"1.2em",color:"var(--text-tertiary)"}}>→</span>
                          <span style={{fontSize:15,fontWeight:600,color}}>{curr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card><div style={{textAlign:"center",padding:"48px",color:"var(--text-tertiary)",fontSize:15}}>This is your first assessment. Baseline established for future progression tracking.</div></Card>
            )}
            <div className="animate-fade-up delay-300" style={{display:"flex",gap:16,marginTop:16}}>
              <button className="btn-secondary" onClick={()=>navigate("/progression")} style={{flex:1}}>View Full Progression History</button>
              <button className="btn-primary" onClick={()=>navigate("/dashboard")} style={{flex:1}}>Back to Dashboard →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
