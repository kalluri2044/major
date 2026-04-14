import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const DOMAIN_META = {
  "Orientation":           {color:"var(--accent-blue)",bg:"rgba(59, 130, 246, 0.12)",  emoji:"🌍"},
  "Memory Registration":   {color:"var(--accent-purple)",bg:"rgba(139, 92, 246, 0.12)", emoji:"📝"},
  "Attention":             {color:"var(--accent-amber)",bg:"rgba(245, 158, 11, 0.12)",  emoji:"🎯"},
  "Language":              {color:"var(--accent-teal)",bg:"var(--accent-teal-dim)",  emoji:"💬"},
  "Visuospatial":          {color:"#f472b6",bg:"rgba(244, 114, 182, 0.12)", emoji:"🔷"},
  "Executive Function":    {color:"#fb923c",bg:"rgba(251, 146, 60, 0.12)",  emoji:"♟️"},
  "Delayed Memory Recall": {color:"#22d3ee",bg:"rgba(34, 211, 238, 0.12)",  emoji:"🔁"},
};

export default function CognitiveTest() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [elapsed, setElapsed]     = useState(0);
  const [timeLeft, setTimeLeft]   = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get("/cognitive/questions").then(({data}) => { setQuestions(data.questions); setLoading(false); });
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { clearInterval(t); clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    const q = questions[current];
    if(q?.id === 12) {
      setTimeLeft(60);
      timerRef.current = setInterval(() => setTimeLeft(t => { if(t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    } else setTimeLeft(null);
  }, [current, questions]);

  const q = questions[current];
  const ans = answers[q?.id] || { raw_answer: "", awarded_score: 0 };
  const setAns = (raw, score=null) => setAnswers(p => ({...p, [q.id]: { question_id: q.id, raw_answer: raw, awarded_score: score !== null ? score : p[q?.id]?.awarded_score || 0 }}));
  const setScore = (s) => setAnswers(p => ({...p, [q.id]: { ...p[q.id] || { question_id: q.id, raw_answer: "" }, awarded_score: s }}));
  const answered = Object.keys(answers).length;

  const submit = async () => {
    setSubmitting(true);
    const list = questions.map(qu => ({ question_id: qu.id, raw_answer: answers[qu.id]?.raw_answer || "", awarded_score: answers[qu.id]?.awarded_score || 0 }));
    try {
      let sid = sessionId;
      if (!sid) {
        try { const { data: sd } = await api.post("/user/sessions"); sid = String(sd.session?.id || 1); } catch { sid = "1"; }
      }
      const { data } = await api.post("/cognitive/submit", { session_id: parseInt(sid), answers: list });
      setResult(data);
    } catch(e) { 
      alert(e.response?.data?.error || "Submission failed."); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  if(loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"var(--bg-main)", color:"var(--text-secondary)" }}><div className="spinner" style={{ marginRight:12 }}/> Loading assessment…</div>;

  // ── Results Screen (Hidden Output) ─────────────────────────────────────────
  if(result) {
    return(
      <div className="page-container">
        {/* Sidebar Navigation */}
        <div className="sidebar">
          <div style={{ padding:"24px 20px 16px", borderBottom:"1px solid var(--border-subtle)", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"var(--accent-teal)", color:"var(--bg-main)", fontFamily:"'Instrument Serif',serif", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>N</div>
              <div><div style={{ fontSize:16, fontWeight:600 }}>NeuroScan</div><div style={{ fontSize:11, color:"var(--accent-teal)" }}>AI Assessment</div></div>
            </div>
          </div>
          {[["👤","Demographics","/demographics",""],["🧠","Cognitive Test","/cognitive-test","cognitive"],["🔬","MRI Upload","/mri-upload",""],["📊","Results","/dashboard",""]].map(([ic,lb,hr,id],i)=>(
            <a key={lb} href={hr} className={`nav-link ${id === "cognitive" ? "active" : ""}`}>
              <span style={{ fontSize:16 }}>{i===0 ? "✓" : ic}</span><span>{lb}</span>
            </a>
          ))}
        </div>

        <div className="main-content" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div className="glass-panel animate-fade-up" style={{ padding: "48px", maxWidth: 500, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>Cognitive Profile Saved</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
              Your cognitive assessment responses have been securely recorded. The ensemble AI models will process this along with your MRI data in the next step.
            </p>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => navigate(sessionId ? `/mri-upload?session_id=${sessionId}` : "/mri-upload")}>
              Continue to MRI Upload →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question Screen ─────────────────────────────────────────────────────────
  const dm = q ? (DOMAIN_META[q.domain] || { color:"var(--accent-teal)", bg:"var(--accent-teal-dim)", emoji:"📋" }) : {};
  const domains = [...new Set(questions.map(q => q.domain))];

  return(
    <div className="page-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div style={{ padding:"24px 20px 16px", borderBottom:"1px solid var(--border-subtle)", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"var(--accent-teal)", color:"var(--bg-main)", fontFamily:"'Instrument Serif',serif", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>N</div>
            <div><div style={{ fontSize:16, fontWeight:600 }}>NeuroScan</div><div style={{ fontSize:11, color:"var(--accent-teal)" }}>AI Assessment</div></div>
          </div>
        </div>
        {[["👤","Demographics","/demographics",""],["🧠","Cognitive Test","/cognitive-test","cognitive"],["🔬","MRI Upload","/mri-upload",""],["📊","Results","/dashboard",""]].map(([ic,lb,hr,id],i)=>(
          <a key={lb} href={hr} className={`nav-link ${id === "cognitive" ? "active" : ""}`}>
            <span style={{ fontSize:16 }}>{i===0 ? "✓" : ic}</span><span>{lb}</span>
          </a>
        ))}
      </div>

      <div className="main-content">
        {/* Top bar */}
        <div style={{ padding:"40px 48px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div className="animate-fade-up">
            <div className="badge badge-teal" style={{ marginBottom:12 }}>Cognitive Assessment</div>
            <h1 style={{ fontSize:36 }}>
              Question <span style={{ color:"var(--accent-teal)" }}>{current+1}</span> <span style={{ color:"var(--text-tertiary)", fontSize:20 }}>of {questions.length}</span>
            </h1>
          </div>
          
          <div className="animate-fade-up delay-100" style={{ display:"flex", alignItems:"center", gap:16 }}>
            {timeLeft !== null && (
              <div className="glass-panel" style={{ padding:"10px 20px", display:"flex", alignItems:"center", gap:10, background: timeLeft < 15 ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)", borderColor: timeLeft < 15 ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)" }}>
                <span style={{ fontSize:18, animation: timeLeft < 15 ? "pulse-glow 1s infinite" : "none" }}>⏰</span>
                <span className="mono" style={{ fontSize:16, fontWeight:600, color: timeLeft < 15 ? "var(--accent-red)" : "var(--accent-amber)" }}>{timeLeft}s</span>
              </div>
            )}
            <div className="glass-panel" style={{ padding:"10px 20px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:18, color:"var(--text-secondary)" }}>⏱</span>
              <span className="mono" style={{ fontSize:16, color:"var(--text-primary)", fontWeight:500 }}>{fmt(elapsed)}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="animate-fade-up" style={{ margin:"24px 48px 0", height:6, background:"var(--bg-panel)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(answered/questions.length)*100}%`, background:`linear-gradient(90deg, var(--accent-teal), var(--accent-blue))`, borderRadius:99, transition:"width 0.4s ease" }}/>
        </div>

        <div style={{ flex:1, display:"flex", gap:32, padding:"32px 48px 48px" }}>
          
          {/* Question card */}
          <div style={{ flex:1 }} className="animate-fade-up delay-200">
            {q && (
              <div className="glass-panel" style={{ padding:"40px" }}>
                {/* Domain badge */}
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:99, background:dm.bg, border:`1px solid ${dm.color}`, marginBottom:24, opacity: 0.8 }}>
                  <span style={{ fontSize:16 }}>{dm.emoji}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:dm.color }}>{q.domain}</span>
                  <span style={{ fontSize:11, color:"var(--text-tertiary)", marginLeft:6 }}>| Max {q.max_score} pts</span>
                </div>

                <h2 style={{ fontSize:22, fontWeight:500, color:"var(--text-primary)", lineHeight:1.5, marginBottom:12 }}>{q.question}</h2>
                <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:32, lineHeight:1.6 }}>{q.instructions}</p>

                {/* Text input */}
                {["text_input","number_sequence","word_recall"].includes(q.type) && (
                  <textarea value={ans.raw_answer} onChange={e => setAns(e.target.value)}
                    placeholder={q.hint} rows={3}
                    className="input-field" style={{ resize:"none", marginBottom:24 }}/>
                )}

                {/* Choice */}
                {q.type === "single_choice" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
                    {q.options.map((opt, i) => {
                      const sel = ans.raw_answer === opt;
                      const score = q.options.length === 3 ? (i === 0 ? q.max_score : i === 1 ? Math.ceil(q.max_score / 2) : 0) : (i === 0 ? q.max_score : 0);
                      return(
                        <div key={i} onClick={() => setAnswers(p => ({...p, [q.id]: { question_id:q.id, raw_answer:opt, awarded_score:score }}))}
                          className="glass-panel"
                          style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", cursor:"pointer", transition:"all 0.2s", background: sel ? dm.bg : "var(--bg-panel)", borderColor: sel ? dm.color : "var(--border-subtle)" }}>
                          <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${sel ? dm.color : "var(--border-subtle)"}`, background: sel ? dm.color : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {sel && <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--bg-main)" }}/>}
                          </div>
                          <span style={{ fontSize:15, color: sel ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: sel ? 500 : 400 }}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Self-rate */}
                {["text_input","word_recall","number_sequence"].includes(q.type) && (
                  <div className="glass-panel" style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 24px", marginBottom:24 }}>
                    <span style={{ fontSize:14, color:"var(--text-secondary)", flexShrink:0 }}>Self-rate your answer:</span>
                    <div style={{ display:"flex", gap:8 }}>
                      {Array.from({length: q.max_score + 1}, (_,i) => i).map(s => (
                        <button key={s} onClick={() => setScore(s)} 
                          style={{ width:36, height:36, borderRadius:8, border:`1px solid ${ans.awarded_score === s ? dm.color : "var(--border-subtle)"}`, background: ans.awarded_score === s ? dm.bg : "transparent", color: ans.awarded_score === s ? dm.color : "var(--text-secondary)", fontSize:14, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ padding:"14px 20px", background:"rgba(255,255,255,0.02)", borderRadius:"var(--radius-md)", marginBottom:32, borderLeft:`3px solid ${dm.color}` }}>
                  <span style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>💡 {q.hint}</span>
                </div>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:24, borderTop:"1px solid var(--border-subtle)" }}>
                  <button className="btn-secondary" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>← Previous</button>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    {current < questions.length - 1
                      ? <button className="btn-primary" onClick={() => setCurrent(c => c + 1)}>Next Question →</button>
                      : <button className="btn-primary" style={{ background:"var(--accent-blue)", color:"#fff" }} onClick={submit} disabled={submitting}>{submitting ? "Processing…" : "✓ Submit Assessment"}</button>
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ width:300, flexShrink:0, display:"flex", flexDirection:"column", gap:20 }}>
            {/* Domain progress */}
            <div className="glass-panel animate-fade-up delay-100" style={{ padding:"24px" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:20 }}>Domain Progress</div>
              {domains.map(domain => {
                const qs = questions.filter(qu => qu.domain === domain);
                const done = qs.filter(qu => answers[qu.id]?.raw_answer).length;
                const m = DOMAIN_META[domain] || { color:"var(--accent-teal)", emoji:"📋" };
                const active = q?.domain === domain;
                return(
                  <div key={domain} onClick={() => setCurrent(questions.indexOf(qs[0]))} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, cursor:"pointer", opacity: active ? 1 : 0.6, transition:"all 0.2s" }}>
                    <span style={{ fontSize:18, width:24, textAlign:"center" }}>{m.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color: active ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: active ? 600 : 400, marginBottom:6 }}>{domain}</div>
                      <div style={{ height:4, background:"var(--bg-main)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(done/qs.length)*100}%`, background:m.color, borderRadius:99, transition:"width 0.3s" }}/>
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:"var(--text-tertiary)", width:32, textAlign:"right", fontWeight:600 }}>{done}/{qs.length}</span>
                  </div>
                );
              })}
            </div>

            {/* Question map */}
            <div className="glass-panel animate-fade-up delay-200" style={{ padding:"24px" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:16 }}>Question Navigator</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {questions.map((qq, i) => {
                  const m = DOMAIN_META[qq.domain] || { color:"var(--accent-teal)" };
                  const isCurr = i === current;
                  const isDone = !!answers[qq.id]?.raw_answer;
                  return(
                    <div key={qq.id} onClick={() => setCurrent(i)} 
                      style={{
                        width:32, height:32, borderRadius:8, fontSize:12, fontWeight:600,
                        display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                        background: isCurr ? m.color : isDone ? "var(--bg-panel-hover)" : "transparent",
                        color: isCurr ? "var(--bg-main)" : isDone ? m.color : "var(--text-tertiary)",
                        border: `1px solid ${isCurr ? m.color : isDone ? m.color : "var(--border-subtle)"}`,
                        transition:"all 0.2s ease",
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
