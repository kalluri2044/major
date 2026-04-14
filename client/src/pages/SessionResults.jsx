import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const T = {
  navy:"#0a1628", teal:"#00d4aa", tealDim:"rgba(0,212,170,0.12)",
  border:"rgba(255,255,255,0.08)", slate:"rgba(255,255,255,0.45)",
  slateD:"rgba(255,255,255,0.22)", navyCard:"rgba(255,255,255,0.04)",
  red:"#ff6b6b", amber:"#fbbf24", orange:"#fb923c", purple:"#a78bfa",
};
const STAGE_META = {
  "Non-Demented / Healthy":       { color:"#00d4aa", bg:"rgba(0,212,170,0.1)",  grade:"A", emoji:"✅" },
  "Very Mild Demented (MCI)":     { color:"#fbbf24", bg:"rgba(251,191,36,0.1)", grade:"B", emoji:"⚠️" },
  "Mild Alzheimer's Disease":     { color:"#fb923c", bg:"rgba(251,146,60,0.1)", grade:"C", emoji:"🔶" },
  "Moderate Alzheimer's Disease": { color:"#ff6b6b", bg:"rgba(255,107,107,0.1)",grade:"D", emoji:"🔴" },
};
const getStage = (l) => STAGE_META[l] || { color:T.teal, bg:T.tealDim, grade:"?", emoji:"📊" };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#0a1628;color:#fff;-webkit-font-smoothing:antialiased;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.au{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.1) both}
.d1{animation-delay:.07s}.d2{animation-delay:.14s}.d3{animation-delay:.21s}.d4{animation-delay:.28s}.d5{animation-delay:.35s}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
@media(max-width:900px){.results-grid{grid-template-columns:1fr!important;}.modality-row{flex-direction:column!important;}}
@media(max-width:640px){.rec-cats{grid-template-columns:1fr!important;}}
`;

function Arc({ score, color, size=160 }) {
  const [v,setV]=useState(0);
  const R=size*.38,C=2*Math.PI*R;
  useEffect(()=>{
    let cur=0;
    const go=()=>{cur+=(score-cur)*.1;setV(Math.round(cur*10)/10);if(Math.abs(score-cur)>.2)requestAnimationFrame(go);};
    setTimeout(()=>requestAnimationFrame(go),400);
  },[score]);
  return (
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={C} strokeDashoffset={C-(v/100)*C} strokeLinecap="round" style={{transition:"stroke-dashoffset .05s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontFamily:"'Instrument Serif',serif",fontSize:size*.24,color,lineHeight:1,animation:"countUp .5s ease .5s both"}}>{Math.round(v)}</div>
        <div style={{fontSize:11,color:T.slateD,marginTop:2}}>/100</div>
      </div>
    </div>
  );
}

function Card({children,style:s,className:c}){return <div className={c} style={{background:T.navyCard,border:`1px solid ${T.border}`,borderRadius:18,padding:22,...s}}>{children}</div>;}
function SH({children,sub}){return <div style={{marginBottom:16}}><div style={{fontSize:14,fontWeight:600,color:"#fff",marginBottom:sub?3:0}}>{children}</div>{sub&&<div style={{fontSize:12,color:T.slateD}}>{sub}</div>}</div>;}

export default function SessionResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading,setLoading]= useState(true);
  const [genRpt, setGenRpt] = useState(false);
  const [tab, setTab]       = useState("overview");

  useEffect(()=>{
    const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);
    api.get(`/results/${sessionId}`).then(({data})=>setData(data)).catch(()=>navigate("/dashboard")).finally(()=>setLoading(false));
    return()=>document.head.removeChild(s);
  },[sessionId]);

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.navy,flexDirection:"column",gap:14}}><div style={{width:28,height:28,border:"3px solid rgba(0,212,170,.2)",borderTopColor:T.teal,borderRadius:"50%",animation:"spin .8s linear infinite"}}/><div style={{fontSize:14,color:T.slateD}}>Loading results…</div></div>;
  if(!data) return null;

  const sess=data.session, sm=getStage(sess.stage_label);
  const cog=data.cognitive, mri=data.mri, prog=data.progression;
  const rec=data.recommendation||{}, demo=data.demographics;
  const adPct=sess.final_ad_percentage||0;
  const catColors={Medical:T.red,Safety:T.orange,Lifestyle:T.teal,Cognitive:T.purple,Social:T.amber};

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
    <div style={{minHeight:"100vh",background:T.navy}}>
      {/* Sticky header */}
      <div style={{padding:"16px 32px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"rgba(10,22,40,.96)",backdropFilter:"blur(12px)",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={()=>navigate("/dashboard")} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 14px",color:T.slateD,fontSize:13,cursor:"pointer"}}>← Dashboard</button>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:T.teal,textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Session #{sessionId}</div>
            <div style={{fontSize:16,fontWeight:600,color:"#fff"}}>{sess.stage_label}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${tab===t.id?`${sm.color}55`:T.border}`,background:tab===t.id?sm.bg:"transparent",color:tab===t.id?sm.color:T.slateD,fontSize:12,fontWeight:tab===t.id?600:400,cursor:"pointer"}}>
              {t.label}
            </button>
          ))}
          <button onClick={generateReport} disabled={genRpt} style={{padding:"7px 16px",background:T.teal,color:T.navy,border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",opacity:genRpt?.7:1,display:"flex",alignItems:"center",gap:6}}>
            {genRpt?<span style={{width:12,height:12,border:"2px solid rgba(0,0,0,.2)",borderTopColor:T.navy,borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>:"↓"} PDF Report
          </button>
        </div>
      </div>

      <div style={{padding:"28px 32px 48px"}}>

        {/* ── OVERVIEW TAB ─────────────────────────────────── */}
        {tab==="overview" && (
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:24,maxWidth:1100}} className="results-grid">
            {/* Score card */}
            <div className="au">
              <Card style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:240,background:sm.bg,border:`1.5px solid ${sm.color}33`}}>
                <div style={{fontSize:11,fontWeight:600,color:T.slateD,textTransform:"uppercase",letterSpacing:".08em",marginBottom:16}}>Final AD Risk Score</div>
                <Arc score={adPct} color={sm.color} size={180}/>
                <div style={{marginTop:14,padding:"7px 20px",borderRadius:99,background:`${sm.color}22`,border:`1px solid ${sm.color}55`,color:sm.color,fontSize:14,fontWeight:600}}>{sess.stage_label}</div>
                <div style={{marginTop:8,fontSize:12,color:T.slateD}}>CI: {Math.max(0,adPct-4).toFixed(1)}–{Math.min(100,adPct+4).toFixed(1)}%</div>
                <div style={{marginTop:16,width:"100%"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.slateD,marginBottom:5}}><span>Risk gauge</span><span style={{color:"rgba(255,255,255,.65)",fontWeight:600}}>{adPct.toFixed(1)}/100</span></div>
                  <div style={{height:8,background:"rgba(255,255,255,.06)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${adPct}%`,background:sm.color,borderRadius:99,transition:"width .8s ease"}}/></div>
                </div>
              </Card>
            </div>

            {/* Right grid */}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Component contributions */}
              <Card className="au d1">
                <SH sub="Weighted contribution of each input modality">Fusion Breakdown</SH>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[
                    {label:"Demographics",icon:"👤",val:demo?Math.round(.2*((demo.age>70?55:demo.age>60?35:20)+(demo.family_history?20:0))):0,color:"#60a5fa",w:"20%"},
                    {label:"Cognitive",icon:"🧠",val:cog?Math.round(.35*(100-cog.normalized_score)):0,color:T.purple,w:"35%"},
                    {label:"MRI Analysis",icon:"🔬",val:mri?Math.round(.45*(mri.mri_risk_score||0)):0,color:T.teal,w:"45%"},
                  ].map(({label,icon,val,color,w})=>(
                    <div key={label}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:13,color:"rgba(255,255,255,.65)"}}>{label}</span><span style={{fontSize:10,color:T.slateD}}>weight: {w}</span></div>
                        <span style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color}}>{val}%</span>
                      </div>
                      <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${val}%`,background:color,borderRadius:99,transition:"width .7s ease"}}/></div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Stats row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {label:"Cognitive Score",val:cog?`${cog.normalized_score.toFixed(1)}/100`:"—",color:T.purple,icon:"🧠"},
                  {label:"MRI Stage",val:mri?.ensemble_stage||"—",color:T.teal,icon:"🔬"},
                  {label:"Progression",val:prog?.progression_label||"First Visit",color:prog?.progression_label==="Worsened"?T.red:prog?.progression_label==="Improved"?T.teal:T.amber,icon:"📈"},
                ].map(({label,val,color,icon})=>(
                  <Card key={label} className="au d2">
                    <div style={{fontSize:16,marginBottom:8}}>{icon}</div>
                    <div style={{fontSize:11,fontWeight:600,color:T.slateD,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{label}</div>
                    <div style={{fontSize:15,fontWeight:600,color}}>{val}</div>
                  </Card>
                ))}
              </div>

              {/* Trend mini bars */}
              {data.session_trend?.length>1 && (
                <Card className="au d3">
                  <SH sub="AD risk across all your sessions">Your Risk Trend</SH>
                  <div style={{display:"flex",alignItems:"flex-end",gap:6,height:70}}>
                    {(data.session_trend||[]).map((s,i)=>{
                      const tsm=getStage(s.stage);
                      const isLast=i===data.session_trend.length-1;
                      return(
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                          <div style={{fontSize:8,color:T.slateD,fontFamily:"'DM Mono',monospace"}}>{Math.round(s.ad_percentage||0)}</div>
                          <div style={{width:"100%",height:`${Math.max((s.ad_percentage||0)/100*60,4)}px`,borderRadius:"3px 3px 0 0",background:isLast?tsm.color:`${tsm.color}55`,border:isLast?`1px solid ${tsm.color}`:"none",transition:"height .6s ease"}}/>
                          <div style={{fontSize:7,color:T.slateD}}>{new Date(s.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</div>
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
          <div style={{maxWidth:1100,display:"flex",flexDirection:"column",gap:16}} className="modality-row">
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              {/* Demographics */}
              {demo && (
                <Card className="au" style={{flex:1,minWidth:260}}>
                  <SH sub="Baseline risk factors from your profile">Demographics</SH>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["Age",demo.age],["Gender",demo.gender],["Education",demo.education_level],["Family Hx",demo.family_history?"Yes ⚠️":"No"],["Hypertension",demo.hypertension?"Yes ⚠️":"No"],["Diabetes",demo.diabetes?"Yes ⚠️":"No"],["Smoking",demo.smoking?"Yes":"No"],["Sleep",demo.sleep_quality]].map(([l,v])=>(
                      <div key={l} style={{padding:"9px 11px",background:"rgba(255,255,255,.03)",border:`1px solid ${T.border}`,borderRadius:9}}>
                        <div style={{fontSize:9,color:T.slateD,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{l}</div>
                        <div style={{fontSize:12,color:"#fff",textTransform:"capitalize"}}>{v??""}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {/* Cognitive */}
              {cog && (
                <Card className="au d1" style={{flex:1,minWidth:260}}>
                  <SH sub="25-question MMSE + MoCA assessment">Cognitive Assessment</SH>
                  <div style={{textAlign:"center",marginBottom:16}}>
                    <div style={{fontFamily:"'Instrument Serif',serif",fontSize:44,color:T.purple,lineHeight:1}}>{cog.normalized_score.toFixed(1)}</div>
                    <div style={{fontSize:11,color:T.slateD}}>/100 normalized</div>
                  </div>
                  <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:99,overflow:"hidden",marginBottom:8}}>
                    <div style={{height:"100%",width:`${cog.normalized_score}%`,background:T.purple,borderRadius:99}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.slateD}}>
                    <span>Raw: {cog.raw_score}/50</span>
                    <span style={{color:T.purple,fontWeight:600}}>{cog.normalized_score>=85?"Normal":cog.normalized_score>=70?"Mild Concern":cog.normalized_score>=50?"MCI":"Impaired"}</span>
                  </div>
                </Card>
              )}
            </div>
            {/* MRI */}
            {mri && (
              <Card className="au d2">
                <SH sub="VGG16 + ResNet50 ensemble prediction">MRI Analysis</SH>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                  {[{label:"VGG16",val:mri.vgg16_prediction,conf:mri.vgg16_confidence,color:"#60a5fa"},{label:"ResNet50",val:mri.resnet50_prediction,conf:mri.resnet50_confidence,color:"#a78bfa"},{label:"Ensemble",val:mri.ensemble_stage,conf:mri.ensemble_confidence,color:T.teal},{label:"MRI Risk",val:`${mri.mri_risk_score}/100`,conf:null,color:sm.color}].map(m=>(
                    <div key={m.label} style={{padding:"14px",background:"rgba(255,255,255,.03)",border:`1px solid ${T.border}`,borderRadius:12,textAlign:"center"}}>
                      <div style={{fontSize:9,fontWeight:600,color:T.slateD,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>{m.label}</div>
                      <div style={{fontSize:13,fontWeight:600,color:m.color,marginBottom:m.conf?4:0}}>{m.val}</div>
                      {m.conf!=null&&<div style={{fontSize:10,color:T.slateD}}>{(m.conf*100).toFixed(1)}% conf</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── RECOMMENDATIONS TAB ──────────────────────────── */}
        {tab==="recommendations" && (
          <div style={{maxWidth:1000}}>
            {rec.follow_up && (
              <div className="au" style={{marginBottom:16,padding:"12px 18px",borderRadius:12,background:T.tealDim,border:"1px solid rgba(0,212,170,.3)",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:18}}>📅</span>
                <div><div style={{fontSize:12,fontWeight:600,color:T.teal,marginBottom:2}}>Follow-up Schedule</div><div style={{fontSize:13,color:"rgba(255,255,255,.65)"}}>{rec.follow_up}</div></div>
              </div>
            )}
            <div className="rec-cats" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {Object.entries(rec.categories||{}).map(([cat,items])=>{
                const c=catColors[cat.charAt(0).toUpperCase()+cat.slice(1)]||T.teal;
                return(
                  <Card key={cat} className="au d1">
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <div style={{width:28,height:28,borderRadius:8,background:`${c}18`,border:`1px solid ${c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{cat==="medical"?"🏥":cat==="safety"?"⚠️":cat==="lifestyle"?"🌿":cat==="cognitive"?"🧠":"👥"}</div>
                      <div style={{fontSize:13,fontWeight:600,color:c,textTransform:"capitalize"}}>{cat}</div>
                    </div>
                    {(items||[]).slice(0,4).map((item,i)=>(
                      <div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:i<(items.length>4?3:items.length-1)?`1px solid ${T.border}`:"none"}}>
                        <div style={{width:3,borderRadius:99,background:c,flexShrink:0,marginTop:2}}/>
                        <div style={{fontSize:12,color:"rgba(255,255,255,.6)",lineHeight:1.55}}>{item.substring(0,140)}{item.length>140?"…":""}</div>
                      </div>
                    ))}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PROGRESSION TAB ──────────────────────────────── */}
        {tab==="progression" && (
          <div style={{maxWidth:900,display:"flex",flexDirection:"column",gap:16}}>
            {prog ? (
              <>
                <div className="au" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                  {[
                    {label:"AD Change",val:`${prog.delta_ad_percentage>0?"+":""}${prog.delta_ad_percentage?.toFixed(1)}%`,color:prog.delta_ad_percentage>0?T.red:T.teal},
                    {label:"Cognitive Δ",val:`${prog.delta_cognitive>0?"+":""}${prog.delta_cognitive?.toFixed(1)}`,color:prog.delta_cognitive<0?T.red:T.teal},
                    {label:"Trend",val:prog.progression_label,color:prog.progression_label==="Worsened"?T.red:prog.progression_label==="Improved"?T.teal:T.amber},
                  ].map(({label,val,color})=>(
                    <Card key={label} style={{flex:1,minWidth:160}}>
                      <div style={{fontSize:11,fontWeight:600,color:T.slateD,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{label}</div>
                      <div style={{fontFamily:"'Instrument Serif',serif",fontSize:28,color,lineHeight:1}}>{val}</div>
                    </Card>
                  ))}
                </div>
                <Card className="au d1">
                  <div style={{fontSize:12,color:"rgba(255,255,255,.55)",lineHeight:1.7,padding:"4px 0"}}>{prog.trend_details}</div>
                </Card>
                <Card className="au d2">
                  <SH sub="vs previous session">Comparison</SH>
                  {[["AD Percentage",prog.prev_ad_percentage?.toFixed(1)+"%",adPct.toFixed(1)+"%",adPct>prog.prev_ad_percentage?T.red:T.teal],["Cognitive Score",prog.prev_cognitive?.toFixed(1)||"—",cog?.normalized_score?.toFixed(1)||"—",cog?.normalized_score<prog.prev_cognitive?T.red:T.teal],["MRI Stage",prog.prev_mri_stage||"—",mri?.ensemble_stage||"—",T.slateD]].map(([l,prev,curr,color])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontSize:12,color:T.slateD}}>{l}</span>
                      <div style={{display:"flex",gap:16,alignItems:"center"}}>
                        <span style={{fontSize:12,color:T.slateD}}>{prev} (prev)</span>
                        <span style={{fontSize:"1.2em"}}>→</span>
                        <span style={{fontSize:13,fontWeight:600,color}}>{curr}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              </>
            ) : (
              <Card><div style={{textAlign:"center",padding:"32px",color:T.slateD,fontSize:14}}>This is your first assessment. Baseline established for future progression tracking.</div></Card>
            )}
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>navigate("/progression")} style={{flex:1,padding:"11px",background:T.navyCard,border:`1px solid ${T.border}`,borderRadius:10,color:T.slateD,fontSize:13,cursor:"pointer"}}>View Full Progression History</button>
              <button onClick={()=>navigate("/dashboard")} style={{flex:1,padding:"11px",background:T.teal,color:T.navy,border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Back to Dashboard →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
