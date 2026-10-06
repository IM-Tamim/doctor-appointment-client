"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getDoctorById } from "@/lib/doctors";
import { rescheduleAppointment, getFollowUp } from "@/lib/appointments";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";
import SlotPicker from "@/components/pages/booking/SlotPicker";
import Modal from "./Modal";

/**
 * Reschedule: free once by default and keeps the payment. The patient's own
 * current slot shows as free so they can see the whole day.
 */
const UpdateModal = ({ appointment, onSuccess, onClose }) => {
    const t = useTranslations("reschedule");
    const tc = useTranslations("common");
    const { date: prettyDate, time: to12h, number } = useFormat();
    const [doctor, setDoctor] = useState(null);
    const [followWindow, setFollowWindow] = useState(null);
    const [slot, setSlot] = useState({ date: "", time: "", serial: null });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data: tokenData } = await authClient.token();
            const doc = await getDoctorById(appointment.doctorId, tokenData?.token).catch(() => null);
            if (cancelled) return;
            setDoctor(doc && doc._id ? doc : null);
            // Follow-ups keep their original date window.
            if (appointment.type === "follow-up" && appointment.parentAppointmentId) {
                const res = await getFollowUp(appointment.parentAppointmentId, tokenData?.token);
                if (!cancelled && res.ok) setFollowWindow(res.data.window);
            }
        })();
        return () => { cancelled = true; };
    }, [appointment]);

    const onSubmit = async () => {
        if (!slot.date || !slot.time) return;
        setBusy(true);
        const { data: tokenData } = await authClient.token();
        const res = await rescheduleAppointment(
            appointment._id,
            { appointmentDate: slot.date, appointmentTime: slot.time },
            tokenData?.token
        );
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        toast.success(t("done", { serial: number(res.data.serial) }));
        onSuccess();
    };

    return (
        <Modal
            title={t("title")}
            subtitle={t("now", { date: prettyDate(appointment.appointmentDate), time: to12h(appointment.appointmentTime), serial: appointment.serial != null ? number(appointment.serial) : "—" })}
            onClose={onClose}
            size="max-w-lg"
        >
            {!doctor ? (
                <div className="skeleton h-40 rounded-xl" />
            ) : (
                <div className="flex flex-col gap-4">
                    <p className="text-xs bg-info/10 border border-info/25 rounded-xl px-3 py-2">
                        {appointment.rescheduleCount ? t("used") : t("freeOnce")}
                    </p>
                    <SlotPicker
                        doctor={doctor}
                        value={slot}
                        onChange={setSlot}
                        exclude={appointment._id}
                        minDate={followWindow?.start}
                        maxDate={followWindow?.end}
                    />
                    <div className="flex gap-2">
                        <button onClick={onClose} className="btn btn-ghost flex-1">{tc("cancel")}</button>
                        <button onClick={onSubmit} disabled={busy || !slot.time} className="btn btn-primary flex-1">
                            {busy ? <span className="loading loading-spinner loading-xs" /> : slot.time ? t("moveTo", { time: to12h(slot.time) }) : t("pick")}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default UpdateModal;
