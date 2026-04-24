import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { GLOBAL_CSS, C } from "../../components/DesignSystem";

export { C, GLOBAL_CSS };

export const T = C;
export const getStage = (label) => {
  const map = {
    'Non-demented':      { c:'#00D4AA', bg:'rgba(0,212,170,0.08)',  g:'A', short:'Healthy',   risk:10 },
    'Very mild demented': { c:'#F5B942', bg:'rgba(245,185,66,0.08)', g:'B', short:'Very Mild', risk:35 },
    'Mild demented':     { c:'#FCA549', bg:'rgba(252,165,73,0.08)', g:'C', short:'Mild',      risk:65 },
    'Moderate demented': { c:'#FF4D6D', bg:'rgba(255,77,109,0.08)',  g:'D', short:'Moderate',  risk:90 },
  };
  return map[label] || map['Non-demented'];
};

export const CSS_BASE = GLOBAL_CSS + `
.admin-layout{display:flex;min-height:100vh;background:${C.bg};}
.admin-main{flex:1;overflow-y:auto;padding:36px;max-width:100%;}
.admin-sn{width:220px;flex-shrink:0;background:rgba(4,12,26,0.95);border-right:1px solid ${C.border};display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;}
.admin-card{background:rgba(7,18,32,0.55);border:1px solid ${C.border};border-radius:20px;padding:22px;transition:border-color .2s;}
.admin-card:hover{border-color:${C.borderHi};}
@media(max-width:900px){.admin-sn{display:none;}.admin-main{padding:20px;}}
`;

export const Spinner = () => (
  <div className="spin" style={{ width:28,height:28,border:`3px solid rgba(0,212,170,0.15)`,borderTopColor:C.teal,borderRadius:"50%" }} />
);

export const KpiCard = ({ label, value, sub, accentColor, icon, trend }) => (
  <div className="admin-card">
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
      <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:C.textDim }}>{label}</div>
      <span style={{ fontSize:18 }}>{icon}</span>
    </div>
    <div style={{ fontFamily:"'Fraunces',serif",fontSize:34,fontWeight:300,color:accentColor||C.white,lineHeight:1,marginBottom:6 }}>{value}</div>
    <div style={{ fontSize:12,color:C.textFaint }}>{sub}</div>
    {trend !== undefined && (
      <div style={{ fontSize:11,color:trend>0?C.coral:trend<0?C.teal:C.textFaint,marginTop:6 }}>
        {trend>0?"↑":trend<0?"↓":"→"} {Math.abs(trend).toFixed(1)}% vs prev
      </div>
    )}
  </div>
);

export const Card = ({ children, style }) => (
  <div className="admin-card" style={style}>{children}</div>
);

export const CardTitle = ({ children, sub }) => (
  <div style={{ marginBottom:18 }}>
    <div style={{ fontWeight:700,color:C.white,fontSize:15 }}>{children}</div>
    {sub && <div style={{ fontSize:12,color:C.textDim,marginTop:3 }}>{sub}</div>}
  </div>
);

export const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const cls = type === "error" ? "toast-error" : type === "info" ? "toast-info" : "toast-success";
  return <div className={`toast ${cls}`}><span>{type==="error"?"⚠️":"✓"}</span>{msg}<button onClick={onClose} style={{marginLeft:"auto",background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:16}}>✕</button></div>;
 };
const NAV = [
  { id:"overview",   label:"Overview",       icon:"📊", path:"/admin",            roles:["admin","doctor"] },
  { id:"patients",   label:"Patients",       icon:"👥", path:"/admin/patients",   roles:["admin","doctor"] },
  { id:"flagged",    label:"High Risk",       icon:"⚠️", path:"/admin/flagged",    roles:["admin","doctor"] },
  { id:"staff",      label:"Staff",           icon:"👨‍⚕️", path:"/admin/staff",      roles:["admin"] },
  { id:"model",      label:"Model Config",   icon:"⚙️", path:"/admin/model-config",roles:["admin"] },
];

export function AdminLayout({ children, activeId, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [search, setSearch]   = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const s = document.createElement("style"); s.textContent = CSS_BASE; document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const doSearch = async (q) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    try { const { data } = await api.get(`/admin/search?q=${encodeURIComponent(q)}`); setResults(data.results || []); }
    catch { setResults([]); }
  };

  return (
    <div className="admin-layout">
      <div className="admin-sn">
        <div style={{ padding:"22px 16px 18px", borderBottom:`1px solid ${C.border}`, marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${C.teal},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:16, color:"#040C1A", fontWeight:600 }}>N</div>
            <div><div style={{ fontSize:14,fontWeight:700,color:C.white }}>NeuroScan</div><div style={{ fontSize:10,color:C.textFaint }}>Admin</div></div>
          </div>
          <div style={{ position:"relative" }}>
            <input className="field" placeholder="Search patients…" value={search} onChange={e => doSearch(e.target.value)}
              style={{ padding:"8px 12px 8px 32px", fontSize:12 }} />
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.textFaint }}>🔍</span>
            {results.length > 0 && (
              <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"rgba(7,18,32,0.98)", border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", zIndex:50, backdropFilter:"blur(20px)" }}>
                {results.slice(0,6).map((r,i) => (
                  <div key={i} onClick={() => { navigate(`/admin/patients`); setSearch(""); setResults([]); }}
                    style={{ padding:"10px 14px", fontSize:13, color:C.text, cursor:"pointer", borderBottom:`1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <div style={{ fontWeight:600 }}>{r.label}</div>
                    <div style={{ fontSize:11, color:C.textFaint }}>{r.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex:1, padding:"0 8px" }}>
          {NAV.filter(n => n.roles.includes(user?.role)).map(n => (
            <div key={n.id} className={`nav-item ${n.id===activeId?"active":""}`}
              onClick={() => navigate(n.path)}
              style={{ color: n.id===activeId ? C.teal : C.textDim }}>
              <div className="icon" style={{ background: n.id===activeId?`${C.teal}18`:"rgba(255,255,255,0.04)", fontSize:14 }}>{n.icon}</div>
              <span>{n.label}</span>
              {n.id===activeId && <div style={{ width:5,height:5,borderRadius:"50%",background:C.teal,marginLeft:"auto",flexShrink:0 }} />}
            </div>
          ))}
        </div>

        <div style={{ padding:"12px 8px", borderTop:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginBottom:8 }}>
            <div style={{ width:32,height:32,borderRadius:10,background:`${C.teal}18`,border:`1px solid ${C.teal}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.teal,fontWeight:700,flexShrink:0 }}>{user?.name?.charAt(0)||"A"}</div>
            <div style={{ minWidth:0 }}><div style={{ fontSize:12,fontWeight:600,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.name}</div><div className="badge badge-teal" style={{ marginTop:3,padding:"2px 8px",fontSize:10 }}>{user?.role}</div></div>
          </div>
          <button onClick={logout} style={{ width:"100%",padding:"9px 14px",background:"rgba(255,77,109,0.07)",border:"1px solid rgba(255,77,109,0.15)",borderRadius:10,color:C.coral,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
            <span>🚪</span>Sign out
          </button>
        </div>
      </div>

      <div className="admin-main">
        {title && (
          <div className="au" style={{ marginBottom:28 }}>
            <span className="section-tag">Administration</span>
            <h1 style={{ fontFamily:"'Fraunces',serif",fontSize:32,fontWeight:300,color:C.white,lineHeight:1.1 }}>
              {title}{subtitle && <><br /><em style={{ color:C.teal }}>{subtitle}</em></>}
            </h1>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

