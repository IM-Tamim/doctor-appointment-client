"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiClock, FiCreditCard, FiSmartphone, FiAlertTriangle, FiCheckCircle, FiLock } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { getAppointment, getPaymentConfig, startSslcommerz } from "@/lib/appointments";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";
import { useNow } from "@/lib/useApiData";
import { useInNativeApp } from "@/lib/useInNativeApp";

const PaymentPage = ({ params }) => {
    const { id } = use(params);
    const router = useRouter();
    const t = useTranslations("payment");
    const { date: prettyDate, time: to12h, money, number } = useFormat();
    const { data: session } = authClient.useSession();
    const [appt, setAppt] = useState(null);
    const [error, setError] = useState("");
    const [sslReady, setSslReady] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    // In the mobile app the gateway opens in the phone's browser; meanwhile
    // this screen watches the booking and moves on once the payment lands.
    const inApp = useInNativeApp();
    const [awaitingBrowser, setAwaitingBrowser] = useState(false);

    useEffect(() => {
        if (!awaitingBrowser) return;
        let stopped = false;
        const check = async () => {
            if (document.hidden) return;
            const { data: tokenData } = await authClient.token();
            const res = await getAppointment(id, tokenData?.token);
            if (!stopped && res.ok && res.data.paymentStatus === "paid") {
                router.replace(`/payment/result?status=success&appointmentId=${id}`);
            }
        };
        const timer = setInterval(check, 4000);
        document.addEventListener("visibilitychange", check);
        return () => {
            stopped = true;
            clearInterval(timer);
            document.removeEventListener("visibilitychange", check);
        };
    }, [awaitingBrowser, id, router]);

    useEffect(() => {
        if (!session) return;
        (async () => {
            const { data: tokenData } = await authClient.token();
            const [res, cfg] = await Promise.all([getAppointment(id, tokenData?.token), getPaymentConfig()]);
            if (!res.ok) setError(res.message);
            else setAppt(res.data);
            setSslReady(Boolean(cfg.ok && cfg.data.sslcommerz));
        })();
    }, [id, session]);

    // Derived from a ticking clock, so it's right the moment the booking loads.
    const now = useNow(1000);
    const left = appt?.holdExpiresAt ? Math.max(0, new Date(appt.holdExpiresAt).getTime() - now) : null;
    const minutes = Math.floor(left / 60000);
    const seconds = Math.floor((left % 60000) / 1000);

    const paySsl = async () => {
        setRedirecting(true);
        const { data: tokenData } = await authClient.token();
        const res = await startSslcommerz(id, tokenData?.token);
        if (!res.ok) {
            toast.error(res.message);
            setRedirecting(false);
            return;
        }
        if (inApp) {
            setRedirecting(false);
            setAwaitingBrowser(true);
        }
        window.location.href = res.data.url; // SSLCommerz hosted payment page
    };

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
                <FiAlertTriangle size={32} className="text-error" />
                <p className="font-semibold">{error}</p>
                <Link href="/dashboard/patient" className="btn btn-primary btn-sm">{t("myBookings")}</Link>
            </div>
        );
    }

    if (!appt) {
        return (
            <div className="max-w-lg mx-auto px-4 py-12 space-y-4">
                <div className="skeleton h-8 w-48" />
                <div className="skeleton h-48 rounded-2xl" />
                <div className="skeleton h-24 rounded-2xl" />
            </div>
        );
    }

    const paid = appt.paymentStatus === "paid";
    const expired = !paid && (!appt.isActive || appt.status === "cancelled" || (appt.holdExpiresAt && left === 0));

    return (
        <div className="min-h-screen bg-base-200/40 py-10 px-4">
            <div className="max-w-lg mx-auto space-y-5">
                <h1 className="text-2xl font-black">
                    {t("title1")} <span className="text-primary">{t("title2")}</span>
                </h1>

                <div className="bg-base-100 border border-base-300 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="font-bold truncate">{appt.doctorName}</p>
                        <p className="text-sm text-base-content/60">
                            {prettyDate(appt.appointmentDate)} · {to12h(appt.appointmentTime)} ·{" "}
                            {appt.consultationMode === "online" ? t("video") : appt.hospitalName}
                        </p>
                        <p className="text-xs text-base-content/45 mt-1">
                            {appt.patientName} · {t("receipt", { no: appt.receiptNo })}
                        </p>
                    </div>
                    <div className="text-center shrink-0">
                        <p className="text-[10px] uppercase tracking-widest text-base-content/50">{t("serial")}</p>
                        <p className="text-3xl font-black text-primary">#{number(appt.serial)}</p>
                    </div>
                </div>

                {paid ? (
                    <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center">
                        <FiCheckCircle size={32} className="text-success mx-auto mb-2" />
                        <p className="font-bold">{t("paid")}</p>
                        <Link href="/dashboard/patient" className="btn btn-primary btn-sm mt-3">{t("myBookings")}</Link>
                    </div>
                ) : expired ? (
                    <div className="bg-error/10 border border-error/30 rounded-2xl p-6 text-center">
                        <FiAlertTriangle size={28} className="text-error mx-auto mb-2" />
                        <p className="font-bold">{t("released")}</p>
                        <p className="text-sm text-base-content/60 mt-1">{t("releasedText")}</p>
                        <button onClick={() => router.push(`/doctors/${appt.doctorId}`)} className="btn btn-primary btn-sm mt-3">{t("bookAgain")}</button>
                    </div>
                ) : (
                    <>
                        {appt.holdExpiresAt && (
                            <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${left < 120000 ? "bg-error/10 text-error" : "bg-warning/10"}`} aria-live="polite">
                                <FiClock /> {t("heldFor", { time: `${number(minutes)}:${number(Math.floor(seconds / 10))}${number(seconds % 10)}` })}
                            </div>
                        )}
                        <div className="bg-base-100 border border-base-300 rounded-2xl p-5 space-y-3">
                            <div className="flex items-baseline justify-between">
                                <p className="text-sm text-base-content/60">{t("due")}</p>
                                <p className="text-3xl font-black text-primary">{money(appt.amount)}</p>
                            </div>
                            <button
                                onClick={paySsl}
                                disabled={!sslReady || redirecting}
                                className="btn btn-primary w-full gap-2"
                                title={sslReady ? undefined : t("sslOff")}
                            >
                                {redirecting ? <span className="loading loading-spinner loading-sm" /> : <FiCreditCard />}
                                {sslReady ? t("paySsl") : t("paySslOff")}
                            </button>
                            {awaitingBrowser && (
                                <p className="text-xs bg-info/10 border border-info/30 rounded-xl px-3 py-2.5 flex items-center gap-2" aria-live="polite">
                                    <span className="loading loading-spinner loading-xs text-info shrink-0" /> {t("inBrowser")}
                                </p>
                            )}
                            <Link href={`/payment/${id}/demo`} className="btn btn-outline w-full gap-2">
                                <FiSmartphone /> {t("demo")}
                            </Link>
                            <p className="text-[11px] text-base-content/45 flex items-center gap-1.5">
                                <FiLock size={11} /> {t("secure")}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;
