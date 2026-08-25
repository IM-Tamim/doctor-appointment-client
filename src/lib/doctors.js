import { cache } from "react";

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const authHeader = (token) => {
  return token ? { authorization: `Bearer ${token}` } : {};
};

export const getAllDoctors = async () => {
  try {
    const res = await fetch(`${API_URL}/doctors`, { cache: "no-store" });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    // Server unreachable/down — fail soft so the page still renders
    // with an empty list instead of a hard 500 crash.
    return [];
  }
};

/**
 * Server-component-only variant of getAllDoctors, deduped per render pass.
 *
 * The homepage renders three server components that each need the doctor list
 * (hero stats, top-rated, specialty marquee). Without this they fired three
 * separate HTTP calls to the API for identical data on every request. React's
 * cache() collapses them into one. Do NOT call this from a client component —
 * cache() is server-only.
 */
export const getAllDoctorsCached = cache(getAllDoctors);

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
 * `blockedDates` are one-off days off (holidays, leave) that override the
 * weekly pattern. Omit a field to leave it untouched.
 */
export const updateMyAvailability = async ({ availability, blockedDates }, token) => {
  const body = {};
  if (availability !== undefined) body.availability = availability;
  if (blockedDates !== undefined) body.blockedDates = blockedDates;

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
