"use client";
import { useEffect, useMemo, useState } from "react";
import { updateAppointment, getDoctorById } from "@/lib/doctors";
import toast from "react-hot-toast";
import { FiX, FiCalendar, FiClock, FiAlertCircle } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const weekdayOf = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : WEEKDAYS[d.getDay()];
};

/**
 * Reschedule-only on purpose. The API only ever accepted appointmentDate,
 * appointmentTime and a cancel — the old form also offered name/gender/phone
 * fields whose edits the server silently dropped, so the UI was telling the
 * patient it had saved changes it hadn't.
 */
const UpdateModal = ({ appointment, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [doctor, setDoctor] = useState(null);
    const [loadingDoctor, setLoadingDoctor] = useState(true);
    const [date, setDate] = useState(appointment.appointmentDate || "");
    const [time, setTime] = useState(appointment.appointmentTime || "");

    const inputClass =
        "w-full px-4 py-3 rounded-xl text-sm bg-base-200 border border-base-300 text-base-content outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";
    const readOnlyClass =
        "w-full px-4 py-3 rounded-xl text-sm bg-base-200 border border-base-300 text-base-content/50 cursor-not-allowed";

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data: tokenData } = await authClient.token();
                const doc = await getDoctorById(appointment.doctorId, tokenData?.token);
                if (!cancelled) setDoctor(doc && doc._id ? doc : null);
            } catch {
                if (!cancelled) setDoctor(null);
            } finally {
                if (!cancelled) setLoadingDoctor(false);
            }
        })();
        return () => { cancelled = true; };
    }, [appointment.doctorId]);

    const workingDays = useMemo(
        () =>
            (doctor?.availability || [])
                .filter((a) => Array.isArray(a.slots) && a.slots.length > 0)
                .map((a) => a.day),
        [doctor]
    );

    const selectedWeekday = weekdayOf(date);

    // A date the doctor has explicitly blocked (leave/holiday) beats the weekly
    // pattern — mirror the server's rule so the UI can't offer a slot the API
    // will refuse.
    const isBlocked = useMemo(
        () => Boolean(date) && ((doctor?.blockedDates) || []).includes(date),
        [doctor, date]
    );

    const slots = useMemo(() => {
        if (!selectedWeekday || !doctor || isBlocked) return [];
        const forDay = (doctor.availability || []).find((a) => a.day === selectedWeekday);
        return Array.isArray(forDay?.slots) ? forDay.slots : [];
    }, [doctor, selectedWeekday, isBlocked]);

    const dateChosenButClosed = Boolean(date) && !loadingDoctor && doctor && slots.length === 0;
    const canSubmit = Boolean(date) && Boolean(time) && slots.includes(time);
    const today = new Date().toISOString().split("T")[0];

    const handleDateChange = (e) => {
        setDate(e.target.value);
        setTime("");
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        try {
            const { data: tokenData } = await authClient.token();
            const result = await updateAppointment(
                appointment._id,
                { appointmentDate: date, appointmentTime: time },
                tokenData?.token
            );

            if (result?.message && !result?.acknowledged) {
                toast.error(result.message);
                return;
            }

            toast.success("Appointment rescheduled!");
            onSuccess({ ...appointment, appointmentDate: date, appointmentTime: time });
        } catch {
            toast.error("Failed to update appointment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

            <div className="relative bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-md z-10 max-h-[90vh] overflow-y-auto animate-fade-up">

                <div className="flex items-start justify-between p-6 pb-4">
                    <div>
                        <h3 className="font-black text-xl text-base-content">Reschedule Appointment</h3>
                        <p className="text-sm text-base-content/50 mt-0.5">
                            with {appointment.doctorName}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle mt-1" aria-label="Close">
                        <FiX size={16} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="px-6 pb-6 flex flex-col gap-4">

                    {loadingDoctor ? (
                        <div className="h-11 rounded-xl skeleton-shimmer" />
                    ) : workingDays.length > 0 ? (
                        <div className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
                            <FiCalendar size={13} className="text-primary mt-0.5 shrink-0" />
                            <p className="text-base-content/70">
                                <span className="font-semibold text-base-content">Consults on:</span>{" "}
                                {workingDays.join(", ")}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2 text-xs bg-warning/10 border border-warning/30 rounded-xl px-3 py-2.5">
                            <FiAlertCircle size={13} className="text-warning mt-0.5 shrink-0" />
                            <p className="text-base-content/70">
                                Couldn&apos;t load this doctor&apos;s schedule. Try again shortly.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-base-content">Patient</label>
                        <input type="text" value={appointment.patientName || ""} readOnly className={readOnlyClass} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-base-content">
                            New date <span className="text-primary">*</span>
                        </label>
                        <input
                            type="date"
                            min={today}
                            value={date}
                            onChange={handleDateChange}
                            className={inputClass}
                            required
                        />
                        {selectedWeekday && !dateChosenButClosed && (
                            <p className="text-xs text-base-content/45">{selectedWeekday}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-base-content">
                            New time slot <span className="text-primary">*</span>
                        </label>
                        <select
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={!date || slots.length === 0}
                            required
                        >
                            <option value="" disabled>
                                {!date
                                    ? "Pick a date first"
                                    : slots.length === 0
                                        ? "No slots on this day"
                                        : "Select a time slot"}
                            </option>
                            {slots.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        {dateChosenButClosed && (
                            <p className="text-xs text-error flex items-start gap-1.5">
                                <FiAlertCircle size={12} className="mt-0.5 shrink-0" />
                                {isBlocked
                                    ? `${appointment.doctorName} has marked this date as unavailable.`
                                    : `${appointment.doctorName} doesn't consult on ${selectedWeekday}.`}
                            </p>
                        )}
                        {!dateChosenButClosed && slots.length > 0 && (
                            <p className="text-xs text-base-content/45 flex items-center gap-1.5">
                                <FiClock size={11} className="shrink-0" />
                                {slots.length} slot{slots.length !== 1 ? "s" : ""} available
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost flex-1 rounded-xl font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !canSubmit}
                            className="btn btn-primary flex-1 rounded-xl font-bold disabled:opacity-60"
                        >
                            {loading
                                ? <span className="loading loading-spinner loading-xs" />
                                : "Save Changes"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default UpdateModal;
