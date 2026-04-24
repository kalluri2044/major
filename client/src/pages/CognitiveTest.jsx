import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import AssessmentSidebar from "../components/AssessmentSidebar";
import { C } from "../components/DesignSystem";
import { AnimalNamingInput, WordInput } from "../components/CognitiveInputs";

const DOMAIN_META = {
  "Orientation":           {color: C.blue,   bg: "rgba(96, 165, 250, 0.1)", emoji:"🌍"},
  "Memory Registration":   {color: C.violet, bg: "rgba(167, 139, 250, 0.1)", emoji:"📝"},
  "Attention":             {color: C.amber,  bg: "rgba(252, 165, 73, 0.1)", emoji:"🎯"},
  "Language":              {color: C.teal,   bg: "rgba(0, 212, 170, 0.1)", emoji:"💬"},
  "Visuospatial":          {color: C.coral,  bg: "rgba(255, 77, 109, 0.1)", emoji:"🔷"},
  "Executive Function":    {color: C.gold,   bg: "rgba(245, 185, 66, 0.1)", emoji:"♟️"},
  "Delayed Memory Recall": {color: "#22d3ee", bg: "rgba(34, 211, 238, 0.1)", emoji:"🔁"},
};

export default function CognitiveTest() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [sessionId, setSessionId] = useState(params.get("session_id") || null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [elapsed, setElapsed]     = useState(0);

  useEffect(() => {
    if (sessionId) return;
    api.post("/user/sessions")
      .then(({ data }) => {
        const sid = data.session?.id;
        if (sid) {
          setSessionId(String(sid));
          window.history.replaceState(null, "", `/cognitive-test?session_id=${sid}`);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    api.get("/cognitive/questions").then(({data}) => { 
      setQuestions(data.questions); 
      setLoading(false); 
    });
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const q = questions[current];
  const ans = answers[q?.id] || { raw_answer: "", awarded_score: 0 };
  
  const setAns = (raw) => {
    setAnswers(p => ({
      ...p, 
      [q.id]: { 
        ...p[q.id],
        question_id: q.id, 
        raw_answer: raw, 
      }
    }));
  };

  const setScore = (s) => {
    setAnswers(p => ({
      ...p, 
      [q.id]: { 
        ...p[q.id] || { question_id: q.id, raw_answer: "" }, 
        awarded_score: s 
      }
    }));
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      window.scrollTo(0, 0);
    } else {
      submit();
    }
  };

  const submit = async () => {
    setSubmitting(true);
    const list = questions.map(qu => ({ 
      question_id: qu.id, 
      raw_answer: answers[qu.id]?.raw_answer || "", 
      awarded_score: answers[qu.id]?.awarded_score || 0 
    }));
    
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

  if(loading) return (
    <div style={{ display:"flex", flexDirection: "column", alignItems:"center", justifyContent:"center", height:"100vh", background:C.bg, color:C.textDim }}>
      <div className="spin" style={{ width: 40, height: 40, border: `2px solid ${C.tealDim}`, borderTopColor: C.teal, borderRadius: '50%', marginBottom: 20 }} />
      Initializing Cognitive Assessment Engine...
    </div>
  );

  if(result) {
    return(
      <div className="page-container" style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
        <AssessmentSidebar activeStep="cognitive" sessionId={sessionId} />
        <div style={{ flex: 1, display:"flex", alignItems:"center", justifyContent:"center", padding: 40 }}>
          <div className="glass-hi au" style={{ padding: "64px 48px", maxWidth: 540, width: "100%", textAlign: "center", borderRadius: 32 }}>
            <div style={{ fontSize: 72, marginBottom: 24, animation: 'scaleIn 0.6s cubic-bezier(0.23, 1, 0.32, 1)' }}>✅</div>
            <h2 className="section-title" style={{ fontSize: 32, marginBottom: 16 }}>Assessment Recorded</h2>
            <p style={{ color: C.textDim, fontSize: 16, marginBottom: 40, lineHeight: 1.6 }}>
              Neural signatures and cognitive patterns have been encoded. Your calculated score has been saved to your clinical record.
            </p>
            <button className="btn-primary" style={{ width: "100%", height: 56, fontSize: 16 }} onClick={() => navigate(sessionId ? `/mri-upload?session_id=${sessionId}` : "/mri-upload")}>
              Proceed to MRI Analysis →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dm = q ? (DOMAIN_META[q.domain] || { color: C.teal, bg: "rgba(0, 212, 170, 0.1)", emoji:"📋" }) : {};
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return(
    <div className="page-container" style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      <AssessmentSidebar activeStep="cognitive" sessionId={sessionId} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Section */}
        <div style={{ padding: "40px 60px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div className="badge-teal ai" style={{ marginBottom: 12 }}>Module 02: Clinical Cognitive Evaluation</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
               <h1 className="section-title au" style={{ fontSize: 44 }}>
                Question <span style={{ color: C.teal }}>{current + 1}</span>
              </h1>
              <span style={{ color: C.textFaint, fontSize: 20, fontWeight: 300 }}>/ {questions.length}</span>
            </div>
          </div>
          
          <div className="glass-hi ai" style={{ padding: "12px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: C.textDim, fontWeight: 600 }}>ELAPSED</span>
            <span className="mono" style={{ fontSize: 18, color: C.text, fontWeight: 700 }}>
              {Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}
            </span>
          </div>
        </div>

        {/* Unified Progress Track */}
        <div style={{ padding: "0 60px 40px" }}>
          <div className="progress-track" style={{ height: 4, background: 'rgba(255,255,255,0.03)' }}>
            <div className="progress-bar" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.blue})`, boxShadow: `0 0 10px ${C.tealGlow}` }} />
          </div>
        </div>

        <div style={{ padding: "0 60px 60px", flex: 1, display: 'flex', gap: 40 }}>
          
          {/* Main Question Area */}
          <div style={{ flex: 1 }}>
            {q && (
              <div key={q.id} className="glass-hi au" style={{ padding: 48, borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: dm.color }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                  <span style={{ fontSize: 24 }}>{dm.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: dm.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{q.domain}</span>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.textFaint }} />
                  <span style={{ fontSize: 12, color: C.textDim }}>MAX SCORE: {q.max_score} PTS</span>
                </div>

                <h2 style={{ fontSize: 32, fontWeight: 500, color: "#FFFFFF", lineHeight: 1.4, marginBottom: 16 }}>{q.question}</h2>
                <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", marginBottom: 40, lineHeight: 1.6 }}>{q.instructions}</p>

                {/* Input Mapping */}
                <div style={{ minHeight: 180, marginBottom: 40 }}>
                  {q.type === "single_choice" ? (
                    <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {q.options.map((opt, i) => {
                        const sel = ans.raw_answer === opt;
                        return (
                          <div 
                            key={i} 
                            onClick={() => setAns(opt)}
                            className="si"
                            style={{ 
                              padding: "24px 32px", borderRadius: 20, cursor: "pointer", transition: "all 0.2s",
                              background: sel ? dm.bg : 'rgba(255,255,255,0.02)',
                              border: `2px solid ${sel ? dm.color : 'rgba(255,255,255,0.05)'}`,
                              animationDelay: `${i * 0.05}s`,
                              display: 'flex', alignItems: 'center', gap: 16
                            }}
                          >
                             <div style={{ 
                               width: 22, height: 22, borderRadius: '50%', border: `2px solid ${sel ? dm.color : 'rgba(255,255,255,0.2)'}`,
                               display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                             }}>
                               {sel && <div style={{ width: 10, height: 10, borderRadius: '50%', background: dm.color }} />}
                             </div>
                             <span style={{ fontSize: 16, color: sel ? C.white : C.text, fontWeight: sel ? 700 : 400 }}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      <textarea 
                        value={ans.raw_answer} 
                        onChange={e => setAns(e.target.value)}
                        placeholder="Type response here..." 
                        className="field" 
                        style={{ 
                          fontSize: 20, height: 140, resize: "none", padding: 24, 
                          background: 'rgba(255, 255, 255, 0.05)', color: "#FFFFFF",
                          border: `1px solid rgba(255,255,255,0.2)`, marginBottom: 24,
                          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                        }}
                      />
                      
                      {/* Clinical Rating Controls (Bring back self-rating) */}
                      <div className="glass-hi au" style={{ padding: "24px 32px", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "space-between", background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <span style={{ fontSize: 20 }}>⚖️</span>
                           <span style={{ fontSize: 16, color: "#FFFFFF", fontWeight: 700 }}>Assign Clinical Score:</span>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          {[...Array(q.max_score + 1).keys()].map(s => (
                            <button 
                              key={s} 
                              onClick={() => setScore(s)}
                              style={{ 
                                width: 50, height: 50, borderRadius: 12, border: `2px solid ${ans.awarded_score === s ? dm.color : 'rgba(255,255,255,0.2)'}`,
                                background: ans.awarded_score === s ? dm.color : 'rgba(255,255,255,0.05)',
                                color: ans.awarded_score === s ? C.bg : "#FFFFFF",
                                fontSize: 18, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 32, borderTop: `1px solid ${C.border}` }}>
                  <button className="btn-ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
                    ← Previous
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={next}
                    style={{ minWidth: 180, height: 56, fontSize: 16 }}
                  >
                    {current === questions.length - 1 ? (submitting ? "Finalizing..." : "✓ Finish Assessment") : "Next Question →"}
                  </button>
                </div>
              </div>
            )}
            
            <div className="ai d4" style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px dashed ${C.border}` }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <span style={{ fontSize: 13, color: C.textFaint }}>{q?.hint}</span>
            </div>
          </div>

          {/* Right Sidebar - Navigator */}
          <div style={{ width: 280, flexShrink: 0 }}>
             <div className="glass-hi au d2" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Clinical Roadmap</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                   {questions.map((_, i) => {
                     const isCurr = i === current;
                     const isDone = answers[questions[i]?.id]?.awarded_score !== undefined || !!answers[questions[i]?.id]?.raw_answer;
                     return (
                       <div 
                        key={i} 
                        onClick={() => setCurrent(i)}
                        style={{ 
                          height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                          background: isCurr ? C.teal : isDone ? C.tealDim : 'transparent',
                          color: isCurr ? C.bg : isDone ? C.teal : C.textFaint,
                          border: `1px solid ${isCurr ? C.teal : isDone ? C.teal : C.border}`
                        }}
                       >
                         {i + 1}
                       </div>
                     )
                   })}
                </div>
             </div>

             <div className="glass-hi ai d5" style={{ padding: 24, borderRadius: 20 }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Clinical Methodology</h4>
                <p style={{ fontSize: 13, color: C.textFaint, lineHeight: 1.6 }}>
                  This module combines objective clinical metrics with human-in-the-loop validation. 
                  Assign scores based on patient accuracy and response latency.
                </p>
             </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .page-container { font-family: 'Figtree', sans-serif; }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
    </div>
  );
}
