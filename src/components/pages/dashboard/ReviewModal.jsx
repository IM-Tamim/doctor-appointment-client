"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiStar } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { addReview } from "@/lib/doctors";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";
import Modal from "./Modal";

export const StarPicker = ({ value, onChange }) => {
    const t = useTranslations("reviewDialog");
    const tr = useTranslations("reviews");
    return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={t("rating")}>
        {[1, 2, 3, 4, 5].map((s) => (
            <button
                key={s}
                type="button"
                role="radio"
                aria-checked={value === s}
                aria-label={tr("star", { count: s })}
                onClick={() => onChange(s)}
                className="transition-transform hover:scale-110"
            >
                <FiStar size={26} className={s <= value ? "text-warning fill-warning" : "text-base-300"} />
            </button>
        ))}
    </div>
    );
};

/** One review per completed appointment (enforced on the server). */
const ReviewModal = ({ appointment, onClose, onDone }) => {
    const t = useTranslations("reviewDialog");
    const { date: prettyDate } = useFormat();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!rating) return toast.error(t("pick"));
        setBusy(true);
        const { data: tokenData } = await authClient.token();
        const result = await addReview(appointment.doctorId, { rating, comment, appointmentId: appointment._id }, tokenData?.token);
        setBusy(false);
        if (result?.message && !result?.acknowledged) return toast.error(result.message);
        toast.success(t("thanks"));
        onDone();
    };

    return (
        <Modal title={t("title", { doctor: appointment.doctorName })} subtitle={t("visit", { date: prettyDate(appointment.appointmentDate) })} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <StarPicker value={rating} onChange={setRating} />
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder={t("placeholder")}
                    aria-label={t("label")}
                    className="textarea textarea-bordered w-full rounded-xl"
                    required
                />
                <button disabled={busy} className="btn btn-primary w-full">
                    {busy ? <span className="loading loading-spinner loading-xs" /> : t("submit")}
                </button>
            </form>
        </Modal>
    );
};

export default ReviewModal;
