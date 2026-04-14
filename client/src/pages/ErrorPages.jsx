import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GLOBAL_CSS, C } from "../components/DesignSystem";

export function NotFound() {
  const navigate = useNavigate();
  useEffect(() => {
    const s = document.createElement("style"); s.textContent = GLOBAL_CSS; document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(120,160,255,0.05) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translateX(-50%)", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,rgba(0,212,170,0.06) 0%,transparent 70%)`, filter:"blur(40px)", pointerEvents:"none" }} />
      <div style={{ textAlign:"center", position:"relative", zIndex:1 }}>
        <div className="badge badge-teal au" style={{ display:"inline-flex", marginBottom:24 }}>404 — Page Not Found</div>
        <h1 className="au d1" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(48px,8vw,88px)", fontWeight:300, color:C.white, lineHeight:1.05, marginBottom:20 }}>
          This page<br /><em style={{ color:C.teal }}>doesn't exist.</em>
        </h1>
        <p className="au d2" style={{ fontSize:16, color:C.textDim, lineHeight:1.8, maxWidth:380, margin:"0 auto 40px" }}>
          The page you're looking for has been moved, deleted, or never existed.
        </p>
        <div className="au d3" style={{ display:"flex", gap:14, justifyContent:"center" }}>
          <button className="btn-ghost" onClick={() => navigate(-1)} style={{ padding:"12px 24px" }}>← Go Back</button>
          <button className="btn-primary" onClick={() => navigate("/dashboard")} style={{ padding:"12px 28px" }}>Go to Dashboard →</button>
        </div>
      </div>
    </div>
  );
}

export function ErrorPage({ title="Something went wrong", message="An unexpected error occurred.", onRetry }) {
  const navigate = useNavigate();
  useEffect(() => {
    const s = document.createElement("style"); s.textContent = GLOBAL_CSS; document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:20 }}>⚠️</div>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:300, color:C.white, marginBottom:12 }}>{title}</h2>
        <p style={{ fontSize:15, color:C.textDim, marginBottom:32 }}>{message}</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          {onRetry && <button className="btn-primary" onClick={onRetry}>Try Again</button>}
          <button className="btn-ghost" onClick={() => navigate("/dashboard")}>Dashboard</button>
        </div>
      </div>
    </div>
  );
}
