const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

/**
 * JSON request to the Express API. Slot availability, payments, appointments
 * and queue data are never cached (`no-store`) — stale copies there cause
 * double bookings and wrong payment states.
 *
 * Errors come back as `{ message }` with `ok: false` rather than throwing, so
 * callers can show the server's reason.
 */
export const api = async (path, { method = "GET", token, body } = {}) => {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      cache: "no-store",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, message: data?.message || `Request failed (${res.status}).` };
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, message: "Couldn't reach the server. Check your connection." };
  }
};

/**
 * Downloads a PDF the API streams (receipts, prescriptions).
 *
 * Inside the Android app the WebView can't save blob downloads, so there we
 * ask the API for a short-lived link (`link`: { path, lang }) and open it; the
 * app hands links to other hosts to the system browser, which downloads it.
 */
export const downloadFile = async (path, token, filename, link) => {
  if (link && typeof navigator !== "undefined" && navigator.userAgent.includes("DocAppointApp")) {
    const res = await api(link.path, { method: "POST", token, body: { lang: link.lang } });
    if (!res.ok) throw new Error(res.message || "Download failed.");
    window.location.href = res.data.url;
    return;
  }
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || "Download failed.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
