import { api } from "./http";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const AMBULANCE_TYPES = ["Basic", "AC", "ICU", "Freezer"];

// ── Blood donors ────────────────────────────────────────────────────────

/** Phones are only returned when a token is sent (signed-in users). */
export const searchDonors = ({ bloodGroup, area, page }, token) => {
    const qs = new URLSearchParams();
    if (bloodGroup) qs.set("bloodGroup", bloodGroup);
    if (area) qs.set("area", area);
    if (page) qs.set("page", String(page));
    return api(`/donors?${qs}`, { token });
};

export const getMyDonorProfile = (token) => api("/me/donor", { token });
export const saveMyDonorProfile = (data, token) => api("/me/donor", { method: "PUT", token, body: data });
export const deleteMyDonorProfile = (token) => api("/me/donor", { method: "DELETE", token });

export const getBloodRequests = ({ bloodGroup, mine } = {}, token) => {
    const qs = new URLSearchParams();
    if (bloodGroup) qs.set("bloodGroup", bloodGroup);
    if (mine) qs.set("mine", "1");
    return api(`/blood-requests?${qs}`, { token });
};
export const createBloodRequest = (data, token) => api("/blood-requests", { method: "POST", token, body: data });
export const closeBloodRequest = (id, token) => api(`/blood-requests/${id}/close`, { method: "PATCH", token });

// ── Ambulances ──────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

/** Server components: public, fine to revalidate every 60s. */
/** One page of ambulances for the emergency page. */
export const getAmbulancesPage = async ({ city, page = 1, limit = 10 } = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (city) qs.set("city", city);
    try {
        const res = await fetch(`${API_URL}/ambulances?${qs}`, { next: { revalidate: 60 } });
        const data = await res.json();
        if (Array.isArray(data?.ambulances)) return data;
    } catch {}
    return { ambulances: [], total: 0, page: 1, limit, totalPages: 1 };
};

export const getAmbulances = async ({ city, hospitalId } = {}) => {
    const qs = new URLSearchParams();
    if (city) qs.set("city", city);
    if (hospitalId) qs.set("hospitalId", hospitalId);
    try {
        const res = await fetch(`${API_URL}/ambulances?${qs}`, { next: { revalidate: 60 } });
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
};

export const fetchAmbulances = (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    return api(`/ambulances?${qs}`);
};
export const addAmbulance = (data, token) => api("/manage/ambulances", { method: "POST", token, body: data });
export const updateAmbulance = (id, data, token) => api(`/manage/ambulances/${id}`, { method: "PATCH", token, body: data });
export const removeAmbulance = (id, token) => api(`/manage/ambulances/${id}`, { method: "DELETE", token });

// ── Hospital manager ────────────────────────────────────────────────────

export const getManagedHospital = (token) => api("/hospital-admin/hospital", { token });
export const updateManagedHospital = (data, token) => api("/hospital-admin/hospital", { method: "PATCH", token, body: data });
export const attachDoctor = (email, token) => api("/hospital-admin/doctors", { method: "POST", token, body: { email } });
export const detachDoctor = (doctorId, token) => api(`/hospital-admin/doctors/${doctorId}`, { method: "DELETE", token });
export const setHospitalManager = (userId, hospitalId, token) =>
    api(`/admin/users/${userId}/hospital-manager`, { method: "PATCH", token, body: { hospitalId } });
