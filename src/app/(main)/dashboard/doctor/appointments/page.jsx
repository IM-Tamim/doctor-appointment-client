"use client";
import { useCallback, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useApiData, useNow } from "@/lib/useApiData";
import { getMyDoctorAppointments, updateAppointmentStatus, addPrescription } from "@/lib/doctors";
import { markCashReceived, downloadReceipt } from "@/lib/appointments";
import { todayISO, joinWindow, hoursUntil } from "@/lib/schedule";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";
import toast from "react-hot-toast";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import Pagination from "@/components/shared/Pagination";
import DigitalRxForm from "@/components/pages/doctor/DigitalRxForm";
import QueuePanel from "@/components/pages/doctor/QueuePanel";
import {
    FiCalendar, FiClock, FiPhone, FiMail, FiUser, FiFileText, FiCheck, FiX, FiCheckCircle,
    FiPaperclip, FiInbox, FiVideo, FiDollarSign, FiDownload, FiUserX, FiRepeat,
} from "react-icons/fi";

const PAGE_SIZE = 6;

const STATUS_BADGE = {
    pending: "badge-warning",
    confirmed: "badge-info",
    completed: "badge-success",
    cancelled: "badge-error",
    no_show: "badge-ghost",
};

const PAYMENT_BADGE = {
    paid: "badge-success",
    unpaid: "badge-warning",
    pending: "badge-warning",
    failed: "badge-error",
    refunded: "badge-info",
    partially_refunded: "badge-info",
};

const FILTERS = ["today", "all", "pending", "confirmed", "completed", "cancelled", "no_show"];

const Detail = ({ icon: Icon, label: text, value, href }) => (
    <div className="flex items-start gap-2 min-w-0">
        <Icon size={13} className="text-primary mt-0.5 shrink-0" />
        <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-base-content/40 leading-tight">{text}</p>
            {href ? (
                <a href={href} className="text-sm text-base-content hover:text-primary transition-colors break-words">{value}</a>
            ) : (
                <p className="text-sm text-base-content break-words">{value}</p>
            )}
        </div>
    </div>
);

const DoctorAppointmentsPage = () => {
    const t = useTranslations("doctorAppts");
    const tc = useTranslations("common");
    const statusName = useLabel("common.status");
    const genderName = useLabel("common.genders");
    const { locale, date: prettyDate, time: to12h, money, number } = useFormat();
    const label = (f) => (t.has(`filters.${f}`) ? t(`filters.${f}`) : statusName(f));
    const [busyId, setBusyId] = useState(null);
    const [openRx, setOpenRx] = useState(null); // { id, kind: "digital" | "file" }
    const [rxNotes, setRxNotes] = useState("");
    const [rxFileUrl, setRxFileUrl] = useState("");
    const [filter, setFilter] = useState("today");
    const [page, setPage] = useState(1);
    const today = todayISO();
    const now = useNow();

    const { data, loading, reload: load } = useApiData(async (token) => {
        const result = await getMyDoctorAppointments(token);
        if (!Array.isArray(result)) throw new Error(result?.message || t("loadFailed"));
        return result;
    });
    const appointments = useMemo(() => data || [], [data]);

    const matches = useCallback(
        (a, f) => (f === "all" ? true : f === "today" ? a.appointmentDate === today && a.isActive !== false : (a.status || "pending") === f),
        [today]
    );

    const counts = useMemo(
        () => Object.fromEntries(FILTERS.map((f) => [f, appointments.filter((a) => matches(a, f)).length])),
        [appointments, matches]
    );

    const filtered = useMemo(() => {
        const list = appointments.filter((a) => matches(a, filter));
        // Soonest first — a doctor cares about what's next, not what's oldest.
        return [...list].sort((a, b) =>
            `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(`${b.appointmentDate} ${b.appointmentTime}`)
        );
    }, [appointments, filter, matches]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const run = async (id, fn, success) => {
        setBusyId(id);
        try {
            const { data: tokenData } = await authClient.token();
            const result = await fn(tokenData?.token);
            const failed = result?.ok === false || (result?.message && !result?.acknowledged);
            if (failed) {
                toast.error(result.message);
                return;
            }
            toast.success(typeof success === "function" ? success(result) : success);
            await load();
        } catch {
            toast.error(t("updateFailed"));
        } finally {
            setBusyId(null);
        }
    };

    const setStatus = (a, status) =>
        run(a._id, (token) => updateAppointmentStatus(a._id, status, token), (r) =>
            status === "cancelled" && r.refund > 0 ? t("cancelledRefund", { amount: money(r.refund) }) : t("marked", { status: statusName(status) })
        );

    const saveFile = (id) => {
        if (!rxNotes.trim() && !rxFileUrl) return toast.error(t("needNotes"));
        run(id, (token) => addPrescription(id, { notes: rxNotes, fileUrl: rxFileUrl }, token), t("notesSaved")).then(() => setOpenRx(null));
    };

    const receipt = async (a) => {
        try {
            const { data: tokenData } = await authClient.token();
            await downloadReceipt(a, tokenData?.token, locale);
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <h1 className="text-2xl md:text-3xl font-black">
                    {t("title1")} <span className="text-gradient">{t("title2")}</span>
                </h1>
                {!loading && <p className="text-sm text-base-content/50">{t("awaiting", { count: number(counts.pending || 0) })}</p>}
            </div>

            <QueuePanel onAdvance={load} />

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
                            {label(f)}
                            <span className={`ml-1.5 tabular-nums ${active ? "opacity-80" : "opacity-50"}`}>{number(counts[f] ?? 0)}</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-4">
                    <div className="skeleton h-56 rounded-2xl" />
                    <div className="skeleton h-56 rounded-2xl" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                        <FiInbox size={24} className="text-base-content/30" />
                    </div>
                    <p className="text-base font-semibold text-base-content/60">
                        {filter === "all" ? t("empty.all") : filter === "today" ? t("empty.today") : t("empty.other", { status: statusName(filter) })}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paged.map((a) => {
                            const status = a.status || "pending";
                            const busy = busyId === a._id;
                            const online = a.consultationMode === "online";
                            const active = a.isActive !== false && ["pending", "confirmed"].includes(status);
                            const timePassed = hoursUntil(a) <= 0;
                            const unpaidOnline = online && a.paymentStatus !== "paid";
                            const { opensAt, closesAt } = joinWindow(a);
                            const canJoin = online && a.meetingUrl && active && now >= opensAt && now <= closesAt;
                            const rxOpen = openRx?.id === a._id;

                            return (
                                <div key={a._id} className="bg-base-100 rounded-2xl border border-base-300 p-5 transition-colors hover:border-primary/30">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="text-center rounded-xl bg-primary/10 px-3 py-1.5 shrink-0">
                                                <p className="text-[9px] uppercase tracking-widest text-base-content/50">{t("serial")}</p>
                                                <p className="text-xl font-black text-primary leading-tight">#{a.serial != null ? number(a.serial) : "—"}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-base-content truncate">
                                                    {a.patientName || a.userEmail}
                                                    {a.age ? <span className="font-normal text-base-content/50"> · {t("yrs", { age: number(a.age) })}</span> : null}
                                                </p>
                                                <p className="text-xs text-base-content/50">
                                                    {prettyDate(a.appointmentDate)} · {to12h(a.appointmentTime)}
                                                    {a.type === "follow-up" && ` · ${t("followUp")}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {online && <span className="badge badge-sm badge-outline badge-info gap-1"><FiVideo size={10} /> {tc("online")}</span>}
                                            {a.paymentStatus && (
                                                <span className={`badge badge-sm badge-outline ${PAYMENT_BADGE[a.paymentStatus] || ""}`}>
                                                    {tc.has(`payment.${a.paymentStatus}`) ? tc(`payment.${a.paymentStatus}`) : a.paymentStatus}{a.paymentMethod === "cash" && a.paymentStatus === "unpaid" ? ` · ${t("cash")}` : ""}
                                                </span>
                                            )}
                                            <span className={`badge badge-sm ${STATUS_BADGE[status] || "badge-ghost"} capitalize`}>{statusName(status)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3.5 mt-5 pt-4 border-t border-base-300">
                                        <Detail icon={FiUser} label={t("gender")} value={genderName(a.gender) || "—"} />
                                        <Detail icon={FiPhone} label={t("phone")} value={a.phone || "—"} href={a.phone ? `tel:${a.phone}` : undefined} />
                                        <Detail icon={FiMail} label={t("account")} value={a.userEmail || "—"} href={a.userEmail ? `mailto:${a.userEmail}` : undefined} />
                                        <Detail icon={FiDollarSign} label={t("fee")} value={a.amount ? money(a.amount) : "—"} />
                                        <Detail icon={FiFileText} label={t("receipt")} value={a.receiptNo || "—"} />
                                        <Detail icon={FiCalendar} label={t("booked")} value={a.createdAt ? new Date(a.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB") : "—"} />
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-[11px] uppercase tracking-wider text-base-content/40 mb-1">{t("reason")}</p>
                                        <p className={`text-sm ${a.reason ? "text-base-content/80" : "text-base-content/35 italic"}`}>{a.reason || t("noReason")}</p>
                                    </div>

                                    {a.prescription && (a.prescription.notes || a.prescription.fileUrl) && (
                                        <div className="mt-4 bg-success/5 border border-success/20 rounded-xl p-3">
                                            <p className="text-[11px] uppercase tracking-wider text-success font-semibold mb-1">{t("notesAttachment")}</p>
                                            {a.prescription.notes && <p className="text-sm text-base-content/75 whitespace-pre-wrap">{a.prescription.notes}</p>}
                                            {a.prescription.fileUrl && (
                                                <a href={a.prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1.5">
                                                    <FiPaperclip size={11} /> {t("viewFile")}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-base-300">
                                        {status === "pending" && active && (
                                            <button
                                                onClick={() => setStatus(a, "confirmed")}
                                                disabled={busy || unpaidOnline}
                                                title={unpaidOnline ? t("waitingPayment") : undefined}
                                                className="btn btn-xs btn-info gap-1"
                                            >
                                                <FiCheck size={12} /> {unpaidOnline ? t("awaitingPayment") : t("confirm")}
                                            </button>
                                        )}
                                        {status === "confirmed" && (
                                            <button onClick={() => setStatus(a, "completed")} disabled={busy} className="btn btn-xs btn-success gap-1">
                                                <FiCheckCircle size={12} /> {t("complete")}
                                            </button>
                                        )}
                                        {status === "confirmed" && timePassed && (
                                            <button onClick={() => setStatus(a, "no_show")} disabled={busy} className="btn btn-xs btn-ghost border-base-300 gap-1">
                                                <FiUserX size={12} /> {t("noShow")}
                                            </button>
                                        )}
                                        {a.paymentMethod === "cash" && a.paymentStatus === "unpaid" && a.isActive !== false && status !== "no_show" && (
                                            <button
                                                onClick={() => run(a._id, (token) => markCashReceived(a._id, token), t("cashRecorded"))}
                                                disabled={busy}
                                                className="btn btn-xs btn-outline gap-1"
                                            >
                                                <FiDollarSign size={12} /> {t("cashReceived")}
                                            </button>
                                        )}
                                        {canJoin && (
                                            <a href={a.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-success gap-1">
                                                <FiVideo size={12} /> {t("joinCall")}
                                            </a>
                                        )}
                                        {a.receiptNo && (
                                            <button onClick={() => receipt(a)} className="btn btn-xs btn-ghost border-base-300 gap-1">
                                                <FiDownload size={11} /> {t("receipt")}
                                            </button>
                                        )}
                                        {status === "completed" && (
                                            <>
                                                <button
                                                    onClick={() => setOpenRx(rxOpen && openRx.kind === "digital" ? null : { id: a._id, kind: "digital" })}
                                                    className="btn btn-xs btn-primary btn-outline gap-1"
                                                >
                                                    <FiFileText size={12} /> {a.prescriptionId ? t("editRx") : t("writeRx")}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setOpenRx(rxOpen && openRx.kind === "file" ? null : { id: a._id, kind: "file" });
                                                        setRxNotes(a.prescription?.notes || "");
                                                        setRxFileUrl(a.prescription?.fileUrl || "");
                                                    }}
                                                    className="btn btn-xs btn-ghost gap-1"
                                                >
                                                    <FiPaperclip size={12} /> {t("uploadFile")}
                                                </button>
                                            </>
                                        )}
                                        {active && (
                                            <button onClick={() => setStatus(a, "cancelled")} disabled={busy} className="btn btn-xs btn-error btn-soft gap-1">
                                                <FiX size={12} /> {t("cancel")}
                                            </button>
                                        )}
                                        {a.type === "follow-up" && <span className="badge badge-sm badge-ghost gap-1"><FiRepeat size={10} /> {t("followUp")}</span>}
                                        {busy && <span className="loading loading-spinner loading-xs text-primary" />}
                                    </div>

                                    {rxOpen && openRx.kind === "digital" && (
                                        <DigitalRxForm appointment={a} onSaved={() => { setOpenRx(null); load(); }} onCancel={() => setOpenRx(null)} />
                                    )}
                                    {rxOpen && openRx.kind === "file" && (
                                        <div className="mt-4 pt-4 border-t border-base-300 space-y-3">
                                            <textarea
                                                value={rxNotes}
                                                onChange={(e) => setRxNotes(e.target.value)}
                                                placeholder={t("notesPlaceholder")}
                                                aria-label={t("notes")}
                                                className="textarea textarea-bordered w-full text-sm rounded-xl"
                                                rows={3}
                                            />
                                            <CloudinaryUpload label={t("rxFile")} value={rxFileUrl} onChange={setRxFileUrl} />
                                            <div className="flex gap-2">
                                                <button onClick={() => saveFile(a._id)} disabled={busy} className="btn btn-xs btn-primary">{t("save")}</button>
                                                <button onClick={() => setOpenRx(null)} className="btn btn-xs btn-ghost">{t("close")}</button>
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
