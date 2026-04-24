import { useNavigate, useLocation } from "react-router-dom";
import { userAPI } from "../services/api";
import { LayoutDashboard, TrendingUp, FileText, UserCircle, BrainCircuit, Activity, Settings as SettingsIcon, LogOut } from "lucide-react";

export function SideNav({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const startAssessment = async (path) => {
    try { const { data } = await userAPI.startSession(); navigate(`${path}?session_id=${data.session?.id||""}`); }
    catch { navigate(path); }
  };
  
  const links = [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard",   path: "/dashboard",      session: false },
    { icon: <TrendingUp size={18} />,      label: "Progression", path: "/progression",    session: false },
    { icon: <FileText size={18} />,        label: "Reports",     path: "/reports",        session: false },
    { icon: <UserCircle size={18} />,      label: "Demographics",path: "/demographics",   session: true  },
    { icon: <BrainCircuit size={18} />,    label: "Cognitive",   path: "/cognitive-test", session: true  },
    { icon: <Activity size={18} />,        label: "MRI Upload",  path: "/mri-upload",     session: true  },
    { icon: <SettingsIcon size={18} />,    label: "Settings",    path: "/settings",       session: false },
  ];
  
  return (
    <div className="sidebar">
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", fontSize: 20, color: "white", fontWeight: 700, flexShrink: 0, boxShadow: "var(--shadow-md)" }}>N</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>NeuroScan</div>
            <div style={{ fontSize: 12, color: "var(--accent-indigo)", fontWeight: 500 }}>Patient Portal</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "0 12px" }}>
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <div key={link.label} className={`nav-link ${isActive ? "active" : ""}`}
              onClick={() => link.session ? startAssessment(link.path) : navigate(link.path)}
              style={{ cursor:"pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, opacity: isActive ? 1 : 0.6 }}>{link.icon}</div>
              <span style={{ fontWeight: isActive ? 600 : 500, color: isActive ? "var(--accent-indigo)" : "var(--text-secondary)" }}>{link.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "20px 16px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ padding: "12px", borderRadius: "12px", background: "var(--bg-hover)", marginBottom: 12, border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "Patient Account"}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
        </div>
        <button onClick={logout} className="btn-secondary" style={{ width: "100%", color: "var(--accent-red)", borderColor: "transparent", background: "rgba(225,29,72,0.05)" }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
