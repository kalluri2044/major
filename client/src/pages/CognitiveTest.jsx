import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const T = {
  navy:"#0a1628",teal:"#00d4aa",slate:"rgba(255,255,255,0.45)",
  slateD:"rgba(255,255,255,0.22)",border:"rgba(255,255,255,0.08)",
};

const DOMAIN_META = {
  "Orientation":           {color:"#60a5fa",bg:"rgba(96,165,250,0.12)",  emoji:"🌍"},
  "Memory Registration":   {color:"#a78bfa",bg:"rgba(167,139,250,0.12)", emoji:"📝"},
  "Attention":             {color:"#fbbf24",bg:"rgba(251,191,36,0.12)",  emoji:"🎯"},
  "Language":              {color:"#34d399",bg:"rgba(52,211,153,0.12)",  emoji:"💬"},
  "Visuospatial":          {color:"#f472b6",bg:"rgba(244,114,182,0.12)", emoji:"🔷"},
  "Executive Function":    {color:"#fb923c",bg:"rgba(251,146,60,0.12)",  emoji:"♟️"},
  "Delayed Memory Recall": {color:"#22d3ee",bg:"rgba(34,211,238,0.12)",  emoji:"🔁"},
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#0a1628;color:#fff;-webkit-font-smoothing:antialiased;}
input,textarea,select{font-family:'DM Sans',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes countDown{from{stroke-dashoffset:0}to{stroke-dashoffset:163}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.au{animation:fadeUp .38s cubic-bezier(.22,.68,0,1.1) both}
.ai{animation:fadeIn .3s ease both}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
textarea{resize:none;}
`;

function SideNav() {
  return (
    <div style={{width:220,flexShrink:0,background:"rgba(0,0,0,0.3)",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",padding:"28px 0",position:"sticky",top:0,height:"100vh"}}>
      <div style={{padding:"0 22px 24px",borderBottom:`1px solid ${T.border}`,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:T.teal,color:T.navy,fontFamily:"'Instrument Serif',serif",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>N</div>
          <div><div style={{fontSize:14,fontWeight:600,color:"#fff"}}>NeuroScan</div><div style={{fontSize:10,color:T.slateD}}>AI Assessment</div></div>
        </div>
      </div>
      {[["👤","Demographics","/demographics",""],["🧠","Cognitive Test","/cognitive-test","cognitive"],["🔬","MRI Upload","/mri-upload",""],["📊","Results","/dashboard",""]].map(([ic,lb,hr,id],i)=>(
        <a key={lb} href={hr} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",margin:"0 8px",borderRadius:10,background:id==="cognitive"?"rgba(0,212,170,0.1)":"transparent",textDecoration:"none",marginBottom:2}}>
          <div style={{width:28,height:28,borderRadius:8,background:id==="cognitive"?T.teal:"rgba(255,255,255,0.06)",color:id==="cognitive"?T.navy:"rgba(255,255,255,0.35)",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{i===0?"✓":i+1}</div>
          <span style={{fontSize:13,fontWeight:500,color:id==="cognitive"?T.teal:"rgba(255,255,255,0.4)"}}>{lb}</span>
          {id==="cognitive"&&<div style={{width:5,height:5,borderRadius:"50%",background:T.teal,marginLeft:"auto"}}/>}
        </a>
      ))}
    </div>
  );
}

export default function CognitiveTest() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [questions,setQuestions] = useState([]);
  const [current,setCurrent]     = useState(0);
  const [answers,setAnswers]     = useState({});
  const [submitting,setSubmitting] = useState(false);
  const [result,setResult]       = useState(null);
  const [loading,setLoading]     = useState(true);
  const [elapsed,setElapsed]     = useState(0);
  const [timeLeft,setTimeLeft]   = useState(null);
  const timerRef = useRef(null);

  useEffect(()=>{
    const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);
    api.get("/cognitive/questions").then(({data})=>{setQuestions(data.questions);setLoading(false);});
    const t=setInterval(()=>setElapsed(e=>e+1),1000);
    return()=>{document.head.removeChild(s);clearInterval(t);clearInterval(timerRef.current);};
  },[]);

  useEffect(()=>{
    clearInterval(timerRef.current);
    const q=questions[current];
    if(q?.id===12){
      setTimeLeft(60);
      timerRef.current=setInterval(()=>setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);return 0;}return t-1;}),1000);
    }else setTimeLeft(null);
  },[current,questions]);

  const q = questions[current];
  const ans = answers[q?.id]||{raw_answer:"",awarded_score:0};
  const setAns=(raw,score=null)=>setAnswers(p=>({...p,[q.id]:{question_id:q.id,raw_answer:raw,awarded_score:score!==null?score:p[q?.id]?.awarded_score||0}}));
  const setScore=(s)=>setAnswers(p=>({...p,[q.id]:{...p[q.id]||{question_id:q.id,raw_answer:""},awarded_score:s}}));
  const answered=Object.keys(answers).length;

  const submit=async()=>{
    setSubmitting(true);
    const list=questions.map(q=>({question_id:q.id,raw_answer:answers[q.id]?.raw_answer||"",awarded_score:answers[q.id]?.awarded_score||0}));
    try{
      // Ensure we have a valid session ID
      let sid = sessionId;
      if (!sid) {
        try {
          const { data: sd } = await api.post("/user/sessions");
          sid = String(sd.session?.id || 1);
        } catch { sid = "1"; }
      }
      const{data}=await api.post("/cognitive/submit",{session_id:parseInt(sid),answers:list});
      setResult(data);
    }catch(e){alert(e.response?.data?.error||"Submission failed.");}
    finally{setSubmitting(false);}
  };

  const fmt=(s)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.navy,color:T.slateD,fontSize:14}}>Loading assessment…</div>;

  // ── Results Screen ──────────────────────────────────────────────────────────
  if(result){
    const sc=result.scoring;
    const pct=sc.normalized_score;
    const levelColor=pct>=85?T.teal:pct>=70?"#fbbf24":pct>=50?"#fb923c":"#ff6b6b";
    const levelLabel=sc.impairment_level;
    const C=2*Math.PI*62;
    const offset=C-(pct/100)*C;
    return(
      <div style={{display:"flex",minHeight:"100vh",background:T.navy}}>
        <SideNav/>
        <div style={{flex:1,overflowY:"auto",padding:"40px"}}>
          <div className="au" style={{maxWidth:780,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:36}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",color:T.teal,marginBottom:10,textTransform:"uppercase"}}>Assessment Complete</div>
              <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:40,color:"#fff",fontWeight:400,marginBottom:8}}>Cognitive<em style={{color:T.teal}}> Results</em></h1>
              <p style={{fontSize:14,color:T.slate}}>Completed in {fmt(elapsed)} · {sc.raw_score}/{sc.max_raw} raw points</p>
            </div>

            {/* Big score */}
            <div style={{display:"flex",gap:24,marginBottom:28}}>
              <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:20,padding:28,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:180}}>
                <div style={{position:"relative",width:150,height:150,marginBottom:14}}>
                  <svg width="150" height="150" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="75" cy="75" r="62" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                    <circle cx="75" cy="75" r="62" fill="none" stroke={levelColor} strokeWidth="10" strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontFamily:"'Instrument Serif',serif",fontSize:46,color:levelColor,lineHeight:1}}>{Math.round(pct)}</div>
                    <div style={{fontSize:12,color:T.slateD}}>/100</div>
                  </div>
                </div>
                <div style={{padding:"6px 16px",borderRadius:99,background:`${levelColor}18`,border:`1px solid ${levelColor}44`,color:levelColor,fontSize:12,fontWeight:600,textAlign:"center"}}>{levelLabel}</div>
              </div>

              {/* Domain breakdown */}
              <div style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:20,padding:24}}>
                <div style={{fontSize:12,fontWeight:600,color:T.slateD,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:16}}>Domain Breakdown</div>
                <div style={{display:"flex",flexDirection:"column",gap:11}}>
                  {Object.entries(sc.domain_percentages).map(([domain,pct])=>{
                    const m=DOMAIN_META[domain]||{color:T.teal,emoji:"📋"};
                    return(
                      <div key={domain} style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:15,width:20,textAlign:"center"}}>{m.emoji}</span>
                        <div style={{fontSize:12,color:T.slate,width:165,flexShrink:0}}>{domain}</div>
                        <div style={{flex:1,height:6,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:m.color,borderRadius:99,transition:"width 0.8s ease"}}/>
                        </div>
                        <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.7)",width:36,textAlign:"right"}}>{Math.round(pct)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Insights */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:28}}>
              <div style={{background:"rgba(255,107,107,0.06)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:14,padding:18}}>
                <div style={{fontSize:11,fontWeight:600,color:"#ff6b6b",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10}}>Weakest Domains</div>
                {sc.weakest_domains.map(d=>{
                  const m=DOMAIN_META[d]||{emoji:"📋",color:"#ff6b6b"};
                  return <div key={d} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}><span style={{fontSize:14}}>{m.emoji}</span><span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>{d}</span><span style={{marginLeft:"auto",fontSize:12,fontWeight:600,color:"#ff6b6b"}}>{Math.round(sc.domain_percentages[d])}%</span></div>;
                })}
              </div>
              <div style={{background:"rgba(0,212,170,0.06)",border:"1px solid rgba(0,212,170,0.2)",borderRadius:14,padding:18}}>
                <div style={{fontSize:11,fontWeight:600,color:T.teal,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10}}>Strongest Domains</div>
                {sc.strongest_domains.map(d=>{
                  const m=DOMAIN_META[d]||{emoji:"📋",color:T.teal};
                  return <div key={d} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}><span style={{fontSize:14}}>{m.emoji}</span><span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>{d}</span><span style={{marginLeft:"auto",fontSize:12,fontWeight:600,color:T.teal}}>{Math.round(sc.domain_percentages[d])}%</span></div>;
                })}
              </div>
            </div>

            <button onClick={()=>navigate(sessionId ? `/mri-upload?session_id=${sessionId}` : "/mri-upload")}
              style={{display:"block",width:"100%",padding:"15px",background:T.teal,color:T.navy,border:"none",borderRadius:12,fontSize:15,fontWeight:600,cursor:"pointer",letterSpacing:"0.01em"}}>
              Continue to MRI Upload →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question Screen ─────────────────────────────────────────────────────────
  const dm = q ? (DOMAIN_META[q.domain]||{color:T.teal,bg:"rgba(0,212,170,0.1)",emoji:"📋"}) : {};
  const domains=[...new Set(questions.map(q=>q.domain))];

  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.navy}}>
      <SideNav/>

      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>

        {/* Top bar */}
        <div style={{padding:"24px 36px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",color:T.teal,textTransform:"uppercase",marginBottom:4}}>Cognitive Assessment</div>
            <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:28,color:"#fff",fontWeight:400}}>
              Question <span style={{color:T.teal}}>{current+1}</span> <span style={{color:T.slateD,fontSize:18}}>of {questions.length}</span>
            </h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {timeLeft!==null&&(
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:99,background:timeLeft<15?"rgba(255,107,107,0.1)":"rgba(251,191,36,0.1)",border:`1px solid ${timeLeft<15?"rgba(255,107,107,0.3)":"rgba(251,191,36,0.3)"}`}}>
                <span style={{animation:"pulse 1s infinite",fontSize:14}}>⏰</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:500,color:timeLeft<15?"#ff6b6b":"#fbbf24"}}>{timeLeft}s</span>
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:99,background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,color:T.slateD}}>⏱</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:"rgba(255,255,255,0.7)",fontWeight:500}}>{fmt(elapsed)}</span>
            </div>
            <div style={{fontSize:12,color:T.slateD}}>{answered}/{questions.length} answered</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{margin:"16px 36px 0",height:4,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(answered/questions.length)*100}%`,background:`linear-gradient(90deg,${T.teal},#60a5fa)`,borderRadius:99,transition:"width 0.4s ease"}}/>
        </div>

        <div style={{flex:1,display:"flex",gap:20,padding:"20px 36px 36px"}}>

          {/* Question card */}
          <div style={{flex:1}} className="au">
            {q&&(
              <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:20,padding:28}}>

                {/* Domain badge */}
                <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"6px 14px",borderRadius:99,background:dm.bg,border:`1px solid ${dm.color}33`,marginBottom:18}}>
                  <span style={{fontSize:14}}>{dm.emoji}</span>
                  <span style={{fontSize:12,fontWeight:600,color:dm.color}}>{q.domain}</span>
                  <span style={{fontSize:10,color:`${dm.color}88`,marginLeft:4}}>Max {q.max_score} pts</span>
                </div>

                <h2 style={{fontSize:17,fontWeight:500,color:"#fff",lineHeight:1.55,marginBottom:10}}>{q.question}</h2>
                <p style={{fontSize:12,color:T.slateD,marginBottom:20,lineHeight:1.5}}>{q.instructions}</p>

                {/* Text input */}
                {["text_input","number_sequence","word_recall"].includes(q.type)&&(
                  <textarea value={ans.raw_answer} onChange={e=>setAns(e.target.value)}
                    placeholder={q.hint} rows={3}
                    style={{width:"100%",padding:"14px",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:12,fontSize:14,color:"#fff",outline:"none",marginBottom:14,lineHeight:1.5}}/>
                )}

                {/* Choice */}
                {q.type==="single_choice"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:14}}>
                    {q.options.map((opt,i)=>{
                      const sel=ans.raw_answer===opt;
                      const score=q.options.length===3?(i===0?q.max_score:i===1?Math.ceil(q.max_score/2):0):(i===0?q.max_score:0);
                      return(
                        <div key={i} onClick={()=>setAnswers(p=>({...p,[q.id]:{question_id:q.id,raw_answer:opt,awarded_score:score}}))}
                          style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:12,border:`1px solid ${sel?`${dm.color}55`:T.border}`,background:sel?dm.bg:"rgba(255,255,255,0.02)",cursor:"pointer",transition:"all 0.18s",userSelect:"none"}}>
                          <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${sel?dm.color:"rgba(255,255,255,0.25)"}`,background:sel?dm.color:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {sel&&<div style={{width:6,height:6,borderRadius:"50%",background:T.navy}}/>}
                          </div>
                          <span style={{fontSize:13,color:sel?"#fff":"rgba(255,255,255,0.6)",fontWeight:sel?500:400}}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Self-rate */}
                {["text_input","word_recall","number_sequence"].includes(q.type)&&(
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:14,border:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,color:T.slateD,flexShrink:0}}>Self-rate your answer:</span>
                    <div style={{display:"flex",gap:6}}>
                      {Array.from({length:q.max_score+1},(_,i)=>i).map(s=>(
                        <button key={s} onClick={()=>setScore(s)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${ans.awarded_score===s?dm.color:T.border}`,background:ans.awarded_score===s?dm.bg:"transparent",color:ans.awarded_score===s?dm.color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:9,marginBottom:22,borderLeft:`2px solid ${dm.color}55`}}>
                  <span style={{fontSize:12,color:T.slateD,lineHeight:1.5}}>💡 {q.hint}</span>
                </div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:16,borderTop:`1px solid ${T.border}`}}>
                  <button onClick={()=>setCurrent(c=>c-1)} disabled={current===0} style={{padding:"10px 20px",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:10,color:"rgba(255,255,255,0.5)",fontSize:13,cursor:"pointer",opacity:current===0?0.3:1}}>← Prev</button>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {current<questions.length-1
                      ?<button onClick={()=>setCurrent(c=>c+1)} style={{padding:"10px 22px",background:T.teal,color:T.navy,border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Next →</button>
                      :<button onClick={submit} disabled={submitting} style={{padding:"10px 24px",background:"#22c55e",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",opacity:submitting?0.7:1}}>{submitting?"Scoring…":"✓ Submit Assessment"}</button>
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{width:240,flexShrink:0,display:"flex",flexDirection:"column",gap:14}}>

            {/* Domain progress */}
            <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:16,padding:18}}>
              <div style={{fontSize:11,fontWeight:600,color:T.slateD,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:14}}>Domain Progress</div>
              {domains.map(domain=>{
                const qs=questions.filter(q=>q.domain===domain);
                const done=qs.filter(q=>answers[q.id]?.raw_answer).length;
                const m=DOMAIN_META[domain]||{color:T.teal,emoji:"📋"};
                const active=q?.domain===domain;
                return(
                  <div key={domain} onClick={()=>setCurrent(questions.indexOf(qs[0]))} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:"pointer",opacity:active?1:0.7,transition:"opacity 0.2s"}}>
                    <span style={{fontSize:13,width:18,textAlign:"center"}}>{m.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:active?"#fff":"rgba(255,255,255,0.5)",fontWeight:active?500:400,marginBottom:3}}>{domain}</div>
                      <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(done/qs.length)*100}%`,background:m.color,borderRadius:99,transition:"width 0.3s"}}/>
                      </div>
                    </div>
                    <span style={{fontSize:10,color:T.slateD,width:28,textAlign:"right"}}>{done}/{qs.length}</span>
                  </div>
                );
              })}
            </div>

            {/* Question map */}
            <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:16,padding:18}}>
              <div style={{fontSize:11,fontWeight:600,color:T.slateD,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:12}}>Question Map</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {questions.map((qq,i)=>{
                  const m=DOMAIN_META[qq.domain]||{color:T.teal};
                  const isCurr=i===current;
                  const isDone=!!answers[qq.id]?.raw_answer;
                  return(
                    <div key={qq.id} onClick={()=>setCurrent(i)} style={{
                      width:26,height:26,borderRadius:7,fontSize:11,fontWeight:600,
                      display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                      background:isCurr?m.color:isDone?`${m.color}22`:"rgba(255,255,255,0.05)",
                      color:isCurr?T.navy:isDone?m.color:"rgba(255,255,255,0.3)",
                      border:`1px solid ${isCurr?m.color:isDone?`${m.color}44`:"transparent"}`,
                      transition:"all 0.15s",
                    }}>{i+1}</div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const fmt=(s)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
