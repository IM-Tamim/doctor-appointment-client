"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    FiCalendar, FiClock, FiPhone, FiUser, FiFileText, FiDownload, FiVideo, FiRepeat,
    FiCreditCard, FiEdit2, FiXCircle, FiStar, FiMapPin,
} from "react-icons/fi";
import { MdOutlineLocalHospital } from "react-icons/md";
import { authClient } from "@/lib/auth-client";
import { useApiData, useNow, unwrap } from "@/lib/useApiData";
import { getMyAppointments, getDoctorById } from "@/lib/doctors";
import { downloadReceipt, getFollowUp, getRefundPolicy } from "@/lib/appointments";
import { todayISO, joinWindow, hoursUntil } from "@/lib/schedule";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";
import Pagination from "@/components/shared/Pagination";
import BookingModal from "@/components/pages/all-appointments/BookingModal";
import UpdateModal from "./UpdateModal";
import CancelModal from "./CancelModal";
import PrescriptionModal from "./PrescriptionModal";
import ReviewModal from "./ReviewModal";
import LiveQueue from "./LiveQueue";

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

const TABS = ["upcoming", "past", "cancelled"];

const tabOf = (a) => {
    if (a.status === "cancelled" || a.isActive === false) return "cancelled";
    if (["completed", "no_show"].includes(a.status) || a.appointmentDate < todayISO()) return "past";
    return "upcoming";
};

const MyBookings = () => {
    const t = useTranslations("bookings");
    const tc = useTranslations("common");
    const statusName = useLabel("common.status");
    const relationName = useLabel("common.relations");
    const specialtyName = useLabel("common.specialties");
    const { locale, date: prettyDate, time: to12h, money, number } = useFormat();
    const [tab, setTab] = useState("upcoming");
    const [page, setPage] = useState(1);
    const [dialog, setDialog] = useState(null); // { kind, appt }
    const [followUp, setFollowUp] = useState(null); // { doctor, ctx }
    const now = useNow();
    const { data, loading, reload: load } = useApiData(async (token) => {
        const [list, policy] = await Promise.all([getMyAppointments(token), getRefundPolicy()]);
        return { appointments: Array.isArray(list) ? list : [], policy: unwrap(policy) };
    });
    const appointments = useMemo(() => data?.appointments || [], [data]);
    const freeReschedules = data?.policy?.freeReschedules ?? 1;

    const grouped = useMemo(() => {
        const g = { upcoming: [], past: [], cancelled: [] };
        for (const a of appointments) g[tabOf(a)].push(a);
        g.upcoming.sort((a, b) => `${a.appointmentDate}${a.appointmentTime}`.localeCompare(`${b.appointmentDate}${b.appointmentTime}`));
        g.past.sort((a, b) => `${b.appointmentDate}${b.appointmentTime}`.localeCompare(`${a.appointmentDate}${a.appointmentTime}`));
        return g;
    }, [appointments]);

    const list = grouped[tab];
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);

    const closeDialog = () => setDialog(null);
    const afterChange = () => {
        setDialog(null);
        load();
    };

    const receipt = async (appt) => {
        try {
            const { data: tokenData } = await authClient.token();
            await downloadReceipt(appt, tokenData?.token, locale);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const openFollowUp = async (appt) => {
        const { data: tokenData } = await authClient.token();
        const [ctx, doctor] = await Promise.all([
            getFollowUp(appt._id, tokenData?.token),
            getDoctorById(appt.doctorId, tokenData?.token).catch(() => null),
        ]);
        if (!ctx.ok) return toast.error(ctx.message);
        if (ctx.data.alreadyBooked) return toast(t("alreadyFollowUp"), { icon: "ℹ️" });
        if (!doctor?._id) return toast.error(t("noSchedule"));
        setFollowUp({ doctor, ctx: ctx.data });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <>
            <div role="tablist" className="flex flex-wrap gap-2 mb-6">
                {TABS.map((key) => (
                    <button
                        key={key}
                        role="tab"
                        aria-selected={tab === key}
                        onClick={() => { setTab(key); setPage(1); }}
                        className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                            tab === key
                                ? "bg-primary text-primary-content border-primary"
                                : "bg-base-100 text-base-content/60 border-base-300 hover:border-primary/50"
                        }`}
                    >
                        {t(`tabs.${key}`)} <span className="opacity-60 ml-1 tabular-nums">{number(grouped[key].length)}</span>
                    </button>
                ))}
            </div>

            {list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
                        <FiCalendar size={24} className="text-base-content/30" />
                    </div>
                    <p className="text-base font-semibold text-base-content/60">
                        {t(`empty.${tab}`)}
                    </p>
                    {tab === "upcoming" && (
                        <Link href="/all-appointments" className="btn btn-primary btn-sm mt-1">{t("findDoctor")}</Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE).map((appt) => {
                        const status = appt.status || "pending";
                        const active = appt.isActive !== false && ["pending", "confirmed"].includes(status);
                        const started = hoursUntil(appt) <= 0;
                        const online = appt.consultationMode === "online";
                        const awaitingPayment = active && appt.paymentMethod !== "cash" && ["unpaid", "pending"].includes(appt.paymentStatus);
                        const { opensAt, closesAt } = joinWindow(appt);
                        const canJoin = online && appt.meetingUrl && active && now >= opensAt && now <= closesAt;
                        const canReschedule = active && !started && (appt.rescheduleCount || 0) < freeReschedules;
                        const hasRx = appt.prescriptionId || appt.prescription?.notes || appt.prescription?.fileUrl;
                        const payClass = PAYMENT_BADGE[appt.paymentStatus];
                        const payLabel = payClass && tc(`payment.${appt.paymentStatus}`);

                        return (
                            <div key={appt._id} className="bg-base-100 border border-base-300 rounded-2xl p-5 flex flex-col gap-3">
                                <div className="flex items-start gap-3 pb-3 border-b border-base-300">
                                    <div className="text-center rounded-xl bg-primary/10 px-3 py-1.5 shrink-0">
                                        <p className="text-[9px] uppercase tracking-widest text-base-content/50">{t("serial")}</p>
                                        <p className="text-xl font-black text-primary leading-tight">#{appt.serial != null ? number(appt.serial) : "—"}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-base-content truncate">{appt.doctorName}</p>
                                        <p className="text-xs text-base-content/50 truncate">
                                            {specialtyName(appt.doctorSpecialty) || t("doctor")}
                                            {appt.type === "follow-up" && ` · ${t("followUp")}`}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            <span className={`badge badge-xs ${STATUS_BADGE[status] || "badge-ghost"} capitalize`}>
                                                {statusName(status)}
                                            </span>
                                            {payLabel && <span className={`badge badge-xs badge-outline ${payClass}`}>{payLabel}</span>}
                                            {online && <span className="badge badge-xs badge-outline badge-info gap-0.5"><FiVideo size={9} /> {tc("online")}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 text-xs text-base-content/65">
                                    <p className="flex items-center gap-2"><FiCalendar size={12} className="text-primary shrink-0" />{prettyDate(appt.appointmentDate)}</p>
                                    <p className="flex items-center gap-2"><FiClock size={12} className="text-primary shrink-0" />{to12h(appt.appointmentTime)}</p>
                                    <p className="flex items-center gap-2">
                                        <FiUser size={12} className="text-primary shrink-0" />
                                        {appt.patientName}
                                        {appt.relation && appt.relation !== "self" ? ` (${relationName(appt.relation)})` : ""}
                                    </p>
                                    {!online && appt.hospitalName && (
                                        <p className="flex items-center gap-2"><MdOutlineLocalHospital size={13} className="text-primary shrink-0" />{appt.hospitalName}</p>
                                    )}
                                    {appt.phone && <p className="flex items-center gap-2"><FiPhone size={12} className="text-primary shrink-0" />{appt.phone}</p>}
                                    {appt.amount > 0 && (
                                        <p className="flex items-center gap-2">
                                            <FiCreditCard size={12} className="text-primary shrink-0" />{money(appt.amount)}
                                            {appt.paymentMethod === "cash" && appt.paymentStatus === "unpaid" && ` · ${t("payAtHospital")}`}
                                            {appt.refundedAmount > 0 && ` · ${t("refunded", { amount: money(appt.refundedAmount) })}`}
                                        </p>
                                    )}
                                    {appt.cancelReason && <p className="italic text-base-content/45">“{appt.cancelReason}”</p>}
                                </div>

                                {active && appt.appointmentDate === todayISO() && <LiveQueue appointment={appt} />}

                                {awaitingPayment && (
                                    <Link href={`/payment/${appt._id}`} className="btn btn-warning btn-sm gap-1">
                                        <FiCreditCard size={13} /> {t("completePayment")}
                                    </Link>
                                )}
                                {canJoin && (
                                    <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm gap-1">
                                        <FiVideo size={13} /> {t("join")}
                                    </a>
                                )}
                                {online && appt.meetingUrl && active && !canJoin && now < opensAt && (
                                    <p className="text-[11px] text-base-content/45 flex items-center gap-1">
                                        <FiVideo size={11} /> {t("linkOpens")}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-base-300">
                                    {appt.receiptNo && (
                                        <button onClick={() => receipt(appt)} className="btn btn-xs btn-ghost border-base-300 gap-1">
                                            <FiDownload size={11} /> {t("receipt")}
                                        </button>
                                    )}
                                    {canReschedule && (
                                        <button onClick={() => setDialog({ kind: "reschedule", appt })} className="btn btn-xs btn-primary btn-outline gap-1">
                                            <FiEdit2 size={11} /> {t("reschedule")}
                                        </button>
                                    )}
                                    {active && !started && (
                                        <button onClick={() => setDialog({ kind: "cancel", appt })} className="btn btn-xs btn-error btn-outline gap-1">
                                            <FiXCircle size={11} /> {t("cancel")}
                                        </button>
                                    )}
                                    {hasRx && (
                                        <button onClick={() => setDialog({ kind: "rx", appt })} className="btn btn-xs btn-success btn-outline gap-1">
                                            <FiFileText size={11} /> {t("prescription")}
                                        </button>
                                    )}
                                    {status === "completed" && appt.prescriptionId && (
                                        <button onClick={() => openFollowUp(appt)} className="btn btn-xs btn-info btn-outline gap-1">
                                            <FiRepeat size={11} /> {t("bookFollowUp")}
                                        </button>
                                    )}
                                    {status === "completed" && !appt.reviewed && (
                                        <button onClick={() => setDialog({ kind: "review", appt })} className="btn btn-xs btn-warning btn-outline gap-1">
                                            <FiStar size={11} /> {t("review")}
                                        </button>
                                    )}
                                    {!online && active && appt.hospitalId && (
                                        <Link href={`/hospitals/${appt.hospitalId}`} className="btn btn-xs btn-ghost gap-1">
                                            <FiMapPin size={11} /> {t("hospital")}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />

            {dialog?.kind === "reschedule" && <UpdateModal appointment={dialog.appt} onSuccess={afterChange} onClose={closeDialog} />}
            {dialog?.kind === "cancel" && <CancelModal appointment={dialog.appt} onDone={afterChange} onClose={closeDialog} />}
            {dialog?.kind === "rx" && <PrescriptionModal appointment={dialog.appt} onClose={closeDialog} />}
            {dialog?.kind === "review" && <ReviewModal appointment={dialog.appt} onDone={afterChange} onClose={closeDialog} />}
            {followUp && (
                <BookingModal
                    doctor={followUp.doctor}
                    followUp={followUp.ctx}
                    open
                    onClose={() => { setFollowUp(null); load(); }}
                />
            )}
        </>
    );
};

export default MyBookings;
