"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiSmartphone, FiArrowLeft, FiInfo } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { getAppointment, startDemoPayment, confirmDemoPayment } from "@/lib/appointments";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";

/**
 * A self-made SIMULATION of a mobile-banking checkout. No real wallet or brand
 * is involved and no money moves; it exists so the paid flow can be tried
 * without gateway credentials. It ends in the same "paid" state as SSLCommerz.
 */
const DemoWalletPage = ({ params }) => {
    const { id } = use(params);
    const router = useRouter();
    const t = useTranslations("payment.wallet");
    const { money } = useFormat();
    const { data: session } = authClient.useSession();
    const [appt, setAppt] = useState(null);
    const [step, setStep] = useState("phone");
    const [phone, setPhone] = useState("");
    const [demoOtp, setDemoOtp] = useState("");
    const [otp, setOtp] = useState("");
    const [pin, setPin] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!session) return;
        (async () => {
            const { data: tokenData } = await authClient.token();
            const res = await getAppointment(id, tokenData?.token);
            if (res.ok) {
                setAppt(res.data);
                setPhone(res.data.phone || "");
            } else toast.error(res.message);
        })();
    }, [id, session]);

    const sendCode = async (e) => {
        e.preventDefault();
        setBusy(true);
        const { data: tokenData } = await authClient.token();
        const res = await startDemoPayment(id, phone, tokenData?.token);
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        setDemoOtp(res.data.demoOtp);
        setStep("verify");
    };

    const confirm = async (e) => {
        e.preventDefault();
        setBusy(true);
        const { data: tokenData } = await authClient.token();
        const res = await confirmDemoPayment(id, otp, pin, tokenData?.token);
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        router.replace(`/payment/result?status=success&appointmentId=${id}`);
    };

    const field = "w-full px-4 py-3 rounded-xl text-sm bg-base-200 border border-base-300 outline-none focus:border-primary";

    return (
        <div className="min-h-screen bg-base-200/40 py-10 px-4">
            <div className="max-w-md mx-auto">
                <Link href={`/payment/${id}`} className="text-xs text-base-content/50 hover:text-primary inline-flex items-center gap-1 mb-4">
                    <FiArrowLeft size={12} /> {t("back")}
                </Link>

                <div className="rounded-2xl overflow-hidden border-2 border-dashed border-warning bg-base-100 shadow-xl">
                    <div className="bg-warning text-warning-content px-5 py-3 flex items-center justify-between">
                        <span className="font-black tracking-widest">{t("badge")}</span>
                        <span className="text-xs font-bold bg-black/10 rounded-full px-2 py-0.5">{t("sim")}</span>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-base-content/60">{t("merchant")}</span>
                            <span className="font-semibold">DocAppoint</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-base-content/60">{t("payTo")}</span>
                            <span className="font-semibold truncate ml-4">{appt?.doctorName || "…"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60 text-sm">{t("amount")}</span>
                            <span className="text-3xl font-black">{appt ? money(appt.amount) : "—"}</span>
                        </div>

                        {step === "phone" ? (
                            <form onSubmit={sendCode} className="space-y-3">
                                <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60" htmlFor="demo-phone">
                                    {t("number")}
                                </label>
                                <div className="relative">
                                    <FiSmartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-warning" />
                                    <input
                                        id="demo-phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        inputMode="numeric"
                                        placeholder="01XXXXXXXXX"
                                        className={`${field} pl-10`}
                                        required
                                    />
                                </div>
                                <button disabled={busy || !appt} className="btn btn-warning w-full">
                                    {busy ? <span className="loading loading-spinner loading-sm" /> : t("send")}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={confirm} className="space-y-3">
                                <div className="rounded-xl bg-warning/15 border border-warning/40 px-4 py-3 text-sm flex gap-2">
                                    <FiInfo className="text-warning mt-0.5 shrink-0" />
                                    <span>
                                        {t("shown")}{" "}
                                        <b className="font-mono tracking-widest">{demoOtp}</b>
                                    </span>
                                </div>
                                <input
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder={t("code")}
                                    aria-label={t("codeLabel")}
                                    className={`${field} text-center tracking-[0.4em] font-bold`}
                                    required
                                />
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder={t("pin")}
                                    aria-label={t("pinLabel")}
                                    className={`${field} text-center tracking-[0.4em]`}
                                    required
                                />
                                <button disabled={busy} className="btn btn-warning w-full">
                                    {busy ? <span className="loading loading-spinner loading-sm" /> : t("pay", { amount: appt ? money(appt.amount) : "" })}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
                <p className="text-[11px] text-base-content/45 mt-3 text-center">
                    {t("note")}
                </p>
            </div>
        </div>
    );
};

export default DemoWalletPage;
