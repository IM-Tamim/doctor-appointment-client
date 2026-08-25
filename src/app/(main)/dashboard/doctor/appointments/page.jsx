"use client";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getMyDoctorAppointments, updateAppointmentStatus, addPrescription } from "@/lib/doctors";
import toast from "react-hot-toast";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import Pagination from "@/components/shared/Pagination";
import {
    FiCalendar, FiClock, FiPhone, FiMail, FiUser, FiFileText,
    FiCheck, FiX, FiCheckCircle, FiPaperclip, FiInbox,
} from "react-icons/fi";

const PAGE_SIZE = 6;

const STATUS_BADGE = {
    pending: "badge-warning",
    confirmed: "badge-info",
    completed: "badge-success",
    cancelled: "badge-error",
};

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

/** "2026-08-30" -> "Sun, 30 Aug 2026" — raw ISO strings are hard to scan. */
const prettyDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
};

const prettyDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const isPast = (iso) => {
    if (!iso) return false;
    const d = new Date(`${iso}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
};

const Detail = ({ icon: Icon, label, value, href }) => (
    <div className="flex items-start gap-2 min-w-0">
        <Icon size={13} className="text-primary mt-0.5 shrink-0" />
        <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-base-content/40 leading-tight">{label}</p>
            {href ? (
                <a href={href} className="text-sm text-base-content hover:text-primary transition-colors break-words">
                    {value}
                </a>
            ) : (
                <p className="text-sm text-base-content break-words">{value}</p>
            )}
        </div>
    </div>
);

const CardSkeleton = () => (
    <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
        <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded skeleton-shimmer" />
                <div className="h-3 w-28 rounded skeleton-shimmer" />
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 rounded skeleton-shimmer" />
            ))}
        </div>
    </div>
);

const DoctorAppointmentsPage = () => {
    const { data: session } = authClient.useSession();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [rxOpenId, setRxOpenId] = useState(null);
    const [rxNotes, setRxNotes] = useState("");
    const [rxFileUrl, setRxFileUrl] = useState("");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);

    const load = async () => {
        if (!session) return;
        try {
            const { data: tokenData } = await authClient.token();
            const result = await getMyDoctorAppointments(tokenData?.token);
            setAppointments(Array.isArray(result) ? result : []);
        } catch {
            toast.error("Couldn't load appointments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [session]);

    const counts = useMemo(() => {
        const c = { all: appointments.length };
        for (const f of FILTERS.slice(1)) {
            c[f] = appointments.filter((a) => (a.status || "pending") === f).length;
        }
        return c;
    }, [appointments]);

    const filtered = useMemo(() => {
        const list = filter === "all"
            ? appointments
            : appointments.filter((a) => (a.status || "pending") === filter);
        // Soonest first — a doctor cares about what's next, not what's oldest.
        return [...list].sort((a, b) =>
            `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(`${b.appointmentDate} ${b.appointmentTime}`)
        );
    }, [appointments, filter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleStatus = async (id, status) => {
        setBusyId(id);
        try {
            const { data: tokenData } = await authClient.token();
            const result = await updateAppointmentStatus(id, status, tokenData?.token);
            if (result?.message && !result?.acknowledged) {
                toast.error(result.message);
                return;
            }
            toast.success(`Marked as ${status}.`);
            await load();
        } catch {
            toast.error("Couldn't update the appointment.");
        } finally {
            setBusyId(null);
        }
    };

    const handlePrescriptionSave = async (id) => {
        if (!rxNotes.trim() && !rxFileUrl) {
            toast.error("Add some notes or attach a file first.");
            return;
        }
        setBusyId(id);
        try {
            const { data: tokenData } = await authClient.token();
            const result = await addPrescription(id, { notes: rxNotes, fileUrl: rxFileUrl }, tokenData?.token);
            if (result?.message && !result?.acknowledged) {
                toast.error(result.message);
                return;
            }
            toast.success("Prescription saved.");
            setRxOpenId(null);
            setRxNotes("");
            setRxFileUrl("");
            await load();
        } catch {
            toast.error("Couldn't save the prescription.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <h1 className="text-2xl md:text-3xl font-black">
                    My <span className="text-gradient">Appointments</span>
                </h1>
                {!loading && (
                    <p className="text-sm text-base-content/50">
                        {counts.pending || 0} awaiting your response
                    </p>
                )}
            </div>

            {/* Status filters double as an at-a-glance summary. */}
            <div className="flex flex-wrap gap-2 mb-6">
                {FILTERS.map((f) => {
                    const active = filter === f;
                    return (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            aria-pressed={active}
                            className={`text-xs font-semibold capitalize px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                                active
                                    ? "bg-primary text-primary-content border-primary shadow-sm shadow-primary/25"
                                    : "bg-base-100 text-base-content/60 border-base-300 hover:border-primary/50 hover:text-primary"
                            }`}
                        >
                            {f}
                            <span className={`ml-1.5 tabular-nums ${active ? "opacity-80" : "opacity-50"}`}>
                                {counts[f] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                        <FiInbox size={24} className="text-base-content/30" />
                    </div>
                    <p className="text-base font-semibold text-base-content/60">
                        {filter === "all" ? "No appointments yet" : `No ${filter} appointments`}
                    </p>
                    <p className="text-sm text-base-content/40">
                        {filter === "all"
                            ? "Bookings from patients will appear here."
                            : "Try a different filter."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paged.map((a) => {
                            const status = a.status || "pending";
                            const busy = busyId === a._id;
                            const past = isPast(a.appointmentDate);

                            return (
                                <div
                                    key={a._id}
                                    className="bg-base-100 rounded-2xl border border-base-300 p-5 transition-colors hover:border-primary/30"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-11 h-11 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center text-sm font-black text-primary shrink-0">
                                                {(a.patientName || a.userEmail || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-base-content truncate">
                                                    {a.patientName || a.userEmail}
                                                </p>
                                                <p className="text-xs text-base-content/50">
                                                    {prettyDate(a.appointmentDate)} · {a.appointmentTime}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {past && status === "pending" && (
                                                <span className="badge badge-ghost badge-sm text-[11px]">overdue</span>
                                            )}
                                            <span className={`badge ${STATUS_BADGE[status] || "badge-ghost"} capitalize`}>
                                                {status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Everything the doctor needs before the visit. */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3.5 mt-5 pt-4 border-t border-base-300">
                                        <Detail icon={FiCalendar} label="Date" value={prettyDate(a.appointmentDate)} />
                                        <Detail icon={FiClock} label="Time" value={a.appointmentTime || "—"} />
                                        <Detail icon={FiUser} label="Gender" value={a.gender || "—"} />
                                        <Detail
                                            icon={FiPhone}
                                            label="Phone"
                                            value={a.phone || "—"}
                                            href={a.phone ? `tel:${a.phone}` : undefined}
                                        />
                                        <Detail
                                            icon={FiMail}
                                            label="Email"
                                            value={a.userEmail || "—"}
                                            href={a.userEmail ? `mailto:${a.userEmail}` : undefined}
                                        />
                                        <Detail icon={FiFileText} label="Booked on" value={prettyDateTime(a.createdAt)} />
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-[11px] uppercase tracking-wider text-base-content/40 mb-1">
                                            Reason for visit
                                        </p>
                                        <p className={`text-sm ${a.reason ? "text-base-content/80" : "text-base-content/35 italic"}`}>
                                            {a.reason || "No reason provided"}
                                        </p>
                                    </div>

                                    {a.prescription && (a.prescription.notes || a.prescription.fileUrl) && (
                                        <div className="mt-4 bg-success/5 border border-success/20 rounded-xl p-3">
                                            <p className="text-[11px] uppercase tracking-wider text-success font-semibold mb-1">
                                                Prescription
                                            </p>
                                            {a.prescription.notes && (
                                                <p className="text-sm text-base-content/75 whitespace-pre-wrap">
                                                    {a.prescription.notes}
                                                </p>
                                            )}
                                            {a.prescription.fileUrl && (
                                                <a
                                                    href={a.prescription.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1.5"
                                                >
                                                    <FiPaperclip size={11} /> View attached file
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-base-300">
                                        {status === "pending" && (
                                            <button
                                                onClick={() => handleStatus(a._id, "confirmed")}
                                                disabled={busy}
                                                className="btn btn-xs btn-info gap-1"
                                            >
                                                <FiCheck size={12} /> Confirm
                                            </button>
                                        )}
                                        {status === "confirmed" && (
                                            <button
                                                onClick={() => handleStatus(a._id, "completed")}
                                                disabled={busy}
                                                className="btn btn-xs btn-success gap-1"
                                            >
                                                <FiCheckCircle size={12} /> Mark Completed
                                            </button>
                                        )}
                                        {status !== "cancelled" && status !== "completed" && (
                                            <button
                                                onClick={() => handleStatus(a._id, "cancelled")}
                                                disabled={busy}
                                                className="btn btn-xs btn-error btn-soft gap-1"
                                            >
                                                <FiX size={12} /> Cancel
                                            </button>
                                        )}
                                        {status === "completed" && (
                                            <button
                                                onClick={() => {
                                                    setRxOpenId(rxOpenId === a._id ? null : a._id);
                                                    setRxNotes(a.prescription?.notes || "");
                                                    setRxFileUrl(a.prescription?.fileUrl || "");
                                                }}
                                                className="btn btn-xs btn-primary btn-outline gap-1"
                                            >
                                                <FiFileText size={12} />
                                                {a.prescription ? "Edit Prescription" : "Add Prescription"}
                                            </button>
                                        )}
                                        {busy && <span className="loading loading-spinner loading-xs text-primary" />}
                                    </div>

                                    {rxOpenId === a._id && (
                                        <div className="mt-4 pt-4 border-t border-base-300 space-y-3">
                                            <textarea
                                                value={rxNotes}
                                                onChange={(e) => setRxNotes(e.target.value)}
                                                placeholder="Medication, dosage, follow-up instructions…"
                                                className="textarea textarea-bordered w-full text-sm rounded-xl"
                                                rows={4}
                                            />
                                            <CloudinaryUpload
                                                label="Prescription File (optional)"
                                                value={rxFileUrl}
                                                onChange={setRxFileUrl}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handlePrescriptionSave(a._id)}
                                                    disabled={busy}
                                                    className="btn btn-xs btn-primary"
                                                >
                                                    Save
                                                </button>
                                                <button onClick={() => setRxOpenId(null)} className="btn btn-xs btn-ghost">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                </>
            )}
        </div>
    );
};

export default DoctorAppointmentsPage;
