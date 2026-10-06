import { api } from "./http";

// ── Family profiles ──────────────────────────────────────────────────────

export const getProfiles = (token) => api("/me/profiles", { token });
export const createProfile = (profile, token) => api("/me/profiles", { method: "POST", token, body: profile });
export const updateProfile = (id, profile, token) => api(`/me/profiles/${id}`, { method: "PATCH", token, body: profile });
export const deleteProfile = (id, token) => api(`/me/profiles/${id}`, { method: "DELETE", token });

export const RELATIONS = ["spouse", "child", "father", "mother", "sibling", "grandparent", "relative", "other"];

// ── Saved doctors ────────────────────────────────────────────────────────

export const getSavedDoctorIds = (token) => api("/me/saved-doctors?ids=1", { token });
export const getSavedDoctors = (token) => api("/me/saved-doctors", { token });
export const saveDoctor = (doctorId, token) => api(`/me/saved-doctors/${doctorId}`, { method: "PUT", token });
export const unsaveDoctor = (doctorId, token) => api(`/me/saved-doctors/${doctorId}`, { method: "DELETE", token });

// ── Reviews ──────────────────────────────────────────────────────────────

export const getReviewable = (doctorId, token) =>
  api(`/me/reviewable${doctorId ? `?doctorId=${doctorId}` : ""}`, { token });
