import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Retry interceptor (handles cold starts) ───────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    if (!config._retry && (err.code === "ECONNABORTED" || !err.response)) {
      config._retry = true;
      await new Promise((r) => setTimeout(r, 3000)); // wait 3s then retry once
      return api(config);
    }
    return Promise.reject(err);
  }
);

// ── Students ──────────────────────────────────────────────────
export const fetchStudents         = (series) =>
  api.get("/students", { params: series ? { series } : {} });
export const fetchStudentById      = (id) => api.get(`/students/${id}`);
export const addStudent            = (data) => api.post("/students", data);
export const updateStudent         = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent         = (id) => api.delete(`/students/${id}`);

// ── Attendance ────────────────────────────────────────────────
export const fetchAttendance       = (series) =>
  api.get("/attendance", { params: series ? { series } : {} });
export const fetchAttendanceSummary = (series) =>
  api.get("/attendance/summary", { params: series ? { series } : {} });
export const fetchAttendanceByRoll = (roll) =>
  api.get(`/attendance/roll/${roll}`);
export const upsertAttendance      = (data) => api.post("/attendance", data);
export const addAttendanceRecord   = (roll, subject, data) =>
  api.patch(`/attendance/${roll}/subjects/${encodeURIComponent(subject)}/records`, data);
export const deleteAttendance      = (id) => api.delete(`/attendance/${id}`);

// ── Marks ─────────────────────────────────────────────────────
export const fetchMarks            = (series) =>
  api.get("/marks", { params: series ? { series } : {} });
export const fetchMarksSummary     = (series) =>
  api.get("/marks/summary", { params: series ? { series } : {} });
export const fetchMarksByRoll      = (roll) =>
  api.get(`/marks/roll/${roll}`);
export const upsertMarks           = (data) => api.post("/marks", data);
export const updateMarks           = (id, data) => api.put(`/marks/${id}`, data);
export const deleteMarks           = (id) => api.delete(`/marks/${id}`);

// ── Subjects ──────────────────────────────────────────────────
export const fetchSubjects         = (series) => api.get(`/subjects/${series}`);

// ── Dashboard ─────────────────────────────────────────────────
export const fetchDashboardStats   = (series) =>
  api.get("/dashboard/stats", { params: series ? { series } : {} });

export default api;