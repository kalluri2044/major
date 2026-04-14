import { useState, useEffect } from "react";
import { AdminLayout, Card, CardTitle, Spinner, Toast, T, CSS_BASE } from "./AdminLayout";
import api from "../../services/api";

function WeightSlider({ label, value, onChange, accentColor, icon, description }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{label}</div>
            <div style={{ fontSize:11, color:T.slateD }}>{description}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, color: accentColor, lineHeight:1 }}>{Math.round(value * 100)}</div>
          <div style={{ fontSize:12, color:T.slateD }}>%</div>
        </div>
      </div>
      <div style={{ position:"relative", height:8, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
        <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${value * 100}%`, background: accentColor, borderRadius:99, transition:"width 0.1s" }} />
        <input type="range" min="0" max="100" step="1" value={Math.round(value * 100)}
          onChange={e => onChange(parseFloat(e.target.value) / 100)}
          style={{ position:"absolute", inset:0, width:"100%", opacity:0, cursor:"pointer", height:"100%", margin:0 }} />
      </div>
    </div>
  );
}

function ModelCard({ id, label, sub, icon, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex:1, padding:"16px", borderRadius:14, cursor:"pointer", textAlign:"center", transition:"all 0.2s", userSelect:"none",
      border:`1.5px solid ${selected?"rgba(0,212,170,0.5)":T.border}`,
      background:selected?"rgba(0,212,170,0.1)":"rgba(255,255,255,0.02)",
    }}>
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:600, color:selected?T.teal:"rgba(255,255,255,0.65)", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:11, color:T.slateD }}>{sub}</div>
      {selected && <div style={{ marginTop:10, width:8, height:8, borderRadius:"50%", background:T.teal, margin:"10px auto 0" }} />}
    </div>
  );
}

function ThresholdRow({ label, value, onChange, accentColor, description }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 0", borderBottom:`1px solid ${T.border}` }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:500, color:"#fff", marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:11, color:T.slateD }}>{description}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <input type="number" min="0" max="100" step="0.5" value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width:72, padding:"8px 10px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, color: accentColor || T.teal, fontWeight:600, textAlign:"center" }} />
        <span style={{ fontSize:12, color:T.slateD }}>%</span>
      </div>
    </div>
  );
}

export default function AdminModelConfig() {
  const [config,   setConfig]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const [w1, setW1] = useState(0.20);
  const [w2, setW2] = useState(0.35);
  const [w3, setW3] = useState(0.45);
  const [model,     setModel]   = useState("ensemble");
  const [mildT,     setMildT]   = useState(51.0);
  const [moderateT, setModT]    = useState(76.0);

  useEffect(() => {
    const s = document.createElement("style"); s.textContent = CSS_BASE; document.head.appendChild(s);
    api.get("/admin/model-config").then(({ data }) => {
      const c = data.config;
      setConfig(c);
      setW1(c.weight_demographic || 0.20); setW2(c.weight_cognitive || 0.35); setW3(c.weight_mri || 0.45);
      setModel(c.active_model || "ensemble");
      setMildT(c.mild_threshold || 51); setModT(c.moderate_threshold || 76);
    }).finally(() => setLoading(false));
    return () => document.head.removeChild(s);
  }, []);

  const handleW1 = (v) => {
    const remaining = 1 - v;
    const ratio = w2 / (w2 + w3) || 0.5;
    setW1(v); setW2(Math.round(remaining * ratio * 1000) / 1000); setW3(Math.round(remaining * (1-ratio) * 1000) / 1000);
  };
  const handleW2 = (v) => {
    const remaining = 1 - v;
    const ratio = w1 / (w1 + w3) || 0.5;
    setW1(Math.round(remaining * ratio * 1000) / 1000); setW2(v); setW3(Math.round(remaining * (1-ratio) * 1000) / 1000);
  };
  const handleW3 = (v) => {
    const remaining = 1 - v;
    const ratio = w1 / (w1 + w2) || 0.5;
    setW1(Math.round(remaining * ratio * 1000) / 1000); setW2(Math.round(remaining * (1-ratio) * 1000) / 1000); setW3(v);
  };

  const total = Math.round((w1 + w2 + w3) * 100);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/model-config", {
        weight_demographic: w1, weight_cognitive: w2, weight_mri: w3,
        active_model: model, mild_threshold: mildT, moderate_threshold: moderateT,
      });
      setToast({ msg: "Model configuration saved successfully.", type: "success" });
    } catch (e) {
      setToast({ msg: e.response?.data?.error || "Save failed.", type: "error" });
    } finally { setSaving(false); }
  };

  const reset = () => { 
    setW1(0.20); setW2(0.35); setW3(0.45); 
    setModel("ensemble"); 
    setMildT(51); setModT(76); 
  };

  if (loading) return <AdminLayout activeId="model" title="Model" subtitle="Configuration">
    <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner /></div>
  </AdminLayout>;

  return (
    <AdminLayout activeId="model" title="Model" subtitle="Configuration">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, maxWidth:1100 }}>

        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <Card>
            <div style={{ marginBottom:20 }}>
              <CardTitle sub="Adjust how much each modality contributes to the final AD risk score">Fusion Weight Configuration</CardTitle>
              <div style={{ padding:"10px 14px", borderRadius:10, background: total===100?"rgba(0,212,170,0.06)":"rgba(255,107,107,0.08)", border:`1px solid ${total===100?"rgba(0,212,170,0.25)":"rgba(255,107,107,0.3)"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:T.slateD }}>Weight total</span>
                  <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:22, color: total===100?T.teal:T.red, lineHeight:1 }}>{total}%</span>
                </div>
                {total !== 100 && <div style={{ fontSize:11, color:T.red, marginTop:4 }}>⚠️ Weights must sum to exactly 100%</div>}
              </div>
            </div>

            <WeightSlider label="Demographics" icon="👤" accentColor="#60a5fa" description="Age, family history, lifestyle factors" value={w1} onChange={handleW1} />
            <WeightSlider label="Cognitive Assessment" icon="🧠" accentColor="#a78bfa" description="MMSE / MoCA normalized score" value={w2} onChange={handleW2} />
            <WeightSlider label="MRI Analysis" icon="🔬" accentColor={T.teal} description="VGG16 + ResNet50 ensemble prediction" value={w3} onChange={handleW3} />

            <div style={{ marginTop:4 }}>
              <div style={{ fontSize:11, color:T.slateD, marginBottom:8 }}>Weight Distribution</div>
              <div style={{ height:12, borderRadius:99, overflow:"hidden", display:"flex" }}>
                <div style={{ width:`${w1*100}%`, background:"#60a5fa", transition:"width 0.1s" }} />
                <div style={{ width:`${w2*100}%`, background:"#a78bfa", transition:"width 0.1s" }} />
                <div style={{ width:`${w3*100}%`, background:T.teal, transition:"width 0.1s" }} />
              </div>
              <div style={{ display:"flex", gap:14, marginTop:8 }}>
                {[["Demographics","#60a5fa",w1],["Cognitive","#a78bfa",w2],["MRI",T.teal,w3]].map(([l,c,v]) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:c }} />
                    <span style={{ fontSize:10, color:T.slateD }}>{l} <strong style={{ color: c }}>{Math.round(v*100)}%</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle sub="AD percentage boundaries for each stage label">Stage Classification Thresholds</CardTitle>
            <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, marginBottom:14 }}>
              <div style={{ display:"flex", gap:0, height:14, borderRadius:99, overflow:"hidden" }}>
                {[
                  { accentColor:"#00d4aa", width:mildT },
                  { accentColor:"#fbbf24", width:moderateT - mildT },
                  { accentColor:"#fb923c", width:100 - moderateT },
                ].map((s, i) => (
                  <div key={i} style={{ width:`${s.width}%`, background:s.accentColor, transition:"width 0.2s" }} />
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:9, color:T.slateD }}>
                <span style={{ color:"#00d4aa" }}>Healthy (0–{mildT}%)</span>
                <span style={{ color:"#fbbf24" }}>Very Mild/Mild ({mildT}–{moderateT}%)</span>
                <span style={{ color:"#fb923c" }}>Moderate ({moderateT}–100%)</span>
              </div>
            </div>
            <ThresholdRow label="Mild Stage Start" accentColor="#fbbf24" description="AD% above this is Very Mild / MCI" value={mildT} onChange={setMildT} />
            <ThresholdRow label="Moderate Stage Start" accentColor="#fb923c" description="AD% above this is Moderate Alzheimer's" value={moderateT} onChange={setModT} />
          </Card>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <Card>
            <CardTitle sub="Choose which CNN model(s) to use for MRI prediction">Active Model Selection</CardTitle>
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              <ModelCard id="vgg16" label="VGG16 Only" sub="Texture-focused" icon="🔷" selected={model==="vgg16"} onClick={() => setModel("vgg16")} />
              <ModelCard id="resnet50" label="ResNet50 Only" sub="Structure-focused" icon="🔶" selected={model==="resnet50"} onClick={() => setModel("resnet50")} />
              <ModelCard id="ensemble" label="Ensemble" sub="Soft-vote 45%+55%" icon="⚡" selected={model==="ensemble"} onClick={() => setModel("ensemble")} />
            </div>
            <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:10, color:T.slateD, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>Selected: {model.toUpperCase()}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>
                {model === "ensemble" && "Soft-voting ensemble: VGG16 (45%) + ResNet50 (55%). Highest accuracy — recommended for production use."}
                {model === "vgg16" && "VGG16 alone. Excels at texture-level pattern recognition. Faster inference but lower accuracy than ensemble."}
                {model === "resnet50" && "ResNet50 alone. Better structural feature extraction with skip connections. Good balance of speed and accuracy."}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle sub="How the current settings would classify a patient">Score Preview</CardTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Healthy",           ad:20, demo:15, cog:80, mri:10 },
                { label:"Very Mild (MCI)",   ad:38, demo:35, cog:55, mri:35 },
                { label:"Mild Alzheimer's",  ad:63, demo:55, cog:30, mri:65 },
                { label:"Moderate",          ad:85, demo:70, cog:15, mri:90 },
              ].map(({ label, demo, cog, mri }) => {
                const ad = Math.round(w1*demo + w2*(100-cog) + w3*mri);
                const statusColor = ad >= moderateT ? "#ff6b6b" : ad >= mildT ? "#fb923c" : ad >= 25 ? "#fbbf24" : "#00d4aa";
                return (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>{label}</div>
                      <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${ad}%`, background:statusColor, borderRadius:99, transition:"width 0.3s" }} />
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:20, color: statusColor, lineHeight:1, minWidth:42, textAlign:"right" }}>{ad}%</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:14, fontSize:11, color:T.slateD, lineHeight:1.6 }}>
              Preview uses illustrative inputs — actual scores depend on real patient data.
            </div>
          </Card>

          <div style={{ display:"flex", gap:12 }}>
            <button onClick={reset} style={{ flex:1, padding:"13px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:12, color:"rgba(255,255,255,0.5)", fontSize:14, cursor:"pointer" }}>
              ↩ Reset Defaults
            </button>
            <button onClick={save} disabled={saving || total !== 100} style={{
              flex:2, padding:"13px", background: total===100 ? T.teal : "rgba(255,255,255,0.05)",
              color: total===100 ? T.navy : "rgba(255,255,255,0.3)",
              border:"none", borderRadius:12, fontSize:14, fontWeight:600,
              cursor: total===100 ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              {saving ? <><div style={{ width:14, height:14, border:"2px solid rgba(0,0,0,0.2)", borderTopColor:T.navy, borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> Saving…</> : "✓ Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
