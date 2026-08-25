"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getMyDoctorProfile, updateMyAvailability } from "@/lib/doctors";
import toast from "react-hot-toast";
import { FiPlus, FiX, FiCalendar, FiClock, FiSlash } from "react-icons/fi";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const emptyAvailability = () => DAYS.map((day) => ({ day, slots: [] }));

const prettyDate = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const DoctorAvailabilityPage = () => {
    const { data: session } = authClient.useSession();
    const [availability, setAvailability] = useState(emptyAvailability());
    const [blockedDates, setBlockedDates] = useState([]);
    const [newSlot, setNewSlot] = useState({});
    const [newBlocked, setNewBlocked] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        const load = async () => {
            if (!session) return;
            try {
                const { data: tokenData } = await authClient.token();
                const doctor = await getMyDoctorProfile(tokenData?.token);
                if (doctor?.availability?.length) {
                    // Merge saved days over the 7-day scaffold so every day renders.
                    setAvailability(
                        DAYS.map((day) => doctor.availability.find((a) => a.day === day) || { day, slots: [] })
                    );
                }
                if (Array.isArray(doctor?.blockedDates)) {
                    // Past days off are noise — only show upcoming ones.
                    setBlockedDates(doctor.blockedDates.filter((d) => d >= today).sort());
                }
            } catch {
                toast.error("Couldn't load your schedule.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session, today]);

    const addSlot = (day) => {
        const slot = newSlot[day];
        if (!slot) return;
        setAvailability((prev) =>
            prev.map((d) =>
                d.day === day
                    ? { ...d, slots: [...new Set([...d.slots, slot])].sort() }
                    : d
            )
        );
        setNewSlot((prev) => ({ ...prev, [day]: "" }));
    };

    const removeSlot = (day, slot) => {
        setAvailability((prev) =>
            prev.map((d) => (d.day === day ? { ...d, slots: d.slots.filter((s) => s !== slot) } : d))
        );
    };

    const addBlockedDate = () => {
        if (!newBlocked) return;
        setBlockedDates((prev) => [...new Set([...prev, newBlocked])].sort());
        setNewBlocked("");
    };

    const removeBlockedDate = (date) =>
        setBlockedDates((prev) => prev.filter((d) => d !== date));

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: tokenData } = await authClient.token();
            const result = await updateMyAvailability(
                { availability, blockedDates },
                tokenData?.token
            );
            if (result?.message && !result?.acknowledged) {
                toast.error(result.message);
                return;
            }
            toast.success("Schedule updated.");
        } catch {
            toast.error("Failed to save your schedule.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
                <div className="h-9 w-56 rounded skeleton-shimmer" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />
                ))}
            </div>
        );
    }

    const totalSlots = availability.reduce((n, d) => n + d.slots.length, 0);

    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-black">
                    My <span className="text-gradient">Availability</span>
                </h1>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm rounded-lg">
                    {saving ? <span className="loading loading-spinner loading-xs" /> : "Save Changes"}
                </button>
            </div>
            <p className="text-sm text-base-content/50 mb-8">
                {totalSlots} slot{totalSlots !== 1 ? "s" : ""} across the week
                {blockedDates.length > 0 && ` · ${blockedDates.length} day off scheduled`}
                . Patients can only book the times listed here.
            </p>

            {/* ── Weekly pattern ─────────────────────────────────── */}
            <div className="space-y-4">
                {availability.map(({ day, slots }) => (
                    <div key={day} className="bg-base-100 rounded-2xl border border-base-300 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold flex items-center gap-2">
                                <FiClock size={14} className="text-primary" />
                                {day}
                            </p>
                            <span className="text-xs text-base-content/40">
                                {slots.length} slot{slots.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {slots.length === 0 && (
                                <span className="text-sm text-base-content/40 italic">
                                    Closed — no bookings accepted
                                </span>
                            )}
                            {slots.map((s) => (
                                <span
                                    key={s}
                                    className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary border border-primary/25 rounded-lg pl-3 pr-2 py-1 font-medium"
                                >
                                    {s}
                                    <button
                                        onClick={() => removeSlot(day, s)}
                                        aria-label={`Remove ${s} on ${day}`}
                                        className="text-error hover:bg-error/15 rounded p-0.5 transition-colors"
                                    >
                                        <FiX size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="time"
                                value={newSlot[day] || ""}
                                onChange={(e) => setNewSlot((prev) => ({ ...prev, [day]: e.target.value }))}
                                className="input input-bordered input-sm rounded-lg"
                                aria-label={`New slot time for ${day}`}
                            />
                            <button
                                onClick={() => addSlot(day)}
                                disabled={!newSlot[day]}
                                className="btn btn-sm btn-primary btn-outline rounded-lg gap-1 disabled:opacity-50"
                            >
                                <FiPlus size={13} /> Add Slot
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── One-off days off ───────────────────────────────── */}
            <div className="mt-8 bg-base-100 rounded-2xl border border-base-300 p-5">
                <div className="flex items-center gap-2 mb-1">
                    <FiSlash size={14} className="text-warning" />
                    <p className="font-semibold">Time off</p>
                </div>
                <p className="text-xs text-base-content/50 mb-4">
                    Block specific dates — holidays, leave, conferences. These override
                    your weekly pattern, so patients can&apos;t book them even if the
                    weekday normally has slots.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {blockedDates.length === 0 && (
                        <span className="text-sm text-base-content/40 italic">
                            No upcoming days off
                        </span>
                    )}
                    {blockedDates.map((d) => (
                        <span
                            key={d}
                            className="inline-flex items-center gap-1.5 text-sm bg-warning/10 text-base-content border border-warning/30 rounded-lg pl-3 pr-2 py-1 font-medium"
                        >
                            <FiCalendar size={12} className="text-warning" />
                            {prettyDate(d)}
                            <button
                                onClick={() => removeBlockedDate(d)}
                                aria-label={`Remove day off on ${d}`}
                                className="text-error hover:bg-error/15 rounded p-0.5 transition-colors"
                            >
                                <FiX size={12} />
                            </button>
                        </span>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        type="date"
                        min={today}
                        value={newBlocked}
                        onChange={(e) => setNewBlocked(e.target.value)}
                        className="input input-bordered input-sm rounded-lg"
                        aria-label="Date to block"
                    />
                    <button
                        onClick={addBlockedDate}
                        disabled={!newBlocked}
                        className="btn btn-sm btn-warning btn-outline rounded-lg gap-1 disabled:opacity-50"
                    >
                        <FiPlus size={13} /> Block Date
                    </button>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button onClick={handleSave} disabled={saving} className="btn btn-primary rounded-xl font-bold">
                    {saving ? <span className="loading loading-spinner loading-xs" /> : "Save Changes"}
                </button>
            </div>
        </div>
    );
};

export default DoctorAvailabilityPage;
