import { cache } from "react";

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const authHeader = (token) => (token ? { authorization: `Bearer ${token}` } : {});

// ── Public (hospital directory changes rarely, so 60s revalidate is fine) ──

export const getHospitals = async ({ city, q } = {}) => {
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (q) params.set("q", q);
  try {
    const res = await fetch(`${API_URL}/hospitals?${params}`, { next: { revalidate: 60 } });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getHospitalsCached = cache(getHospitals);

/** One page of hospitals plus the city list, for the public directory pages. */
export const getHospitalsPage = async ({ city, page = 1, limit = 9, emergency = false } = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (city) params.set("city", city);
  if (emergency) params.set("emergency", "1");
  try {
    const res = await fetch(`${API_URL}/hospitals?${params}`, { next: { revalidate: 60 } });
    const data = await res.json();
    if (Array.isArray(data?.hospitals)) return data;
  } catch {}
  return { hospitals: [], total: 0, page: 1, limit, totalPages: 1, cities: [] };
};

/** Returns null when the hospital doesn't exist or the API is unreachable. */
export const getHospitalById = async (id) => {
  try {
    const res = await fetch(`${API_URL}/hospitals/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

export const getHospitalByIdCached = cache(getHospitalById);

/** Client-side variant for dropdowns inside client components (no Next cache). */
export const fetchHospitalOptions = async () => {
  try {
    const res = await fetch(`${API_URL}/hospitals`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// ── Admin ──

export const createHospital = async (hospital, token) => {
  const res = await fetch(`${API_URL}/admin/hospitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(hospital),
  });
  return res.json();
};

export const updateHospital = async (id, hospital, token) => {
  const res = await fetch(`${API_URL}/admin/hospitals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(hospital),
  });
  return res.json();
};

export const deleteHospital = async (id, token) => {
  const res = await fetch(`${API_URL}/admin/hospitals/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return res.json();
};
