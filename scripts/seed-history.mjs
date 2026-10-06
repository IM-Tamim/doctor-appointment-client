// Generated demo activity for scripts/seed.mjs: ~60 days of past bookings
// (with payments, refunds, cancellations and no-shows), today's queue and the
// coming week — so analytics, the ledger and the live queue have something to
// show. Deterministic: the same seed always produces the same data.

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TZ_MS = 6 * 3600 * 1000; // clinic time is UTC+6

// Small seeded PRNG (mulberry32).
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const clinicToday = () => new Date(Date.now() + TZ_MS).toISOString().slice(0, 10);
export const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekdayOf = (date) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
const instant = (date, time) => new Date(`${date}T${time}:00+06:00`);

/** Same slot maths as the API (node/lib/schedule.js). */
const daySlots = (doctor, date) => {
  const day = doctor.availability.find((a) => a.day === weekdayOf(date));
  if (!day) return [];
  const step = 60 / doctor.maxPerHour;
  const times = [];
  for (const s of day.sessions) {
    for (let t = toMin(s.start); t + step <= toMin(s.end); t += step) times.push(fromMin(t));
  }
  return times.sort().map((time, i) => ({ time, serial: i + 1 }));
};

/**
 * @param doctors  inserted doctor docs (with _id, userId, availability, …)
 * @param patients [{ _id, name, email, phone, gender }]
 * @returns { appointments, payments, receiptCount }
 */
export const buildHistory = ({ doctors, patients, queueDoctorEmail }) => {
  const rand = rng(20261005);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const today = clinicToday();
  const nowMs = Date.now();
  const used = new Set(); // doctorId|date|time of active bookings
  const raw = [];

  const book = (doctor, date, status, forcedSlot) => {
    const slots = daySlots(doctor, date);
    const free = slots.filter((s) => !used.has(`${doctor._id}|${date}|${s.time}`));
    if (free.length === 0) return;
    const slot = forcedSlot || pick(free);
    const patient = pick(patients);
    const online =
      doctor.consultationType === "online" || (doctor.consultationType === "both" && rand() < 0.3);
    const paymentMethod = online ? "demo_mobile" : rand() < 0.55 ? "cash" : "demo_mobile";
    if (status !== "cancelled") used.add(`${doctor._id}|${date}|${slot.time}`);
    raw.push({ doctor, date, slot, patient, online, paymentMethod, status });
  };

  // Past 60 days.
  for (let offset = -60; offset < 0; offset++) {
    const date = addDays(today, offset);
    const count = 3 + Math.floor(rand() * 6);
    for (let i = 0; i < count; i++) {
      const doctor = pick(doctors);
      const r = rand();
      book(doctor, date, r < 0.74 ? "completed" : r < 0.88 ? "cancelled" : r < 0.96 ? "no_show" : "completed");
    }
  }

  // Today: a proper queue for one doctor (for the live-queue demo) plus a few others.
  const queueDoctor = doctors.find((d) => d.email === queueDoctorEmail);
  if (queueDoctor) {
    for (const s of daySlots(queueDoctor, today).slice(0, 6)) book(queueDoctor, today, "confirmed", s);
  }
  for (let i = 0; i < 4; i++) book(pick(doctors), today, rand() < 0.5 ? "confirmed" : "pending");

  // Next 7 days.
  for (let offset = 1; offset <= 7; offset++) {
    const date = addDays(today, offset);
    const count = 2 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      const r = rand();
      book(pick(doctors), date, r < 0.45 ? "pending" : r < 0.9 ? "confirmed" : "cancelled");
    }
  }

  // Materialise documents in booking order so receipt numbers increase with time.
  const items = raw
    .map((b) => {
      const start = instant(b.date, b.slot.time).getTime();
      const leadDays = 1 + Math.floor(rand() * 9);
      const createdAt = new Date(Math.min(start - leadDays * 86400000, nowMs - 3600 * 1000));
      return { ...b, start, createdAt };
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  const appointments = [];
  const payments = [];
  let receipt = 0;
  const year = today.slice(0, 4);

  for (const b of items) {
    const { doctor, patient } = b;
    const amount = doctor.fee;
    const prepaid = b.paymentMethod !== "cash";
    const appt = {
      _id: undefined, // assigned by the caller (needs ObjectId)
      userEmail: patient.email,
      userId: String(patient._id),
      profileId: null,
      patientName: patient.name,
      gender: patient.gender,
      age: 20 + Math.floor(rand() * 45),
      relation: "self",
      phone: patient.phone,
      doctorId: String(doctor._id),
      doctorUserId: doctor.userId,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      hospitalId: doctor.hospitalId,
      hospitalName: doctor.hospital,
      appointmentDate: b.date,
      appointmentTime: b.slot.time,
      serial: b.slot.serial,
      slotMinutes: 60 / doctor.maxPerHour,
      consultationMode: b.online ? "online" : "in-person",
      type: "regular",
      parentAppointmentId: null,
      reason: "",
      status: b.status,
      isActive: b.status !== "cancelled",
      amount,
      paymentMethod: b.paymentMethod,
      paymentStatus: "unpaid",
      transactionId: "",
      refundedAmount: 0,
      holdExpiresAt: null,
      rescheduleCount: 0,
      receiptNo: `DA-${year}-${String(++receipt).padStart(6, "0")}`,
      meetingUrl: "",
      reviewed: false,
      createdAt: b.createdAt,
    };

    const ledger = (type, value, at, note, txn) =>
      payments.push({
        appointmentRef: appt, // replaced with the id by the caller
        type,
        amount: value,
        method: appt.paymentMethod,
        transactionId: txn,
        userId: appt.userId,
        doctorId: appt.doctorId,
        doctorName: appt.doctorName,
        hospitalId: appt.hospitalId,
        hospitalName: appt.hospitalName,
        specialty: appt.doctorSpecialty,
        note,
        createdAt: at,
      });

    if (prepaid) {
      // Online/mobile payments were made a few minutes after booking.
      const paidAt = new Date(b.createdAt.getTime() + 4 * 60 * 1000);
      appt.paymentStatus = "paid";
      appt.paidAt = paidAt;
      appt.transactionId = `DEMO-${b.createdAt.getTime().toString(36).toUpperCase()}`;
      if (b.online) appt.meetingUrl = `https://meet.jit.si/docappoint-seed${b.createdAt.getTime().toString(16)}`;
      ledger("payment", amount, paidAt, "Appointment fee", appt.transactionId);

      if (b.status === "cancelled") {
        const cancelAt = new Date(Math.min(b.start - (rand() < 0.7 ? 30 : 6) * 3600 * 1000, nowMs - 60 * 1000));
        const hoursBefore = (b.start - cancelAt.getTime()) / 3600000;
        const pct = hoursBefore > 24 ? 100 : hoursBefore >= 2 ? 50 : 0;
        const refund = Math.round((amount * pct) / 100);
        Object.assign(appt, { cancelledBy: "patient", cancelReason: "Plans changed", cancelledAt: cancelAt });
        if (refund > 0) {
          appt.refundedAmount = refund;
          appt.paymentStatus = pct === 100 ? "refunded" : "partially_refunded";
          ledger("refund", refund, cancelAt, `${pct}% refund — cancelled by patient: Plans changed`, `RF-${appt.transactionId}`);
        }
      }
    } else if (b.status === "completed") {
      // Cash collected at the visit.
      appt.paymentStatus = "paid";
      appt.paidAt = new Date(b.start);
      appt.transactionId = `CASH-${appt.receiptNo}`;
      ledger("payment", amount, new Date(b.start), "Appointment fee", appt.transactionId);
    } else if (b.status === "cancelled") {
      Object.assign(appt, { cancelledBy: "patient", cancelReason: "Plans changed", cancelledAt: new Date(Math.min(b.start - 30 * 3600 * 1000, nowMs - 60 * 1000)) });
    }

    appointments.push(appt);
  }

  return { appointments, payments, receiptCount: receipt, year };
};

// ── Blood donors, ambulances ─────────────────────────────────────────────

const AREAS = {
  Dhaka: ["Mirpur, Dhaka", "Dhanmondi, Dhaka", "Uttara, Dhaka", "Mohammadpur, Dhaka", "Gulshan, Dhaka"],
  Chattogram: ["Agrabad, Chattogram", "Panchlaish, Chattogram"],
  Rajshahi: ["Shaheb Bazar, Rajshahi", "Upashahar, Rajshahi"],
  Khulna: ["Sonadanga, Khulna"],
  Sylhet: ["Zindabazar, Sylhet"],
  Barishal: ["Nathullabad, Barishal"],
  Rangpur: ["Jahaj Company Mor, Rangpur"],
  Mymensingh: ["Charpara, Mymensingh"],
};
const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
// Rough Bangladeshi distribution: B+ and O+ most common, negatives rare.
const GROUP_WEIGHTS = [0.24, 0.01, 0.31, 0.01, 0.08, 0.005, 0.32, 0.015];

export const buildDonors = (people) => {
  const rand = rng(777);
  const today = clinicToday();
  const cities = Object.keys(AREAS);
  const weighted = () => {
    let r = rand();
    for (let i = 0; i < GROUPS.length; i++) {
      if ((r -= GROUP_WEIGHTS[i]) <= 0) return GROUPS[i];
    }
    return "O+";
  };
  return people.map((p, i) => {
    const city = cities[i % cities.length];
    const area = AREAS[city][Math.floor(rand() * AREAS[city].length)];
    // Some donated recently (hidden from search for 90 days), some long ago.
    const daysAgo = rand() < 0.3 ? 20 + Math.floor(rand() * 60) : rand() < 0.5 ? null : 100 + Math.floor(rand() * 300);
    return {
      userId: String(p._id),
      name: p.name,
      bloodGroup: weighted(),
      area,
      phone: p.phone,
      available: rand() > 0.1,
      lastDonationDate: daysAgo == null ? null : addDays(today, -daysAgo),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
};

export const AMBULANCE_PLAN = ["AC", "Basic", "ICU", "Freezer"];
