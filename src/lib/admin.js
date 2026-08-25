const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const authHeader = (token) => (token ? { authorization: `Bearer ${token}` } : {});

export const getPendingDoctors = async (token) => {
  const res = await fetch(`${API_URL}/admin/doctors/pending`, {
    cache: "no-store",
    headers: authHeader(token),
  });
  return res.json();
};

export const approveDoctor = async (id, token) => {
  const res = await fetch(`${API_URL}/admin/doctors/${id}/approve`, {
    method: "PATCH",
    headers: authHeader(token),
  });
  return res.json();
};

export const rejectDoctor = async (id, reason, token) => {
  const res = await fetch(`${API_URL}/admin/doctors/${id}/reject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify({ reason }),
  });
  return res.json();
};

export const getAllUsers = async (token, role) => {
  const query = role ? `?role=${role}` : "";
  const res = await fetch(`${API_URL}/admin/users${query}`, {
    cache: "no-store",
    headers: authHeader(token),
  });
  return res.json();
};

export const suspendUser = async (id, token) => {
  const res = await fetch(`${API_URL}/admin/users/${id}/suspend`, {
    method: "PATCH",
    headers: authHeader(token),
  });
  return res.json();
};

export const reactivateUser = async (id, token) => {
  const res = await fetch(`${API_URL}/admin/users/${id}/reactivate`, {
    method: "PATCH",
    headers: authHeader(token),
  });
  return res.json();
};

export const getAdminStats = async (token) => {
  const res = await fetch(`${API_URL}/admin/stats`, {
    cache: "no-store",
    headers: authHeader(token),
  });
  return res.json();
};
