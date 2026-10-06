"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { cancelAppointment, getCancelPreview } from "@/lib/appointments";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";
import Modal from "./Modal";

/** Cancel with the refund the policy gives *right now*, fetched from the server. */
const CancelModal = ({ appointment, onClose, onDone }) => {
    const t = useTranslations("cancelDialog");
    const { date: prettyDate, time: to12h, money, number } = useFormat();
    const [preview, setPreview] = useState(null);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        (async () => {
            const { data: tokenData } = await authClient.token();
            const res = await getCancelPreview(appointment._id, tokenData?.token);
            setPreview(res.ok ? res.data : { error: res.message });
        })();
    }, [appointment._id]);

    const confirm = async () => {
        setBusy(true);
        const { data: tokenData } = await authClient.token();
        const res = await cancelAppointment(appointment._id, reason, tokenData?.token);
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        toast.success(res.data.refund > 0 ? t("cancelledRefund", { amount: money(res.data.refund) }) : t("cancelled"));
        onDone();
    };

    const p = preview?.policy;
    return (
        <Modal
            title={t("title")}
            subtitle={t("when", { doctor: appointment.doctorName, date: prettyDate(appointment.appointmentDate), time: to12h(appointment.appointmentTime) })}
            onClose={onClose}
        >
            {!preview ? (
                <div className="skeleton h-24 rounded-xl" />
            ) : preview.error ? (
                <p className="text-sm text-error">{preview.error}</p>
            ) : (
                <div className="space-y-4">
                    {preview.paid > 0 ? (
                        <div className={`rounded-xl p-4 ${preview.refundAmount > 0 ? "bg-success/10" : "bg-error/10"}`}>
                            <p className="text-sm">
                                {t.rich("youPaid", { paid: money(preview.paid), percent: number(preview.refundPercent), refund: money(preview.refundAmount), b: (c) => <b>{c}</b> })}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-base-content/60">{t("nothingPaid")}</p>
                    )}
                    {p && (
                        <ul className="text-xs text-base-content/55 space-y-0.5">
                            <li>{t("full", { hours: number(p.fullRefundHours) })}</li>
                            <li>{t("partial", { from: number(p.partialRefundHours), to: number(p.fullRefundHours), percent: number(p.partialRefundPercent) })}</li>
                            <li>{t("none", { hours: number(p.partialRefundHours) })}</li>
                            {p.freeReschedules > 0 && <li>{t("reschedule", { count: p.freeReschedules })}</li>}
                        </ul>
                    )}
                    <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t("reason")}
                        aria-label={t("reasonLabel")}
                        className="input input-bordered w-full rounded-xl"
                    />
                    <div className="flex gap-2">
                        <button onClick={onClose} className="btn btn-ghost flex-1">{t("keep")}</button>
                        <button onClick={confirm} disabled={busy} className="btn btn-error flex-1">
                            {busy ? <span className="loading loading-spinner loading-xs" /> : t("title")}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CancelModal;
