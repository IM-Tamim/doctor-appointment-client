import { api, downloadFile } from "./http";

// ── Slots & booking ──────────────────────────────────────────────────────

export const getDoctorSlots = (doctorId, date, { exclude } = {}) =>
  api(`/doctors/${doctorId}/slots?date=${date}${exclude ? `&exclude=${exclude}` : ""}`);

export const getAppointment = (id, token) => api(`/appointments/${id}`, { token });

export const createAppointment = (data, token) => api("/appointments", { method: "POST", token, body: data });

export const rescheduleAppointment = (id, { appointmentDate, appointmentTime }, token) =>
  api(`/appointments/${id}`, { method: "PATCH", token, body: { appointmentDate, appointmentTime } });

export const getCancelPreview = (id, token) => api(`/appointments/${id}/cancel-preview`, { token });

export const cancelAppointment = (id, reason, token) =>
  api(`/appointments/${id}/cancel`, { method: "POST", token, body: { reason } });

export const getFollowUp = (id, token) => api(`/appointments/${id}/follow-up`, { token });

export const getRefundPolicy = () => api("/settings/refund-policy");

export const downloadReceipt = (appt, token, lang = "en") =>
  downloadFile(`/appointments/${appt._id}/receipt?lang=${lang}`, token, `receipt-${appt.receiptNo || appt._id}.pdf`, {
    path: `/appointments/${appt._id}/receipt-link`,
    lang,
  });

// ── Payments ─────────────────────────────────────────────────────────────

export const getPaymentConfig = () => api("/payments/config");

export const startSslcommerz = (appointmentId, token) =>
  api("/payments/sslcommerz/init", { method: "POST", token, body: { appointmentId } });

export const startDemoPayment = (appointmentId, phone, token) =>
  api("/payments/demo/start", { method: "POST", token, body: { appointmentId, phone } });

export const confirmDemoPayment = (appointmentId, otp, pin, token) =>
  api("/payments/demo/confirm", { method: "POST", token, body: { appointmentId, otp, pin } });

export const markCashReceived = (id, token) =>
  api(`/doctor/appointments/${id}/cash-received`, { method: "PATCH", token });

// ── Prescriptions ────────────────────────────────────────────────────────

export const saveDigitalPrescription = (appointmentId, data, token) =>
  api(`/doctor/appointments/${appointmentId}/digital-prescription`, { method: "POST", token, body: data });

export const getAppointmentPrescription = (appointmentId, token) =>
  api(`/appointments/${appointmentId}/prescription`, { token });

export const downloadPrescription = (rx, token, lang = "en") =>
  downloadFile(`/prescriptions/${rx._id}/pdf?lang=${lang}`, token, `prescription-${rx.visitDate}.pdf`, {
    path: `/prescriptions/${rx._id}/pdf-link`,
    lang,
  });

export const setMedicineReminders = (prescriptionId, enabled, token) =>
  api(`/prescriptions/${prescriptionId}/reminders`, { method: "PATCH", token, body: { enabled } });

// ── Admin ────────────────────────────────────────────────────────────────

export const getLedger = (params, token) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  return api(`/admin/payments?${qs}`, { token });
};

export const updateRefundPolicy = (policy, token) =>
  api("/admin/settings/refund-policy", { method: "PATCH", token, body: policy });

export const resetRefundPolicy = (token) => api("/admin/settings/refund-policy/reset", { method: "POST", token });
