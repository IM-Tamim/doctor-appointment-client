"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiGoogle } from "react-icons/si";
import { useInNativeApp } from "@/lib/useInNativeApp";
import { Suspense, useState } from "react";
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import { LogoFull } from "@/components/shared/Logo";
import OtpVerify from "@/components/shared/OtpVerify";
import { useTranslations } from "next-intl";

const SignInForm = () => {
    const router = useRouter();
    const t = useTranslations("auth");
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/home";
    const [showPassword, setShowPassword] = useState(false);
    // Set when the account exists but its email was never verified; the
    // server has already emailed a fresh code at this point.
    const [pendingEmail, setPendingEmail] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const userData = Object.fromEntries(formData.entries());

        const { data, error } = await authClient.signIn.email({
            email: userData.email,
            password: userData.password,
        });

        if (error?.code === "EMAIL_NOT_VERIFIED") {
            toast(t("signin.verifyFirst"), { icon: "✉️" });
            setPendingEmail(userData.email.trim().toLowerCase());
        } else if (error) {
            toast.error(error.message);
        } else {
            toast.success(t("signin.success"));
            router.push(callbackUrl);
        }
    };

    const inNativeApp = useInNativeApp();

    const handleGoogleLogin = async () => {
        const { error } = await authClient.signIn.social({
            provider: "google",
            callbackURL: callbackUrl,
        });

        if (error) {
            toast.error(error.message);
        }
    };

    const inputClass =
        "w-full pl-11 pr-11 py-3 rounded-xl text-sm outline-none transition-all bg-base-200 text-base-content border border-base-300 focus:border-primary";
    const onFocus = (e) => (e.target.style.borderColor = "var(--color-primary)");
    const onBlur = (e) => (e.target.style.borderColor = "var(--color-base-300)");

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-base-200/50 brand-glow">
            <div className="w-full max-w-md animate-fade-up">

                <div className="text-center mb-8">
                    <LogoFull size={112} priority className="mx-auto shadow-lg" />
                    <h1 className="sr-only">DocAppoint</h1>
                    <p className="text-sm mt-3 text-base-content/60">{t("signin.subtitle")}</p>
                </div>

                <div className="rounded-2xl p-8 border border-base-300 bg-base-100/90 backdrop-blur-sm shadow-xl shadow-base-content/5">
                    {pendingEmail ? (
                        <OtpVerify
                            email={pendingEmail}
                            onVerified={() => router.push(callbackUrl)}
                            onBack={() => setPendingEmail("")}
                        />
                    ) : (
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">


                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                {t("email")}
                            </label>
                            <div className="relative">
                                <FiMail
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                                    size={15}
                                />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="name@gmail.com"
                                    className={inputClass}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                    {t("password")}
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-primary hover:text-primary/70 font-medium transition-colors"
                                >
                                    {t("signin.forgot")}
                                </Link>
                            </div>
                            <div className="relative">
                                <FiLock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                                    size={15}
                                />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={inputClass}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <FiEye size={15} />:<FiEyeOff size={15} />}
                                </button>
                            </div>
                        </div>
        
                        <div className="flex gap-3 mt-1">
                            <button
                                type="submit"
                                className="btn btn-primary btn-outline flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                            >
                                {t("signin.submit")} <FiArrowRight size={15} />
                            </button>
                            <button
                                type="reset"
                                className="btn btn-warning btn-outline px-5 py-3 rounded-xl text-sm font-medium"
                            >
                                {t("reset")}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 my-1">
                            <div className="flex-1 h-px bg-base-300" />
                            <span className="text-xs text-base-content/60">{t("or")}</span>
                            <div className="flex-1 h-px bg-base-300" />
                        </div>

                        {/* Google blocks its OAuth flow inside embedded WebViews
                            ("disallowed_useragent"), so in the Android app the
                            handshake escapes to the system browser and the session
                            cookie lands there instead of in the app. Rather than
                            show a button that silently fails, the app gets a note
                            and uses email/password. */}
                        {inNativeApp ? (
                            <p className="text-xs text-center text-base-content/50 bg-base-200/60 border border-base-300 rounded-xl px-3 py-2.5">
                                {t("googleApp")}
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="btn btn-primary btn-soft w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                            >
                                <SiGoogle size={15} />
                                {t("google")}
                            </button>
                        )}

                        <p className="text-center text-sm text-base-content/60">
                            {t("signin.noAccount")}{" "}
                            <Link
                                href="/signup"
                                className="text-secondary font-semibold hover:text-info"
                            >
                                {t("signin.register")}
                            </Link>
                        </p>

                    </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const SignInPage = () => {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-base-200">
                    <span className="loading loading-spinner text-primary"></span>
                </div>
            }
        >
            <SignInForm />
        </Suspense>
    );
};

export default SignInPage;