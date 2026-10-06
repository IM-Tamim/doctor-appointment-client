import Link from "next/link";
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => ({ title: (await getTranslations("payment.result"))("metaTitle") });

const STATES = {
    success: {
        icon: FiCheckCircle,
        color: "text-success",
    },
    refunded: {
        icon: FiAlertTriangle,
        color: "text-warning",
    },
    cancelled: {
        icon: FiXCircle,
        color: "text-warning",
    },
    failed: {
        icon: FiXCircle,
        color: "text-error",
    },
};

const PaymentResultPage = async ({ searchParams }) => {
    const { status, appointmentId } = await searchParams;
    const key = STATES[status] ? status : "failed";
    const s = STATES[key];
    const t = await getTranslations("payment");
    const Icon = s.icon;
    const canRetry = (status === "failed" || status === "cancelled") && appointmentId;

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-base-200/40">
            <div className="max-w-md w-full bg-base-100 border border-base-300 rounded-2xl p-8 text-center shadow-sm">
                <Icon size={44} className={`mx-auto mb-3 ${s.color}`} />
                <h1 className="text-xl font-black">{t(`result.${key}.title`)}</h1>
                <p className="text-sm text-base-content/60 mt-2">{t(`result.${key}.text`)}</p>
                {key === "success" && <p className="text-xs text-base-content/45 mt-3">{t("result.backToApp")}</p>}
                <div className="flex gap-2 justify-center mt-6">
                    {canRetry && (
                        <Link href={`/payment/${appointmentId}`} className="btn btn-outline btn-sm">{t("result.retry")}</Link>
                    )}
                    <Link href="/dashboard/patient" className="btn btn-primary btn-sm">{t("myBookings")}</Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentResultPage;
