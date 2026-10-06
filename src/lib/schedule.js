// Display helpers for doctor schedules and appointment times. Booking rules are
// enforced by the API (node/lib/schedule.js); this only mirrors them for the UI.

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PER_HOUR_OPTIONS = [1, 2, 3, 4, 6];

// Appointment dates/times are Bangladesh wall-clock values (UTC+6, no DST).
const TZ = "+06:00";

const pad = (n) => String(n).padStart(2, "0");

/** Today's date in the clinic's zone, as YYYY-MM-DD. */
export const todayISO = () => new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);

export const addDaysISO = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const weekdayOf = (dateStr) =>
  dateStr ? WEEKDAYS[new Date(`${dateStr}T00:00:00Z`).getUTCDay()] : null;

/** "17:30" → "5:30 PM" */
export const to12h = (hhmm, locale = "en") => {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm || "—";
  const [h, m] = hhmm.split(":").map(Number);
  if (locale === "bn") {
    // Bangla names the part of the day instead of AM/PM: "বিকাল ৪:৩০".
    const period = h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত";
    return `${period} ${localNumber(((h + 11) % 12) + 1, "bn")}:${localNumber(pad(m), "bn")}`;
  }
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Digits in the UI language; keeps separators and decimals as given ("4.7" → "৪.৭"). */
export const localNumber = (value, locale = "en") =>
  locale === "bn" ? String(value ?? "").replace(/\d/g, (d) => BN_DIGITS[d]) : String(value ?? "");

/** Free-text experience like "12 years" / "5+ yrs", shown in the UI language. */
export const localYears = (text, locale = "en") => {
  if (locale !== "bn" || !text) return text;
  const match = String(text).match(/^\s*(\d+\+?)\s*(years?|yrs?)\s*$/i);
  return match ? `${localNumber(match[1], "bn")} বছর` : localNumber(text, "bn");
};

/** "2026-10-06" → "Tue, 6 Oct 2026" */
export const prettyDate = (iso, locale = "en") => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
};

export const slotInstant = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00${TZ}`);

export const slotMinutesOf = (doctor) => {
  const perHour = PER_HOUR_OPTIONS.includes(Number(doctor?.maxPerHour)) ? Number(doctor.maxPerHour) : 2;
  return 60 / perHour;
};

/**
 * Weekly schedule as display rows: [{ day, ranges: ["10:00–13:00", …] }].
 * Understands both the session format and the older explicit slot lists.
 */
export const scheduleRows = (doctor, locale = "en") =>
  WEEKDAYS.map((day) => {
    const entry = (doctor?.availability || []).find((a) => a.day === day);
    if (!entry) return { day, ranges: [] };
    if (Array.isArray(entry.sessions) && entry.sessions.length) {
      return { day, ranges: entry.sessions.map((s) => `${to12h(s.start, locale)} – ${to12h(s.end, locale)}`) };
    }
    return { day, ranges: (entry.slots || []).map((s) => to12h(s, locale)) };
  });

/** Weekday names for display; the stored value stays English. */
export const weekdayName = (day, locale = "en", style = "long") => {
  const index = WEEKDAYS.indexOf(day);
  if (index === -1) return day;
  // 2023-01-01 was a Sunday.
  return new Date(Date.UTC(2023, 0, 1 + index)).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { weekday: style, timeZone: "UTC" });
};

export const workingDays = (doctor) => scheduleRows(doctor).filter((r) => r.ranges.length > 0).map((r) => r.day);

/**
 * Online calls open 10 minutes before the slot and close when the slot ends.
 */
export const joinWindow = (appt) => {
  const start = slotInstant(appt.appointmentDate, appt.appointmentTime).getTime();
  return { opensAt: start - 10 * 60 * 1000, closesAt: start + (appt.slotMinutes || 30) * 60 * 1000 };
};

export const hoursUntil = (appt) =>
  (slotInstant(appt.appointmentDate, appt.appointmentTime).getTime() - Date.now()) / 3600000;
