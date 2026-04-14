import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const T = {
  navy: "#0a1628", teal: "#00d4aa",
  slate: "rgba(255,255,255,0.45)", slateD: "rgba(255,255,255,0.22)",
  border: "rgba(255,255,255,0.08)", red: "#ff6b6b",
};

const STAGE_META = {
  "Non-Demented":       { color:"#00d4aa", bg:"rgba(0,212,170,0.1)",  risk:10, grade:"A" },
  "Very Mild Demented": { color:"#fbbf24", bg:"rgba(251,191,36,0.1)", risk:35, grade:"B" },
  "Mild Demented":      { color:"#fb923c", bg:"rgba(251,146,60,0.1)", risk:65, grade:"C" },
  "Moderate Demented":  { color:"#ff6b6b", bg:"rgba(255,107,107,0.1)",risk:90, grade:"D" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#0a1628;color:#fff;-webkit-font-smoothing:antialiased;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes scanline{0%{top:-10%}100%{top:110%}}
@keyframes pulse{0%,100%{opacity:0.7}50%{opacity:1}}
.au{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.1) both}
.ai{animation:fadeIn .35s ease both}
.d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
`;

function SideNav({ sessionId }) {
  return (
    <div style={{ width:220, flexShrink:0, background:"rgba(0,0,0,0.3)", borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", padding:"28px 0", position:"sticky", top:0, height:"100vh" }}>
      <div style={{ padding:"0 22px 24px", borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:T.teal, color:T.navy,
            fontFamily:"'Instrument Serif',serif", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>N</div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>NeuroScan</div>
            <div style={{ fontSize:10, color:T.slateD }}>AI Assessment</div>
          </div>
        </div>
      </div>
      {[
        ["👤","Demographics",   `/demographics${sessionId?`?session_id=${sessionId}`:""}`,   "done"],
        ["🧠","Cognitive Test", `/cognitive-test${sessionId?`?session_id=${sessionId}`:""}`, "done"],
        ["🔬","MRI Upload",     `/mri-upload${sessionId?`?session_id=${sessionId}`:""}`,     "active"],
        ["📊","Results",        "/dashboard",                                                 ""],
      ].map(([ic, lb, hr, st], i) => (
        <a key={lb} href={hr} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
          margin:"0 8px 2px", borderRadius:10, textDecoration:"none",
          background: st === "active" ? "rgba(0,212,170,0.1)" : "transparent" }}>
          <div style={{ width:28, height:28, borderRadius:8, fontSize:12, fontWeight:600,
            display:"flex", alignItems:"center", justifyContent:"center",
            background: st==="done"?"rgba(0,212,170,0.15)": st==="active"?T.teal:"rgba(255,255,255,0.06)",
            color: st==="done"?T.teal: st==="active"?T.navy:"rgba(255,255,255,0.3)" }}>
            {st==="done" ? "✓" : i+1}
          </div>
          <span style={{ fontSize:13, fontWeight:500,
            color: st==="active"?T.teal: st==="done"?"rgba(0,212,170,0.6)":"rgba(255,255,255,0.4)" }}>{lb}</span>
          {st==="active" && <div style={{ width:5, height:5, borderRadius:"50%", background:T.teal, marginLeft:"auto" }} />}
        </a>
      ))}
    </div>
  );
}

function AnimatedBar({ value, color, delay=0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), delay + 200);
    return () => clearTimeout(t);
  }, [value, delay]);
  return <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:99, transition:"width 0.8s cubic-bezier(.22,.68,0,1.1)" }} />;
}

export default function MRIUpload() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlSessionId = params.get("session_id");

  const fileRef = useRef(null);
  const [sessionId, setSessionId]       = useState(urlSessionId || null);
  const [sessionLoading, setSessionLoading] = useState(!urlSessionId);
  const [sessionError, setSessionError] = useState("");
  const [file, setFile]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [drag, setDrag]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState("");

  // ── Inject CSS ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // ── Auto-resolve session on mount ───────────────────────────────────────────
  const resolveSession = useCallback(async () => {
    if (urlSessionId) { setSessionId(urlSessionId); setSessionLoading(false); return; }
    setSessionLoading(true);
    setSessionError("");
    try {
      // Try to find or resume an existing incomplete session
      const { data } = await api.post("/user/sessions");
      const sid = data.session?.id;
      if (sid) {
        setSessionId(String(sid));
        // Update URL without reloading
        window.history.replaceState(null, "", `/mri-upload?session_id=${sid}`);
      } else {
        setSessionError("Could not create a session. Please go to the dashboard.");
      }
    } catch (e) {
      setSessionError(e.response?.data?.error || "Failed to initialise session.");
    } finally {
      setSessionLoading(false);
    }
  }, [urlSessionId]);

  useEffect(() => { resolveSession(); }, [resolveSession]);

  // ── File helpers ────────────────────────────────────────────────────────────
  const pickFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null); setError("");
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = (e) => setPreview(e.target.result);
      r.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!file)      { setError("Please select an MRI file first."); return; }
    if (!sessionId) { setError("No active session. Please go to Dashboard and start a new assessment."); return; }
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("mri_file", file);
    fd.append("session_id", sessionId);
    try {
      const { data } = await api.post("/mri/upload", fd, { headers:{ "Content-Type":"multipart/form-data" } });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [fusing, setFusing] = useState(false);

  const handleFusion = async () => {
    if (!sessionId) return;
    setFusing(true);
    try {
      await api.post(`/fusion/compute/${sessionId}`);
      navigate(`/results/${sessionId}`);
    } catch (e) {
      const msg = e.response?.data?.error || "";
      // If already computed, just navigate to results
      if (e.response?.status === 409 || msg.includes("already completed")) {
        navigate(`/results/${sessionId}`);
      } else if (msg.includes("missing")) {
        setError(`Fusion failed: ${msg}. Please ensure Demographics and Cognitive Assessment are complete.`);
        setFusing(false);
      } else {
        navigate(`/dashboard`);
      }
    }
  };

  const stageName = result?.stage_display || "";
  const sm = STAGE_META[stageName] || STAGE_META["Non-Demented"];

  // ── Loading state ───────────────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div style={{ display:"flex", minHeight:"100vh", background:T.navy }}>
        <SideNav sessionId={null} />
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
          <div style={{ width:32, height:32, border:"3px solid rgba(0,212,170,0.2)", borderTopColor:T.teal,
            borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          <div style={{ fontSize:14, color:T.slateD }}>Initialising session…</div>
        </div>
      </div>
    );
  }

  // ── Session error state ─────────────────────────────────────────────────────
  if (sessionError) {
    return (
      <div style={{ display:"flex", minHeight:"100vh", background:T.navy }}>
        <SideNav sessionId={null} />
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20, padding:40 }}>
          <div style={{ fontSize:52, marginBottom:4 }}>⚠️</div>
          <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, color:"#fff", textAlign:"center" }}>Session Required</div>
          <div style={{ fontSize:14, color:T.slateD, textAlign:"center", lineHeight:1.7, maxWidth:360 }}>{sessionError}</div>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button onClick={resolveSession}
              style={{ padding:"11px 22px", background:"rgba(0,212,170,0.12)", border:"1px solid rgba(0,212,170,0.3)",
                borderRadius:10, color:T.teal, fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Try Again
            </button>
            <button onClick={() => navigate("/dashboard")}
              style={{ padding:"11px 22px", background:T.teal, border:"none",
                borderRadius:10, color:T.navy, fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.navy }}>
      <SideNav sessionId={sessionId} />

      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ padding:"36px 40px 0" }}>
          <div className="au">
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", color:T.teal, marginBottom:6, textTransform:"uppercase" }}>
              Step 3 of 3 · Session #{sessionId}
            </div>
            <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:38, color:"#fff", fontWeight:400, lineHeight:1.1, marginBottom:8 }}>
              MRI<br /><em style={{ color:T.teal }}>Analysis</em>
            </h1>
            <p style={{ fontSize:13, color:T.slate, maxWidth:420, lineHeight:1.6 }}>
              Upload a brain MRI scan. The VGG16 + ResNet50 ensemble will classify it into one of four Alzheimer's severity stages.
            </p>
          </div>
        </div>

        <div style={{ flex:1, display:"flex", gap:20, padding:"24px 40px 40px" }}>

          {/* ── Left: upload panel ─────────────────────────────────────── */}
          <div style={{ flex:"0 0 360px", display:"flex", flexDirection:"column", gap:16 }}>

            {/* Drop zone card */}
            <div className="au"
              style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${drag?"rgba(0,212,170,0.45)":T.border}`,
                borderRadius:20, padding:24, transition:"border-color 0.2s" }}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
            >
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.07em", color:T.slateD, textTransform:"uppercase", marginBottom:6 }}>
                Upload MRI Scan
              </div>
              <div style={{ fontSize:11, color:T.slateD, marginBottom:16, lineHeight:1.6 }}>
                Supported: JPEG · PNG · DICOM (.dcm) · NIfTI (.nii/.nii.gz)
              </div>

              {/* Preview / drop area */}
              <div onClick={() => fileRef.current?.click()}
                style={{ border:`1.5px dashed ${drag?"rgba(0,212,170,0.5)":"rgba(255,255,255,0.12)"}`,
                  borderRadius:14, minHeight:180, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", cursor:"pointer",
                  transition:"all 0.2s", background:drag?"rgba(0,212,170,0.04)":"transparent",
                  overflow:"hidden", position:"relative" }}>
                {preview ? (
                  <>
                    <img src={preview} alt="MRI preview"
                      style={{ maxWidth:"100%", maxHeight:180, objectFit:"contain", display:"block" }} />
                    <div style={{ position:"absolute", left:0, right:0, height:2,
                      background:"linear-gradient(90deg,transparent,rgba(0,212,170,0.6),transparent)",
                      animation:"scanline 2s linear infinite", top:"50%" }} />
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:40, marginBottom:12, opacity:0.3 }}>🧠</div>
                    <div style={{ fontSize:13, color:T.slateD, textAlign:"center", lineHeight:1.5 }}>
                      Drag & drop or<br />
                      <span style={{ color:T.teal }}>click to browse</span>
                    </div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:6 }}>Max 50 MB</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" style={{ display:"none" }}
                accept=".jpg,.jpeg,.png,.dcm,.nii,.gz"
                onChange={e => pickFile(e.target.files[0])} />

              {/* Selected file chip */}
              {file && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, padding:"9px 12px",
                  background:"rgba(0,212,170,0.08)", borderRadius:9, border:"1px solid rgba(0,212,170,0.2)" }}>
                  <span style={{ fontSize:14 }}>📎</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)", flex:1,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
                  <span style={{ fontSize:11, color:T.slateD, flexShrink:0 }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); setError(""); }}
                    style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:14, padding:0 }}>✕</button>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div style={{ background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.25)",
                  borderRadius:9, padding:"10px 12px", color:T.red, fontSize:12, marginTop:10, lineHeight:1.5 }}>
                  {error}
                </div>
              )}

              {/* Run button */}
              <button onClick={submit} disabled={loading || !file}
                style={{ width:"100%", marginTop:14, padding:"13px",
                  background: loading||!file ? "rgba(255,255,255,0.06)" : T.teal,
                  color: loading||!file ? "rgba(255,255,255,0.3)" : T.navy,
                  border:"none", borderRadius:12, fontSize:14, fontWeight:600,
                  cursor: loading||!file ? "not-allowed" : "pointer",
                  transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? (
                  <>
                    <div style={{ width:16, height:16, border:"2px solid rgba(0,212,170,0.3)",
                      borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                    Analysing with VGG16 + ResNet50…
                  </>
                ) : "🔬 Run AI Analysis"}
              </button>

              {result?.mock && (
                <div style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)",
                  borderRadius:8, padding:"9px 12px", fontSize:11, color:"#fbbf24", marginTop:10 }}>
                  ⚠️ Demo mode — CNN models not trained yet. Showing simulated results.
                </div>
              )}
            </div>

            {/* Ensemble info card */}
            <div className="au d1" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
              <div style={{ fontSize:11, fontWeight:600, color:T.slateD, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:12 }}>
                Ensemble Architecture
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ flex:1, padding:10, borderRadius:10, background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.2)", textAlign:"center" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#60a5fa", marginBottom:2 }}>VGG16</div>
                  <div style={{ fontSize:10, color:T.slateD }}>Texture features</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginTop:4 }}>45%</div>
                </div>
                <div style={{ fontSize:16, color:T.slateD, fontWeight:300 }}>+</div>
                <div style={{ flex:1, padding:10, borderRadius:10, background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.2)", textAlign:"center" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#a78bfa", marginBottom:2 }}>ResNet50</div>
                  <div style={{ fontSize:10, color:T.slateD }}>Deep structure</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginTop:4 }}>55%</div>
                </div>
              </div>
              <div style={{ fontSize:11, color:T.slateD, lineHeight:1.6 }}>
                Fine-tuned on 6,400 MRI images across 4 Alzheimer's severity stages. Soft-voting ensemble for maximum accuracy.
              </div>
            </div>
          </div>

          {/* ── Right: results panel ───────────────────────────────────── */}
          <div style={{ flex:1 }}>
            {!result ? (
              <div className="ai" style={{ height:"100%", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                background:"rgba(255,255,255,0.02)", border:`1px solid ${T.border}`,
                borderRadius:20, minHeight:400 }}>
                <div style={{ fontSize:52, marginBottom:16, opacity:0.15 }}>🧬</div>
                <div style={{ fontSize:17, fontWeight:500, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>
                  No results yet
                </div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.2)", textAlign:"center", lineHeight:1.6, maxWidth:260 }}>
                  Upload an MRI scan and click Run Analysis to see the AI prediction
                </div>
              </div>
            ) : (
              <div className="au">

                {/* Stage card */}
                <div style={{ background:sm.bg, border:`1.5px solid ${sm.color}44`, borderRadius:20, padding:24, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", color:T.slateD, textTransform:"uppercase", marginBottom:6 }}>
                        Ensemble Prediction
                      </div>
                      <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:30, color:"#fff", fontWeight:400, marginBottom:6 }}>
                        {stageName}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ padding:"4px 12px", borderRadius:99, background:`${sm.color}22`,
                          border:`1px solid ${sm.color}55`, color:sm.color, fontSize:12, fontWeight:600 }}>
                          {(result.scan.ensemble_confidence * 100).toFixed(1)}% confidence
                        </span>
                        <span style={{ fontSize:12, color:T.slateD }}>Risk: {sm.risk}/100</span>
                      </div>
                    </div>
                    <div style={{ width:64, height:64, borderRadius:16, background:`${sm.color}22`,
                      border:`1px solid ${sm.color}44`, display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"'Instrument Serif',serif", fontSize:32, color:sm.color }}>
                      {sm.grade}
                    </div>
                  </div>
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.slateD, marginBottom:7 }}>
                      <span>MRI Risk Score</span>
                      <span style={{ color:"rgba(255,255,255,0.65)", fontWeight:500 }}>{sm.risk}/100</span>
                    </div>
                    <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:99, overflow:"hidden" }}>
                      <AnimatedBar value={sm.risk} color={sm.color} />
                    </div>
                  </div>
                </div>

                {/* Model breakdown */}
                <div className="d1" style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`,
                  borderRadius:16, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.slateD, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:14 }}>
                    Model Breakdown
                  </div>
                  {[
                    { name:"VGG16",   pred:result.scan.vgg16_prediction,   conf:result.scan.vgg16_confidence,   color:"#60a5fa", weight:"45%" },
                    { name:"ResNet50",pred:result.scan.resnet50_prediction, conf:result.scan.resnet50_confidence,color:"#a78bfa", weight:"55%" },
                  ].map(m => (
                    <div key={m.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"11px 0", borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:m.color, flexShrink:0 }} />
                        <span style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.8)" }}>{m.name}</span>
                        <span style={{ fontSize:11, color:T.slateD }}>({m.weight})</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:12, color:T.slateD }}>{m.pred}</span>
                        <span style={{ padding:"3px 9px", borderRadius:6, background:`${m.color}22`, color:m.color, fontSize:12, fontWeight:600 }}>
                          {(m.conf * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <div style={{ paddingTop:11, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)" }}>Ensemble</span>
                    <span style={{ padding:"3px 9px", borderRadius:6, background:`${sm.color}22`, color:sm.color, fontSize:12, fontWeight:600 }}>
                      {(result.scan.ensemble_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Probability distribution */}
                <div className="d2" style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`,
                  borderRadius:16, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.slateD, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:16 }}>
                    Stage Probability Distribution
                  </div>
                  {Object.entries(result.all_probabilities || {}).sort((a,b) => b[1]-a[1]).map(([label, prob], i) => {
                    const meta = STAGE_META[label] || { color:T.teal };
                    const isTop = label === stageName;
                    return (
                      <div key={label} style={{ marginBottom:11 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                          <span style={{ fontSize:12, color:isTop?"#fff":"rgba(255,255,255,0.45)", fontWeight:isTop?500:400 }}>{label}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:isTop?meta.color:"rgba(255,255,255,0.4)" }}>{(prob*100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:99, overflow:"hidden" }}>
                          <AnimatedBar value={prob*100} color={isTop?meta.color:"rgba(255,255,255,0.15)"} delay={i*100} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <button onClick={handleFusion} disabled={fusing}
                  style={{ display:"block", width:"100%", padding:14, background:fusing?"rgba(0,212,170,0.6)":T.teal,
                    color:T.navy, border:"none", borderRadius:12, fontSize:14, fontWeight:700,
                    cursor:fusing?"not-allowed":"pointer", display:"flex", alignItems:"center",
                    justifyContent:"center", gap:8 }}>
                  {fusing ? (
                    <>
                      <div style={{ width:16, height:16, border:"2px solid rgba(10,22,40,0.3)",
                        borderTopColor:T.navy, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                      Computing AD Score…
                    </>
                  ) : "Compute Final AD Score & View Results →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
