import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login          from "./pages/Login";
import Register       from "./pages/Register";

import Demographics   from "./pages/Demographics";
import CognitiveTest  from "./pages/CognitiveTest";
import MRIUpload      from "./pages/MRIUpload";
import UserDashboard  from "./pages/UserDashboard";
import Progression    from "./pages/Progression";
import Reports        from "./pages/Reports";
import AdminOverview   from "./pages/admin/AdminOverview";
import AdminPatients   from "./pages/admin/AdminPatients";
import AdminModelConfig from "./pages/admin/AdminModelConfig";
import { AdminStaff, AdminFlagged } from "./pages/admin/AdminStaffFlagged";
import Landing        from "./pages/Landing";
import SessionResults from "./pages/SessionResults";
import Settings       from "./pages/Settings";
import { NotFound }   from "./pages/ErrorPages";

// ── Placeholder for phases not yet built ─────────────────────────────────────
const Placeholder = ({ title }) => (
  <div style={{ padding: "60px", textAlign: "center", fontFamily: "sans-serif" }}>
    <h2 style={{ color: "#2c5364" }}>🚧 {title}</h2>
    <p style={{ color: "#718096" }}>This module will be built in the next phase.</p>
  </div>
);

// ── Protected route wrapper ───────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={user.role === "patient" ? "/dashboard" : "/admin"} replace />;
  return children;
}

// ── App routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={!user ? <Landing /> : <Navigate to={user.role === "patient" ? "/dashboard" : "/admin"} />} />
      <Route path="/login"    element={!user ? <Login />    : <Navigate to={user.role === "patient" ? "/dashboard" : "/admin"} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

      {/* Patient routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["patient"]}>
          <UserDashboard />
        </ProtectedRoute>
      }/>
      <Route path="/demographics" element={
        <ProtectedRoute allowedRoles={["patient"]}>
          <Demographics />
        </ProtectedRoute>
      }/>
      <Route path="/cognitive-test" element={
        <ProtectedRoute allowedRoles={["patient"]}>
          <CognitiveTest />
        </ProtectedRoute>
      }/>
      <Route path="/mri-upload" element={
        <ProtectedRoute allowedRoles={["patient"]}>
          <MRIUpload />
        </ProtectedRoute>
      }/>
      <Route path="/progression" element={
        <ProtectedRoute allowedRoles={["patient"]}>
          <Progression />
        </ProtectedRoute>
      }/>
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={["patient"]}>
          <Reports />
        </ProtectedRoute>
      }/>
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={["patient","doctor","admin"]}>
          <Settings />
        </ProtectedRoute>
      }/>
      <Route path="/results/:sessionId" element={
        <ProtectedRoute allowedRoles={["patient"]}>
          <SessionResults />
        </ProtectedRoute>
      }/>

      {/* Admin / Doctor routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin", "doctor"]}>
          <AdminOverview />
        </ProtectedRoute>
      }/>
      <Route path="/admin/patients" element={
        <ProtectedRoute allowedRoles={["admin", "doctor"]}>
          <AdminPatients />
        </ProtectedRoute>
      }/>
      <Route path="/admin/analytics" element={
        <ProtectedRoute allowedRoles={["admin", "doctor"]}>
          <AdminOverview />
        </ProtectedRoute>
      }/>
      <Route path="/admin/model-config" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminModelConfig />
        </ProtectedRoute>
      }/>
      <Route path="/admin/staff" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminStaff />
        </ProtectedRoute>
      }/>

      <Route path="/admin/flagged" element={
        <ProtectedRoute allowedRoles={["admin", "doctor"]}>
          <AdminFlagged />
        </ProtectedRoute>
      }/>

      {/* Default redirect */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
