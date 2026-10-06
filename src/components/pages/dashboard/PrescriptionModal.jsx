"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiDownload, FiPaperclip, FiBell, FiExternalLink } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { getAppointmentPrescription, downloadPrescription, setMedicineReminders } from "@/lib/appointments";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";
import Modal from "./Modal";

/** Digital prescription (with PDF + reminders) and/or the uploaded file fallback. */
const PrescriptionModal = ({ appointment, onClose }) => {
    const t = useTranslations("rx");
    const { locale, date: prettyDate } = useFormat();
    const [rx, setRx] = useState(undefined);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        (async () => {
            if (!appointment.prescriptionId) return setRx(null);
            const { data: tokenData } = await authClient.token();
            const res = await getAppointmentPrescription(appointment._id, tokenData?.token);
            setRx(res.ok ? res.data : null);
        })();
    }, [appointment]);

    const download = async (lang) => {
        try {
            const { data: tokenData } = await authClient.token();
            await downloadPrescription(rx, tokenData?.token, lang);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const toggleReminders = async () => {
        setBusy(true);
        const next = !rx.reminders?.enabled;
        const { data: tokenData } = await authClient.token();
        const res = await setMedicineReminders(rx._id, next, tokenData?.token);
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        setRx({ ...rx, reminders: { ...(rx.reminders || {}), enabled: next } });
        toast.success(next ? t("turnedOn") : t("turnedOff"));
    };

    const legacy = appointment.prescription;

    return (
        <Modal title={t("title")} subtitle={`${appointment.doctorName} · ${prettyDate(appointment.appointmentDate)}`} onClose={onClose} size="max-w-lg">
            {rx === undefined ? (
                <div className="skeleton h-40 rounded-xl" />
            ) : (
                <div className="space-y-5">
                    {rx && (
                        <>
                            {rx.medicines?.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr><th>{t("medicine")}</th><th>{t("dose")}</th><th>{t("when")}</th><th>{t("for")}</th></tr>
                                        </thead>
                                        <tbody>
                                            {rx.medicines.map((m, i) => (
                                                <tr key={i}>
                                                    <td className="font-semibold">{m.name}</td>
                                                    <td>{m.dose}</td>
                                                    <td className="font-mono text-xs">{m.frequency}</td>
                                                    <td>{m.duration}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {rx.tests?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-base-content/50 mb-1">{t("tests")}</p>
                                    <p className="text-sm">{rx.tests.join(", ")}</p>
                                </div>
                            )}
                            {rx.advice && (
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-base-content/50 mb-1">{t("advice")}</p>
                                    <p className="text-sm whitespace-pre-wrap">{rx.advice}</p>
                                </div>
                            )}
                            {rx.followUpDate && (
                                <p className="text-sm bg-primary/10 rounded-xl px-3 py-2">
                                    {t.rich("followUp", { date: prettyDate(rx.followUpDate), b: (c) => <b>{c}</b> })}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => download(locale)} className="btn btn-primary btn-sm gap-1"><FiDownload size={13} /> {t("pdf")}</button>
                                <button onClick={() => download(locale === "bn" ? "en" : "bn")} className="btn btn-outline btn-sm gap-1"><FiDownload size={13} /> {locale === "bn" ? t("pdfOther") : "PDF (বাংলা)"}</button>
                                <a href={rx.verifyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm gap-1">
                                    <FiExternalLink size={13} /> {t("verify")}
                                </a>
                                <button onClick={toggleReminders} disabled={busy} className={`btn btn-sm gap-1 ${rx.reminders?.enabled ? "btn-success" : "btn-ghost border-base-300"}`}>
                                    <FiBell size={13} /> {rx.reminders?.enabled ? t("remindersOn") : t("remind")}
                                </button>
                            </div>
                        </>
                    )}
                    {legacy && (legacy.notes || legacy.fileUrl) && (
                        <div className="bg-base-200 rounded-xl p-3 text-sm space-y-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-base-content/50">{t("notes")}</p>
                            {legacy.notes && <p className="whitespace-pre-wrap">{legacy.notes}</p>}
                            {legacy.fileUrl && (
                                <a href={legacy.fileUrl} target="_blank" rel="noreferrer" className="link link-primary inline-flex items-center gap-1">
                                    <FiPaperclip size={12} /> {t("file")}
                                </a>
                            )}
                        </div>
                    )}
                    {!rx && !(legacy && (legacy.notes || legacy.fileUrl)) && (
                        <p className="text-sm text-base-content/50">{t("none")}</p>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default PrescriptionModal;
