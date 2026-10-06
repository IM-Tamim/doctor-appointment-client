"use client";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getMyDoctorProfile, getMyDoctorAppointments, updateMyAvailability } from "@/lib/doctors";
import { WEEKDAYS, PER_HOUR_OPTIONS, todayISO, weekdayName } from "@/lib/schedule";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";
import toast from "react-hot-toast";
import { FiPlus, FiX, FiCalendar, FiClock, FiSlash, FiAlertTriangle, FiCopy } from "react-icons/fi";

const emptyWeek = () => WEEKDAYS.map((day) => ({ day, sessions: [] }));

const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

/** Slots a set of sessions produces — mirrors the server so the doctor sees serials before saving. */
const countSlots = (sessions, perHour) => {
    const step = 60 / perHour;
    return sessions.reduce((n, s) => {
        if (!s.start || !s.end || toMinutes(s.end) <= toMinutes(s.start)) return n;
        return n + Math.floor((toMinutes(s.end) - toMinutes(s.start)) / step);
    }, 0);
};

const sessionError = (sessions, t, to12h) => {
    const sorted = [...sessions].filter((s) => s.start || s.end).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
    for (const s of sorted) {
        if (!s.start || !s.end) return t("errNeedBoth");
        if (toMinutes(s.end) <= toMinutes(s.start)) return t("errBackwards", { start: to12h(s.start), end: to12h(s.end) });
    }
    for (let i = 1; i < sorted.length; i++) {
        if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) return t("errOverlap");
    }
    return null;
};

const DoctorAvailabilityPage = () => {
    const t = useTranslations("schedule");
    const { locale, date: prettyDate, time: to12h, number } = useFormat();
    const dayName = (day) => weekdayName(day, locale);
    const { data: session } = authClient.useSession();
    const [week, setWeek] = useState(emptyWeek());
    const [perHour, setPerHour] = useState(2);
    const [leaveDates, setLeaveDates] = useState([]);
    const [savedLeave, setSavedLeave] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [newLeave, setNewLeave] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(null); // bookings that leave would cancel

    const today = todayISO();

    useEffect(() => {
        const load = async () => {
            if (!session) return;
            try {
                const { data: tokenData } = await authClient.token();
                const [doctor, appts] = await Promise.all([
                    getMyDoctorProfile(tokenData?.token),
                    getMyDoctorAppointments(tokenData?.token),
                ]);
                setWeek(
                    WEEKDAYS.map((day) => {
                        const saved = (doctor?.availability || []).find((a) => a.day === day);
                        return { day, sessions: (saved?.sessions || []).map((s) => ({ ...s })) };
                    })
                );
                setPerHour(PER_HOUR_OPTIONS.includes(doctor?.maxPerHour) ? doctor.maxPerHour : 2);
                const leave = [...new Set([...(doctor?.leaveDates || []), ...(doctor?.blockedDates || [])])]
                    .filter((d) => d >= today)
                    .sort();
                setLeaveDates(leave);
                setSavedLeave(leave);
                setBookings(Array.isArray(appts) ? appts : []);
            } catch {
                toast.error(t("loadFailed"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session, today, t]);

    const updateSession = (day, index, field, value) =>
        setWeek((prev) =>
            prev.map((d) =>
                d.day === day
                    ? { ...d, sessions: d.sessions.map((s, i) => (i === index ? { ...s, [field]: value } : s)) }
                    : d
            )
        );

    const addSession = (day) =>
        setWeek((prev) =>
            prev.map((d) => {
                if (d.day !== day) return d;
                const last = d.sessions[d.sessions.length - 1];
                const start = last?.end && toMinutes(last.end) < 20 * 60 ? last.end : "10:00";
                const endMin = Math.min(toMinutes(start) + 180, 23 * 60 + 59);
                const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
                return { ...d, sessions: [...d.sessions, { start, end }] };
            })
        );

    const removeSession = (day, index) =>
        setWeek((prev) => prev.map((d) => (d.day === day ? { ...d, sessions: d.sessions.filter((_, i) => i !== index) } : d)));

    const copyToAll = (day) => {
        const source = week.find((d) => d.day === day)?.sessions || [];
        setWeek((prev) => prev.map((d) => (d.day === "Friday" || d.day === day ? d : { ...d, sessions: source.map((s) => ({ ...s })) })));
        toast.success(t("copied", { day: dayName(day) }));
    };

    const addLeave = () => {
        if (!newLeave) return;
        setLeaveDates((prev) => [...new Set([...prev, newLeave])].sort());
        setNewLeave("");
    };

    const errors = useMemo(
        () => Object.fromEntries(week.map((d) => [d.day, sessionError(d.sessions, t, to12h)]).filter(([, e]) => e)),
        [week, t, to12h]
    );
    const totalSlots = week.reduce((n, d) => n + countSlots(d.sessions, perHour), 0);

    // Bookings on newly added leave days — the server will cancel and refund these.
    const affected = (dates) =>
        bookings.filter(
            (b) => dates.includes(b.appointmentDate) && b.isActive !== false && ["pending", "confirmed"].includes(b.status || "pending")
        );

    const save = async (force = false) => {
        if (Object.keys(errors).length) {
            toast.error(t("fixFirst"));
            return;
        }
        const added = leaveDates.filter((d) => !savedLeave.includes(d));
        const hit = affected(added);
        if (hit.length && !force) {
            setConfirming(hit);
            return;
        }
        setConfirming(null);
        setSaving(true);
        try {
            const { data: tokenData } = await authClient.token();
            const result = await updateMyAvailability(
                { availability: week, maxPerHour: perHour, leaveDates },
                tokenData?.token
            );
            if (result?.message && !result?.acknowledged) {
                toast.error(result.message);
                return;
            }
            setSavedLeave(leaveDates);
            toast.success(
                result.cancelledCount
                    ? t("savedCancelled", { count: result.cancelledCount })
                    : t("saved")
            );
            if (result.cancelledCount) {
                const appts = await getMyDoctorAppointments(tokenData?.token);
                setBookings(Array.isArray(appts) ? appts : []);
            }
        } catch {
            toast.error(t("saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
                <div className="skeleton h-9 w-56" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-28 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-black">
                    {t("title1")} <span className="text-gradient">{t("title2")}</span>
                </h1>
                <button onClick={() => save()} disabled={saving} className="btn btn-primary btn-sm rounded-lg">
                    {saving ? <span className="loading loading-spinner loading-xs" /> : t("save")}
                </button>
            </div>
            <p className="text-sm text-base-content/50 mb-6">
                {t("weekly", { count: totalSlots })}
            </p>

            {/* ── Patients per hour ─────────────────────────────── */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5 mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="font-semibold">{t("perHour")}</p>
                    <p className="text-xs text-base-content/50">{t("perHourHint")}</p>
                </div>
                <div className="join">
                    {PER_HOUR_OPTIONS.map((n) => (
                        <button
                            key={n}
                            onClick={() => setPerHour(n)}
                            aria-pressed={perHour === n}
                            className={`btn btn-sm join-item ${perHour === n ? "btn-primary" : "btn-ghost border-base-300"}`}
                        >
                            {number(n)} <span className="text-[10px] opacity-70">{t("minutes", { minutes: number(60 / n) })}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Weekly sessions ───────────────────────────────── */}
            <div className="space-y-3">
                {week.map(({ day, sessions }) => {
                    const slots = countSlots(sessions, perHour);
                    return (
                        <div key={day} className={`bg-base-100 rounded-2xl border p-5 ${errors[day] ? "border-error/50" : "border-base-300"}`}>
                            <div className="flex items-center justify-between mb-3 gap-2">
                                <p className="font-semibold flex items-center gap-2">
                                    <FiClock size={14} className="text-primary" />
                                    {dayName(day)}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-base-content/40">
                                        {sessions.length === 0 ? t("closed") : t("slots", { count: slots })}
                                    </span>
                                    {sessions.length > 0 && (
                                        <button onClick={() => copyToAll(day)} className="btn btn-ghost btn-xs gap-1" title={t("copyTitle")}>
                                            <FiCopy size={11} /> {t("copy")}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {sessions.map((s, i) => (
                                    <div key={i} className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="time"
                                            value={s.start}
                                            onChange={(e) => updateSession(day, i, "start", e.target.value)}
                                            className="input input-bordered input-sm rounded-lg w-32"
                                            aria-label={t("start", { day: dayName(day), n: i + 1 })}
                                        />
                                        <span className="text-base-content/40 text-sm">{t("to")}</span>
                                        <input
                                            type="time"
                                            value={s.end}
                                            onChange={(e) => updateSession(day, i, "end", e.target.value)}
                                            className="input input-bordered input-sm rounded-lg w-32"
                                            aria-label={t("end", { day: dayName(day), n: i + 1 })}
                                        />
                                        <button
                                            onClick={() => removeSession(day, i)}
                                            aria-label={t("remove", { day: dayName(day), n: i + 1 })}
                                            className="btn btn-ghost btn-xs btn-circle text-error"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                ))}
                                {errors[day] && <p className="text-xs text-error">{errors[day]}</p>}
                                <button onClick={() => addSession(day)} className="btn btn-xs btn-primary btn-outline rounded-lg gap-1 mt-1">
                                    <FiPlus size={12} /> {t("addSession")}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Leave days ────────────────────────────────────── */}
            <div className="mt-8 bg-base-100 rounded-2xl border border-base-300 p-5">
                <div className="flex items-center gap-2 mb-1">
                    <FiSlash size={14} className="text-warning" />
                    <p className="font-semibold">{t("leave")}</p>
                </div>
                <p className="text-xs text-base-content/50 mb-4">
                    {t("leaveHint")}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {leaveDates.length === 0 && <span className="text-sm text-base-content/40 italic">{t("noLeave")}</span>}
                    {leaveDates.map((d) => {
                        const count = affected([d]).length;
                        return (
                            <span
                                key={d}
                                className="inline-flex items-center gap-1.5 text-sm bg-warning/10 text-base-content border border-warning/30 rounded-lg pl-3 pr-2 py-1 font-medium"
                            >
                                <FiCalendar size={12} className="text-warning" />
                                {prettyDate(d)}
                                {!savedLeave.includes(d) && count > 0 && (
                                    <span className="badge badge-error badge-xs">{t("booked", { count: number(count) })}</span>
                                )}
                                <button
                                    onClick={() => setLeaveDates((prev) => prev.filter((x) => x !== d))}
                                    aria-label={t("removeLeave", { date: prettyDate(d) })}
                                    className="text-error hover:bg-error/15 rounded p-0.5 transition-colors"
                                >
                                    <FiX size={12} />
                                </button>
                            </span>
                        );
                    })}
                </div>

                <div className="flex gap-2">
                    <input
                        type="date"
                        min={today}
                        value={newLeave}
                        onChange={(e) => setNewLeave(e.target.value)}
                        className="input input-bordered input-sm rounded-lg"
                        aria-label={t("leaveDate")}
                    />
                    <button onClick={addLeave} disabled={!newLeave} className="btn btn-sm btn-warning btn-outline rounded-lg gap-1">
                        <FiPlus size={13} /> {t("addLeave")}
                    </button>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button onClick={() => save()} disabled={saving} className="btn btn-primary rounded-xl font-bold">
                    {saving ? <span className="loading loading-spinner loading-xs" /> : t("save")}
                </button>
            </div>

            {confirming && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirming(null)} />
                    <div role="dialog" aria-modal="true" className="relative bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-md p-6 z-10">
                        <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center mb-4">
                            <FiAlertTriangle className="text-warning" size={22} />
                        </div>
                        <h3 className="font-black text-lg">{t("confirmTitle", { count: confirming.length })}</h3>
                        <p className="text-sm text-base-content/60 mt-1">
                            {t("confirmText")}
                        </p>
                        <ul className="mt-3 max-h-40 overflow-y-auto text-sm space-y-1">
                            {confirming.map((b) => (
                                <li key={b._id} className="flex justify-between gap-2 bg-base-200 rounded-lg px-3 py-1.5">
                                    <span className="truncate">#{b.serial != null ? number(b.serial) : "—"} {b.patientName}</span>
                                    <span className="text-base-content/50 shrink-0">{prettyDate(b.appointmentDate)} · {to12h(b.appointmentTime)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setConfirming(null)} className="btn btn-ghost flex-1">{t("goBack")}</button>
                            <button onClick={() => save(true)} className="btn btn-error flex-1">{t("cancelSave")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAvailabilityPage;
