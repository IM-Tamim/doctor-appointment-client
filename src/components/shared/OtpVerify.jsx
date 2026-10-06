"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiMail, FiArrowLeft, FiCheck, FiRefreshCw } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";

const RESEND_COOLDOWN = 60;

const KNOWN_ERRORS = ["INVALID_OTP", "OTP_EXPIRED", "TOO_MANY_ATTEMPTS"];

/**
 * "Enter the 6-digit code" step, shared by sign-up and sign-in (an unverified
 * account that signs in is sent a fresh code). Verifying signs the user in —
 * the server has autoSignInAfterVerification on.
 */
const OtpVerify = ({ email, onVerified, onBack }) => {
    const t = useTranslations("auth.otp");
    const { number } = useFormat();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    // A code was just sent by sign-up / sign-in, so start on cooldown.
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const verify = async (e) => {
        e?.preventDefault();
        if (code.length !== 6) {
            setError(t("enterAll"));
            return;
        }
        setVerifying(true);
        setError("");
        const { error: err } = await authClient.emailOtp.verifyEmail({ email, otp: code });
        setVerifying(false);
        if (err) {
            setError(KNOWN_ERRORS.includes(err.code) ? t(`errors.${err.code}`) : err.message || t("failed"));
            if (err.code === "INVALID_OTP") setCode("");
            return;
        }
        toast.success(t("verified"));
        onVerified?.();
    };

    const resend = async () => {
        if (cooldown > 0 || resending) return;
        setResending(true);
        setError("");
        const { error: err } = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
        });
        setResending(false);
        if (err) {
            setError(err.message || t("sendFailed"));
            // The server says how long to wait; mirror it so the button agrees.
            const wait = Number(/(\d+) seconds/.exec(err.message || "")?.[1]);
            setCooldown(Number.isFinite(wait) && wait > 0 ? wait : RESEND_COOLDOWN);
            return;
        }
        toast.success(t("newCode"));
        setCooldown(RESEND_COOLDOWN);
    };

    return (
        <form onSubmit={verify} className="flex flex-col gap-5">
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mx-auto mb-3">
                    <FiMail size={22} className="text-primary" />
                </div>
                <h2 className="text-lg font-black text-base-content">{t("title")}</h2>
                <p className="text-sm text-base-content/60 mt-1">
                    {t.rich("sent", { email, b: (c) => <span className="font-semibold text-base-content break-all">{c}</span> })}
                </p>
            </div>

            {error && (
                <div role="alert" className="px-4 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="otp-code" className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                    {t("label")}
                </label>
                <input
                    id="otp-code"
                    ref={inputRef}
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setError("");
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="••••••"
                    className="w-full py-3.5 rounded-xl text-center text-2xl font-black tracking-[0.5em] tabular-nums outline-none bg-base-200 text-base-content border border-base-300 focus:border-primary"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="btn btn-primary w-full rounded-xl font-bold gap-2"
            >
                {verifying ? <span className="loading loading-spinner loading-sm" /> : <><FiCheck size={15} /> {t("verify")}</>}
            </button>

            <div className="flex items-center justify-between text-sm">
                {onBack ? (
                    <button type="button" onClick={onBack} className="text-base-content/60 hover:text-primary flex items-center gap-1">
                        <FiArrowLeft size={13} /> {t("back")}
                    </button>
                ) : <span />}
                <button
                    type="button"
                    onClick={resend}
                    disabled={cooldown > 0 || resending}
                    className="text-primary font-semibold flex items-center gap-1 disabled:text-base-content/40 disabled:cursor-not-allowed"
                >
                    {resending ? <span className="loading loading-spinner loading-xs" /> : <FiRefreshCw size={13} />}
                    {cooldown > 0 ? t("resendIn", { seconds: number(cooldown) }) : t("resend")}
                </button>
            </div>
        </form>
    );
};

export default OtpVerify;
