"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiGoogle } from "react-icons/si";
import { useInNativeApp } from "@/lib/useInNativeApp";
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheck, FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { Suspense, useState } from "react";
import toast from "react-hot-toast";
import { LogoFull } from "@/components/shared/Logo";
import OtpVerify from "@/components/shared/OtpVerify";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import { useTranslations } from "next-intl";

const passwordRules = [
    {
        id: "uppercase",
        test: (v) => /[A-Z]/.test(v),
    },
    {
        id: "lowercase",
        test: (v) => /[a-z]/.test(v),
    },
    {
        id: "minLength",
        test: (v) => v.length >= 6,
    },
];

const RuleItem = ({ passed, label }) => (
    <li className={`flex items-center gap-1.5 text-xs transition-colors ${passed ? "text-success" : "text-base-content/50"}`}>
        {passed ? <FiCheck size={11} /> : <FiX size={11} />}
        {label}
    </li>
);

const SignUpForm = () => {
    const router = useRouter();
    const t = useTranslations("auth");
    const [password, setPassword] = useState("");
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    // Held outside the form: CloudinaryUpload reports the hosted URL, whether
    // the file was picked from the device or the link was pasted.
    const [photoUrl, setPhotoUrl] = useState("");
    // Set once the account exists; switches the card to the 6-digit code step.
    const [pendingEmail, setPendingEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const allRulesPassed = passwordRules.every((r) => r.test(password));

    const onSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        const formData = new FormData(e.currentTarget);
        const userData = Object.fromEntries(formData.entries());

        if (!allRulesPassed) {
            setPasswordTouched(true);
            setFormError(t("signup.fixPassword"));
            return;
        }

        setSubmitting(true);
        const { error } = await authClient.signUp.email({
            email: userData.email,
            password: userData.password,
            name: userData.name,
            image: photoUrl || undefined,
        });
        setSubmitting(false);

        if (error) {
            setFormError(error.message);
            toast.error(error.message);
        } else {
            // No session yet: the account stays locked until the emailed code
            // is entered. Verifying signs the user in.
            toast.success(t("signup.created"));
            setPendingEmail(userData.email.trim().toLowerCase());
        }
    };

    const inNativeApp = useInNativeApp();

    const handleGoogleLogin = async () => {
        const { error } = await authClient.signIn.social({
            provider: "google",
            callbackURL: "/home",
        });

        if (error) {
            toast.error(error.message);
        }
    };

    const inputClass = "w-full pl-11 pr-11 py-3 rounded-xl text-sm outline-none transition-all bg-base-200 text-base-content border border-base-300 focus:border-primary";
    const onFocus = (e) => (e.target.style.borderColor = "var(--color-primary)");
    const onBlur = (e) => (e.target.style.borderColor = "var(--color-base-300)");

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-base-200/50 brand-glow">
            <div className="w-full max-w-md animate-fade-up">

                <div className="text-center mb-8">
                    <LogoFull size={112} priority className="mx-auto shadow-lg" />
                    <h1 className="sr-only">DocAppoint</h1>
                    <p className="text-sm mt-3 text-base-content/60">{t("signup.subtitle")}</p>
                </div>

                <div className="rounded-2xl p-8 border border-base-300 bg-base-100/90 backdrop-blur-sm shadow-xl shadow-base-content/5">

                    {formError && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium flex items-start gap-2">
                            <FiX className="mt-0.5 shrink-0" size={15} />
                            {formError}
                        </div>
                    )}

                    {pendingEmail ? (
                        <OtpVerify
                            email={pendingEmail}
                            onVerified={() => router.push("/home")}
                            onBack={() => setPendingEmail("")}
                        />
                    ) : (
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                {t("name")}
                            </label>
                            <div className="relative">
                                <FiUser
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                                    size={15}
                                />
                                <input
                                    name="name"
                                    type="text"
                                    placeholder={t("namePlaceholder")}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all bg-base-200 text-base-content border border-base-300 focus:border-primary"
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    required
                                    minLength={3}
                                />
                            </div>
                        </div>

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
                                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all bg-base-200 text-base-content border border-base-300 focus:border-primary"
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                {t("photo")}
                            </label>
                            <CloudinaryUpload
                                value={photoUrl}
                                onChange={setPhotoUrl}
                                accept="image/*"
                                label=""
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                {t("password")}
                            </label>
                            <div className="relative">
                                <FiLock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                                    size={15}
                                />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${inputClass} ${passwordTouched && !allRulesPassed
                                            ? "border-primary"
                                            : passwordTouched && allRulesPassed
                                                ? "border-success"
                                                : ""
                                        }`}
                                    onFocus={onFocus}
                                    onBlur={(e) => {
                                        onBlur(e);
                                        if (password.length > 0) setPasswordTouched(true);
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <FiEye size={15} /> : <FiEyeOff size={15} />}
                                </button>
                            </div>

                            {(passwordTouched || password.length > 0) && (
                                <ul className="mt-1 flex flex-col gap-1 pl-1">
                                    {passwordRules.map((rule) => (
                                        <RuleItem
                                            key={rule.id}
                                            passed={rule.test(password)}
                                            label={t(`signup.rules.${rule.id}`)}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex gap-3 mt-1">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn btn-primary btn-outline flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                            >
                                {submitting
                                    ? <span className="loading loading-spinner loading-sm" />
                                    : <>{t("signup.submit")} <FiArrowRight size={15} /></>}
                            </button>
                            <button
                                type="reset"
                                onClick={() => {
                                    setPassword("");
                                    setPasswordTouched(false);
                                    setFormError("");
                                    setPhotoUrl("");
                                }}
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
                            {t("signup.haveAccount")}{" "}
                            <Link
                                href="/signin"
                                className="font-semibold text-secondary hover:text-info"
                            >
                                {t("signup.login")}
                            </Link>
                        </p>

                    </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const SignUpPage = () => {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-base-200">
                    <span className="loading loading-spinner text-primary"></span>
                </div>
            }
        >
            <SignUpForm />
        </Suspense>
    );
};

export default SignUpPage;