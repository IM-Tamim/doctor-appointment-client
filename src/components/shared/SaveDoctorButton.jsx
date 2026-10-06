"use client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useSavedDoctors } from "@/lib/useSavedDoctors";
import { useTranslations } from "next-intl";

/** Heart toggle for saving a doctor to the patient's list. */
const SaveDoctorButton = ({ doctorId, className = "" }) => {
    const { ids, toggle, signedIn } = useSavedDoctors();
    const router = useRouter();
    const t = useTranslations("doctor");
    const isSaved = ids.has(doctorId);

    const onClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!signedIn) {
            router.push("/signin");
            return;
        }
        const res = await toggle(doctorId);
        if (!res.ok) toast.error(res.message || t("saveFailed"));
        else toast.success(res.saved ? t("saved") : t("removed"));
    };

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isSaved}
            aria-label={isSaved ? t("unsave") : t("save")}
            className={`w-8 h-8 rounded-full bg-base-100/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-transform hover:scale-110 ${className}`}
        >
            {isSaved ? <FaHeart className="text-error" size={14} /> : <FaRegHeart className="text-base-content/60" size={14} />}
        </button>
    );
};

export default SaveDoctorButton;
