import { cache } from "react";

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const authHeader = (token) => {
  return token ? { authorization: `Bearer ${token}` } : {};
};

const EMPTY_PAGE = { doctors: [], total: 0, page: 1, limit: 12, totalPages: 1 };

/**
 * Server-side search + pagination. Public data, so a 60s revalidate is fine —
 * nothing here is per-user or time-critical.
 */
export const getDoctors = async ({ q, hospital, specialty, page, limit, sort, type } = {}) => {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (q) params.set("q", q);
  if (hospital) params.set("hospital", hospital);
  if (specialty) params.set("specialty", specialty);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (sort) params.set("sort", sort);

  try {
    const res = await fetch(`${API_URL}/doctors?${params}`, { next: { revalidate: 60 } });
    const data = await res.json();
    return Array.isArray(data?.doctors) ? data : EMPTY_PAGE;
  } catch {
    // Server unreachable/down — fail soft so the page still renders
    // with an empty list instead of a hard 500 crash.
    return EMPTY_PAGE;
  }
};

const EMPTY_STATS = { totalDoctors: 0, totalReviews: 0, avgRating: null, specialties: [], testimonials: [] };

export const getDoctorStats = async () => {
  try {
    const res = await fetch(`${API_URL}/doctors/stats`, { next: { revalidate: 60 } });
    const data = await res.json();
    return data && Array.isArray(data.specialties) ? data : EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
};

/**
 * Deduped per render pass: the homepage hero, specialty marquee and
 * testimonials all read the same stats. cache() is server-only — do NOT call
 * this from a client component.
 */
export const getDoctorStatsCached = cache(getDoctorStats);

export const getDoctorById = async (id, token) => {
  const res = await fetch(`${API_URL}/doctors/${id}`, {
    cache: "no-store",
    headers: authHeader(token),
  });
  return res.json();
};

/**
 * Returns the signed-in user's own appointments.
 *
 * The email is no longer sent — the server derives it from the JWT. Passing it
 * in the query string meant anyone could read anyone else's bookings.
 */
/**
 * Server-side, deduped per render. The doctor detail route resolves the same
 * doctor twice — once in generateMetadata, once in the page body — which was
 * two identical API calls per page view.
 */
export const getDoctorByIdCached = cache(getDoctorById);

export const getMyAppointments = async (token) => {
    const res = await fetch(`${API_URL}/appointments`, {
        cache: "no-store",
        headers: authHeader(token),
    });
    return res.json();
};

export const bookAppointment = async (appointmentData, token) => {
    const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
        },
        body: JSON.stringify(appointmentData),
    });
    return res.json();
};

export const updateAppointment = async (id, updatedData, token) => {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(updatedData),
  });
  return res.json();
};

export const deleteAppointment = async (id, token) => {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return res.json();
};

export const addReview = async (doctorId, reviewData, token) => {
  const res = await fetch(`${API_URL}/doctors/${doctorId}/review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(reviewData),
  });
  return res.json();
};

// ── Doctor onboarding (public-facing user applies to become a doctor) ──

export const getMyDoctorApplication = async (token) => {
  const res = await fetch(`${API_URL}/doctors/my-application`, {
    cache: "no-store",
    headers: authHeader(token),
  });
  return res.json();
};

export const applyAsDoctor = async (applicationData, token) => {
  const res = await fetch(`${API_URL}/doctors/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(applicationData),
  });
  return res.json();
};

// ── Doctor panel (self-service, requires doctor role) ──

export const getMyDoctorAppointments = async (token) => {
  const res = await fetch(`${API_URL}/doctor/appointments`, {
    cache: "no-store",
    headers: authHeader(token),
  });
  return res.json();
};

export const updateAppointmentStatus = async (id, status, token) => {
  const res = await fetch(`${API_URL}/doctor/appointments/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const addPrescription = async (id, prescriptionData, token) => {
  const res = await fetch(`${API_URL}/doctor/appointments/${id}/prescription`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(prescriptionData),
  });
  return res.json();
};

/**
 * Weekly sessions (`[{ day, sessions: [{ start, end }] }]`), patients per hour
 * and leave days. Adding a leave day over existing bookings cancels and fully
 * refunds them on the server. Omit a field to leave it untouched.
 */
export const updateMyAvailability = async ({ availability, maxPerHour, leaveDates }, token) => {
  const body = {};
  if (availability !== undefined) body.availability = availability;
  if (maxPerHour !== undefined) body.maxPerHour = maxPerHour;
  if (leaveDates !== undefined) body.leaveDates = leaveDates;

  const res = await fetch(`${API_URL}/doctor/availability`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });
  return res.json();
};

export const getMyDoctorProfile = async (token) => {
  const res = await fetch(`${API_URL}/doctor/profile`, {
    cache: "no-store",
    headers: authHeader(token),
  });
  return res.json();
};

export const updateMyDoctorProfile = async (profileData, token) => {
  const res = await fetch(`${API_URL}/doctor/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(profileData),
  });
  return res.json();
};
