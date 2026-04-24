import { Link } from "react-router-dom";

/**
 * AssessmentSidebar
 * 
 * Shared sidebar for the 3-step assessment flow (Demographics, Cognitive, MRI).
 * Preserves session_id in URLs and uses Link to prevent state loss.
 */
export default function AssessmentSidebar({ activeStep, sessionId }) {
  const steps = [
    { id: "demographics", label: "Demographics",   path: "/demographics",   icon: "👤" },
    { id: "cognitive",    label: "Cognitive Test", path: "/cognitive-test", icon: "🧠" },
    { id: "mri",          label: "MRI Upload",     path: "/mri-upload",     icon: "🔬" },
    { id: "results",      label: "Results",        path: "/dashboard",      icon: "📊" },
  ];

  const getQuery = (path) => sessionId ? `${path}?session_id=${sessionId}` : path;

  return (
    <div className="sidebar">
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, 
            background: "var(--accent-teal)", color: "var(--bg-main)", 
            fontFamily: "'Instrument Serif', serif", fontSize: 20, 
            display: "flex", alignItems: "center", justifyContent: "center" 
          }}>N</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>NeuroScan</div>
            <div style={{ fontSize: 11, color: "var(--accent-teal)" }}>AI Assessment</div>
          </div>
        </div>
      </div>

      {steps.map((step, i) => {
        const isActive = step.id === activeStep;
        // Logic for "Completed" checkmark: usually if it's a previous step
        const isDone = i < steps.findIndex(s => s.id === activeStep);
        
        return (
          <Link 
            key={step.id} 
            to={getQuery(step.path)} 
            className={`nav-link ${isActive ? "active" : ""}`}
            style={{ textDecoration: 'none' }}
          >
            <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>
              {isDone ? "✓" : step.icon}
            </span>
            <span>{step.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
