import axios from "axios";

/**
 * In development: React runs on :3000, Flask on :5000 → explicit URL needed.
 * In production:  React build is served BY Flask on the same port → use relative "/api".
 *
 * REACT_APP_API_URL can be set in client/.env to override.
 */
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "/api"
    : "http://localhost:5000/api");

// ── Axios instance ─────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refresh}` },
        });
        localStorage.setItem("access_token", data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post("/auth/register", data),
  login:          (data) => api.post("/auth/login", data),
  me:             ()     => api.get("/auth/me"),
  refresh:        ()     => api.post("/auth/refresh"),
  changePassword: (data) => api.post("/auth/change-password", data),
};

// ── User ───────────────────────────────────────────────────────────────────────
export const userAPI = {
  getDashboard:  ()     => api.get("/user/dashboard"),
  getProfile:    ()     => api.get("/user/profile"),
  updateProfile: (data) => api.put("/user/profile", data),
  listSessions:  ()     => api.get("/user/sessions"),
  startSession:  ()     => api.post("/user/sessions"),
  getSession:    (id)   => api.get(`/user/sessions/${id}`),
  getProgression:()     => api.get("/user/progression"),
  listReports:   ()     => api.get("/user/reports"),
};

// ── Admin ──────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getAnalytics:      ()       => api.get("/admin/analytics"),
  getAdvancedStats:  ()       => api.get("/admin/analytics/advanced"),
  listPatients:      (params) => api.get("/admin/patients", { params }),
  getPatient:        (id)     => api.get(`/admin/patients/${id}`),
  updatePatient:     (id, d)  => api.put(`/admin/patients/${id}`, d),
  deletePatient:     (id)     => api.delete(`/admin/patients/${id}`),
  getFlagged:        (t)      => api.get(`/admin/flagged?threshold=${t || 75}`),
  getRecentActivity: ()       => api.get("/admin/recent-activity"),
  search:            (q)      => api.get(`/admin/search?q=${encodeURIComponent(q)}`),
  createDoctor:      (data)   => api.post("/admin/doctors", data),
  listDoctors:       ()       => api.get("/admin/doctors"),
  updateDoctor:      (id, d)  => api.put(`/admin/doctors/${id}`, d),
  deleteDoctor:      (id)     => api.delete(`/admin/doctors/${id}`),
  getModelConfig:    ()       => api.get("/admin/model-config"),
  updateModelConfig: (data)   => api.put("/admin/model-config", data),
};

// ── Reports ────────────────────────────────────────────────────────────────────
export const reportAPI = {
  generate: (sessionId) => api.post(`/report/generate/${sessionId}`),
  download: (sessionId) => api.get(`/report/download/${sessionId}`, { responseType: "blob" }),
  list:     ()          => api.get("/report/list"),
};

// ── Notifications ──────────────────────────────────────────────────────────────
export const notifAPI = {
  getAll:   ()    => api.get("/notifications"),
  markAll:  ()    => api.put("/notifications/read-all"),
  markOne:  (id)  => api.put(`/notifications/${id}/read`),
};

// ── Settings ───────────────────────────────────────────────────────────────────
export const settingsAPI = {
  updateProfile:  (data) => api.put("/settings/profile", data),
  changePassword: (data) => api.put("/settings/password", data),
  deleteAccount:  (data) => api.delete("/settings/account", { data }),
};

// ── Results ────────────────────────────────────────────────────────────────────
export const resultsAPI = {
  getSession: (sessionId) => api.get(`/results/${sessionId}`),
};

// ── Export ─────────────────────────────────────────────────────────────────────
export const exportAPI = {
  patients: () => api.get("/admin/export/patients", { responseType: "blob" }),
};

export default api;
