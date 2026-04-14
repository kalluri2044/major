import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout, KpiCard, Card, CardTitle, Spinner, getStage, CSS_BASE, C } from "./AdminLayout";
import api from "../../services/api";

function BarChart({ data, color = C.teal, valueKey = "count", labelKey = "month", height = 100 }) {
  if (!data?.length) return <div style={{ textAlign:"center", padding:20, color:C.textFaint, fontSize:12 }}>No data yet</div>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height }}>
      {data.map((d, i) => {
        const h = Math.max((((d[valueKey]||0) / max) * (height - 28)), 4);
        const isLast = i === data.length - 1;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ fontSize:9, color:C.textFaint, fontFamily:"'JetBrains Mono',monospace" }}>{d[valueKey]}</div>
            <div style={{ width:"100%", height:h, borderRadius:"4px 4px 0 0", background: isLast ? color : `${color}55`, border: isLast ? `1px solid ${color}` : "none", transition:"height .5s ease", boxShadow: isLast ? `0 0 12px ${color}44` : "none" }} />
            <div style={{ fontSize:8, color:C.textFaint, whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%", textAlign:"center" }}>{(d[labelKey]||"").slice(-5)}</div>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ data }) {
  const total = (data || []).reduce((s, d) => s + (d.count || 0), 0) || 1;
  const COLOR = {
    'Non-Demented / Healthy': C.teal,
    'Very Mild Demented (MCI)': C.gold,
    "Mild Alzheimer's Disease": C.amber,
    "Moderate Alzheimer's Disease": C.coral,
  };
  const R = 52, circ = 2 * Math.PI * R;
  let off = 0;
  const arcs = (data || []).map(d => {
    const dash = ((d.count||0) / total) * circ;
    const arc = { dash, off, color: COLOR[d.stage] || C.teal, stage: d.stage, count: d.count, pct: Math.round((d.count||0) / total * 100) };
    off += dash;
    return arc;
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:24 }}>
      <div style={{ position:"relative", flexShrink:0 }}>
        <svg width="120" height="120" style={{ transform:"rotate(-90deg)" }}>
          {arcs.map((a, i) => (
            <circle key={i} cx="60" cy="60" r={R} fill="none" stroke={a.color} strokeWidth="12"
              strokeDasharray={`${a.dash} ${circ - a.dash}`} strokeDashoffset={-a.off} strokeLinecap="round" />
          ))}
          {!data?.length && <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />}
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:300, color:C.white }}>{total}</div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:a.color, flexShrink:0 }} />
              <span style={{ fontSize:11, color:C.textDim }}>{getStage(a.stage).short}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:48, height:3, background:"rgba(255,255,255,0.05)", borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${a.pct}%`, background:a.color, borderRadius:99 }} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:a.color, width:28, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{a.pct}%</span>
            </div>
          </div>
        ))}
        {!arcs.length && <div style={{ fontSize:12, color:C.textFaint }}>No data yet</div>}
      </div>
    </div>
  );
}

function ActivityFeed({ items, navigate }) {
  if (!items?.length) return <div style={{ textAlign:"center", padding:"24px", color:C.textFaint, fontSize:13 }}>No recent activity</div>;
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      {items.map((item, i) => {
        const sm = getStage(item.stage);
        return (
          <div key={i} onClick={() => navigate(`/admin/patients`)}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom: i < items.length-1 ? `1px solid ${C.border}` : "none", cursor:"pointer", transition:"opacity .2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity=".7"}
            onMouseLeave={e => e.currentTarget.style.opacity="1"}>
            <div style={{ width:36, height:36, borderRadius:10, background:sm.bg, border:`1px solid ${sm.c}33`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontSize:16, color:sm.c, flexShrink:0 }}>{sm.g}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.user_name}</div>
              <div style={{ fontSize:11, color:C.textFaint }}>Session #{item.session_id}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:sm.c, fontFamily:"'JetBrains Mono',monospace" }}>{item.ad_percentage}%</div>
              <div style={{ fontSize:10, color:C.textFaint }}>{new Date(item.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminOverview() {
  const navigate  = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [advanced,  setAdvanced]  = useState(null);
  const [activity,  setActivity]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/analytics"), api.get("/admin/analytics/advanced"), api.get("/admin/recent-activity")])
      .then(([a, adv, act]) => { setAnalytics(a.data); setAdvanced(adv.data); setActivity(act.data.activity || []); })
      .catch(() => setError("Failed to load analytics. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout activeId="overview" title="Overview"><div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner /></div></AdminLayout>;
  if (error)   return <AdminLayout activeId="overview" title="Overview"><div style={{ textAlign:"center", padding:60 }}><div style={{ fontSize:40, marginBottom:16 }}>⚠️</div><div style={{ color:C.coral, marginBottom:20 }}>{error}</div><button className="btn-primary" onClick={() => window.location.reload()}>Refresh</button></div></AdminLayout>;

  const k = analytics?.kpis || {};
  return (
    <AdminLayout activeId="overview" title="Overview" subtitle="Analytics">
      {/* KPIs */}
      <div className="kpi-grid au">
        <KpiCard label="Total Patients"   value={k.total_patients||0}            sub="registered accounts"  color={C.blue}   icon="👥" />
        <KpiCard label="Total Sessions"   value={k.total_sessions||0}            sub="completed assessments" color={C.violet} icon="📋" />
        <KpiCard label="High Risk"        value={k.high_risk_count||0}           sub="patients ≥75% AD risk" color={C.coral}  icon="⚠️" />
        <KpiCard label="Avg AD Risk"      value={`${(k.avg_ad_percentage||0).toFixed(1)}%`} sub="across all sessions" color={C.gold}   icon="🎯" />
        <KpiCard label="Avg Cognitive"    value={(k.avg_cognitive_score||0).toFixed(1)} sub="normalized score 0-100" color={C.teal}   icon="🧠" />
        <KpiCard label="Reports"          value={k.total_reports||0}             sub="PDFs generated"        color={C.amber}  icon="📄" />
      </div>

      {/* Charts row */}
      <div className="au d1" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:20 }}>
        <Card>
          <CardTitle sub="Monthly new registrations">Registrations</CardTitle>
          <BarChart data={analytics?.monthly_registrations||[]} color={C.blue} />
        </Card>
        <Card>
          <CardTitle sub="Monthly completed sessions">Sessions</CardTitle>
          <BarChart data={analytics?.monthly_sessions||[]} color={C.teal} />
        </Card>
        <Card>
          <CardTitle sub="Patient stage distribution">Stage Distribution</CardTitle>
          <Donut data={analytics?.stage_distribution||[]} />
        </Card>
      </div>

      {/* Risk factors + Activity */}
      <div className="au d2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card>
          <CardTitle sub="Prevalence across all patients">Risk Factor Prevalence</CardTitle>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {Object.entries(advanced?.risk_factor_prevalence || {}).slice(0,6).map(([factor, pct]) => (
              <div key={factor}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:12, color:C.textDim, textTransform:"capitalize" }}>{factor.replace(/_/g," ")}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text, fontFamily:"'JetBrains Mono',monospace" }}>{(pct*100).toFixed(0)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width:`${pct*100}%`, background: pct > .5 ? C.coral : pct > .3 ? C.amber : C.teal }} />
                </div>
              </div>
            ))}
            {!Object.keys(advanced?.risk_factor_prevalence||{}).length && <div style={{ color:C.textFaint, fontSize:13 }}>No data yet</div>}
          </div>
        </Card>
        <Card>
          <CardTitle sub="Last 20 completed assessments">Recent Activity</CardTitle>
          <ActivityFeed items={activity} navigate={navigate} />
        </Card>
      </div>
    </AdminLayout>
  );
}
