import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import AssessmentSidebar from "../components/AssessmentSidebar";

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
  const [fusing, setFusing] = useState(false);

  // ── Auto-resolve session on mount ───────────────────────────────────────────
  const resolveSession = useCallback(async () => {
    if (urlSessionId) { setSessionId(urlSessionId); setSessionLoading(false); return; }
    setSessionLoading(true); setSessionError("");
    try {
      const { data } = await api.post("/user/sessions");
      const sid = data.session?.id;
      if (sid) {
        setSessionId(String(sid));
        window.history.replaceState(null, "", `/mri-upload?session_id=${sid}`);
      } else {
        setSessionError("Could not create a session. Please go to the dashboard.");
      }
    } catch (e) {
      setSessionError(e.response?.data?.error || "Failed to initialize session.");
    } finally {
      setSessionLoading(false);
    }
  }, [urlSessionId]);

  useEffect(() => { resolveSession(); }, [resolveSession]);

  const pickFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null); setError("");
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = (e) => setPreview(e.target.result);
      r.readAsDataURL(f);
    } else { setPreview(null); }
  };

  const submit = async () => {
    if (!file) { setError("Please select an MRI file first."); return; }
    if (!sessionId) { setError("No active session. Please start a new assessment."); return; }
    setLoading(true); setError("");
    const fd = new FormData(); fd.append("mri_file", file); fd.append("session_id", sessionId);
    try {
      const { data } = await api.post("/mri/upload", fd, { headers:{ "Content-Type":"multipart/form-data" } });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || "Upload failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleFusion = async () => {
    if (!sessionId) return;
    setFusing(true);
    try {
      await api.post(`/fusion/compute/${sessionId}`);
      navigate(`/results/${sessionId}`);
    } catch (e) {
      const msg = e.response?.data?.error || "";
      if (e.response?.status === 409 || msg.includes("already completed")) {
        navigate(`/results/${sessionId}`);
      } else if (msg.includes("missing")) {
        setError(`Fusion failed: ${msg}. Complete previous steps.`);
        setFusing(false);
      } else { navigate(`/dashboard`); }
    }
  };

  if (sessionLoading) {
    return (
      <div className="page-container">
        <AssessmentSidebar activeStep="mri" sessionId={sessionId} />
        <div className="main-content" style={{ alignItems:"center", justifyContent:"center" }}>
          <div className="spinner" style={{ marginBottom:16 }} />
          <div style={{ color:"var(--text-secondary)" }}>Initializing session…</div>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="page-container">
        <AssessmentSidebar activeStep="mri" sessionId={sessionId} />
        <div className="main-content" style={{ alignItems:"center", justifyContent:"center", padding:40 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>⚠️</div>
          <h2 className="serif" style={{ fontSize:36, marginBottom:16 }}>Session Required</h2>
          <p style={{ color:"var(--text-secondary)", maxWidth:400, textAlign:"center", lineHeight:1.6, marginBottom:24 }}>
            {sessionError}
          </p>
          <div style={{ display:"flex", gap:16 }}>
            <button className="btn-secondary" onClick={resolveSession}>Try Again</button>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>Go to Dashboard →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <AssessmentSidebar activeStep="mri" sessionId={sessionId} />

      <div className="main-content">
        <div style={{ padding:"48px", maxWidth:1100, margin:"0 auto", width:"100%" }}>
          <div className="animate-fade-up" style={{ marginBottom:48 }}>
            <div className="badge badge-blue" style={{ marginBottom:12 }}>Step 3 of 3 · Session #{sessionId}</div>
            <h1 style={{ fontSize:42, marginBottom:8 }}>MRI <span className="serif" style={{ color:"var(--accent-blue)", fontStyle:"italic" }}>Analysis</span></h1>
            <p style={{ color:"var(--text-secondary)", fontSize:15, maxWidth:500, lineHeight:1.6 }}>
              Upload a cranial MRI scan. Our VGG16 + ResNet50 neural network ensemble will extract spatial features. Your final result will be compiled after this step.
            </p>
          </div>

          <div style={{ display:"flex", gap:40 }}>
            <div style={{ flex:"0 0 450px" }} className="animate-fade-up delay-100">
              
              <div className="glass-panel" 
                style={{ padding:28, borderColor: drag ? "var(--accent-blue)" : "var(--border-subtle)", transition:"all 0.2s" }}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
              >
                <div style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:8 }}>Upload Scan</div>
                <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:20, lineHeight:1.6 }}>Supported formats: JPEG, PNG, DICOM (.dcm), NIfTI (.nii)</div>
                
                <div onClick={() => fileRef.current?.click()}
                  style={{ border:`2px dashed ${drag ? "var(--accent-blue)" : "var(--border-subtle)"}`, background: drag ? "rgba(59, 130, 246, 0.05)" : "rgba(255,255,255,0.02)", borderRadius:"var(--radius-lg)", minHeight:220, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.2s", position:"relative", overflow:"hidden" }}>
                  {preview ? (
                    <>
                      <img src={preview} alt="preview" style={{ maxWidth:"100%", maxHeight:220, objectFit:"contain", display:"block" }} />
                      <div style={{ position:"absolute", left:0, right:0, height:3, background:"linear-gradient(90deg, transparent, var(--accent-blue), transparent)", animation:"scanline 2.5s linear infinite", top:"50%", boxShadow:"0 0 10px var(--accent-blue)" }} />
                    </>
                  ) : (
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:48, marginBottom:16, opacity:0.8 }}>🧠</div>
                      <div style={{ fontSize:15, color:"var(--text-secondary)", lineHeight:1.5 }}>Drag & drop or <span style={{ color:"var(--accent-blue)", fontWeight:500 }}>browse file</span></div>
                      <div style={{ fontSize:12, color:"var(--text-tertiary)", marginTop:8 }}>Max file size 50MB</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" style={{ display:"none" }} accept=".jpg,.jpeg,.png,.dcm,.nii,.gz" onChange={e => pickFile(e.target.files[0])} />

                {file && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:20, padding:"12px 16px", background:"rgba(59, 130, 246, 0.08)", borderRadius:"var(--radius-md)", border:"1px solid rgba(59, 130, 246, 0.2)" }}>
                    <span style={{ fontSize:18 }}>📎</span>
                    <span style={{ fontSize:14, color:"var(--text-primary)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
                    <span style={{ fontSize:12, color:"var(--text-tertiary)", flexShrink:0 }}>{(file.size / 1024).toFixed(0)} KB</span>
                    <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); setError(""); }} style={{ background:"none", border:"none", color:"var(--text-tertiary)", cursor:"pointer", fontSize:16, padding:4 }}>✕</button>
                  </div>
                )}

                {error && <div style={{ background:"rgba(239, 68, 68, 0.1)", border:"1px solid rgba(239, 68, 68, 0.3)", borderRadius:"var(--radius-md)", padding:"14px", color:"var(--accent-red)", fontSize:14, marginTop:16 }}>{error}</div>}

                <button className={`btn-primary ${!file || loading ? "" : ""}`} disabled={!file || loading} onClick={submit} style={{ width:"100%", marginTop:24, background:"var(--accent-blue)", padding:"16px", fontSize:16 }}>
                  {loading ? (
                    <><div className="spinner" style={{ borderColor:"rgba(255,255,255,0.2)", borderTopColor:"#fff", width:18, height:18 }} /> Running AI Processing…</>
                  ) : "🔬 Run CNN Extraction"}
                </button>
              </div>
            </div>

            <div style={{ flex:1 }} className="animate-fade-up delay-200">
              {!result ? (
                <div className="glass-panel" style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400 }}>
                  <div style={{ fontSize:56, marginBottom:20, opacity:0.1 }}>🧬</div>
                  <div style={{ fontSize:18, fontWeight:500, color:"var(--text-secondary)", marginBottom:10 }}>Awaiting Image Data</div>
                  <p style={{ fontSize:14, color:"var(--text-tertiary)", textAlign:"center", maxWidth:280, lineHeight:1.6 }}>
                    Upload your MRI scan to initiate the deep learning pipeline. You will be able to compute your final AD risk score afterwards.
                  </p>
                </div>
              ) : (
                <div className="glass-panel animate-fade-in" style={{ height:"100%", padding:"48px", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", background:"linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)", borderTop:"3px solid var(--accent-blue)" }}>
                  <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(59, 130, 246, 0.1)", border:"1px solid rgba(59, 130, 246, 0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, marginBottom:24, color:"var(--accent-blue)" }}>✓</div>
                  <h2 style={{ fontSize:26, marginBottom:16 }}>MRI Successfully Processed</h2>
                  <p style={{ fontSize:15, color:"var(--text-secondary)", lineHeight:1.7, marginBottom:32, maxWidth:360 }}>
                    Neural network extraction is complete. The system is ready to fuse demographics, cognitive, and MRI data to compute your final Alzheimer's diagnostic assessment.
                  </p>
                  
                  <div style={{ padding:"20px", background:"rgba(255,255,255,0.03)", borderRadius:"var(--radius-md)", width:"100%", textAlign:"left", marginBottom:40 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Pipeline Status</div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:14, color:"var(--text-secondary)" }}>Image Normalization</span>
                      <span style={{ fontSize:14, color:"var(--accent-teal)", fontWeight:500 }}>Completed</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:14, color:"var(--text-secondary)" }}>VGG16 Feature Extraction</span>
                      <span style={{ fontSize:14, color:"var(--accent-teal)", fontWeight:500 }}>Completed</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:14, color:"var(--text-secondary)" }}>ResNet50 Deep Layers</span>
                      <span style={{ fontSize:14, color:"var(--accent-teal)", fontWeight:500 }}>Completed</span>
                    </div>
                  </div>

                  <button className="btn-primary" disabled={fusing} onClick={handleFusion} style={{ width:"100%", background:"var(--accent-purple)", padding:"18px", fontSize:16, boxShadow:"var(--shadow-glow)" }}>
                    {fusing ? (
                      <><div className="spinner" style={{ borderColor:"rgba(255,255,255,0.2)", borderTopColor:"#fff", width:18, height:18 }} /> Fusing Multi-Modal Data…</>
                    ) : "Compute Final Results →"}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
