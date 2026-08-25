const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const authHeader = (token) => (token ? { authorization: `Bearer ${token}` } : {});

export const getMyNotifications = async (token) => {
  const res = await fetch(`${API_URL}/notifications`, {
    cache: "no-store",
    headers: authHeader(token),
  });
  return res.json();
};

export const markNotificationRead = async (id, token) => {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeader(token),
  });
  return res.json();
};

export const markAllNotificationsRead = async (token) => {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: authHeader(token),
  });
  return res.json();
};
