"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

const inputClass =
    "w-full pl-11 pr-11 py-3 rounded-xl text-sm bg-base-200 border border-base-300 text-base-content outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

const ResetPasswordForm = () => {
    const router = useRouter();
    const params = useSearchParams();

    // Better Auth's callback lands here with ?token=...; ?error=INVALID_TOKEN
    // is what you get from an expired or already-used link.
    const token = params.get("token");
    const linkError = params.get("error");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const tooShort = password.length > 0 && password.length < 8;
    const mismatch = confirm.length > 0 && password !== confirm;
    const canSubmit = password.length >= 8 && password === confirm && Boolean(token);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        try {
            const { error } = await authClient.resetPassword({ newPassword: password, token });
            if (error) {
                toast.error(error.message || "That reset link is no longer valid.");
                return;
            }
            setDone(true);
            toast.success("Password updated. You can sign in now.");
            setTimeout(() => router.push("/signin"), 1800);
        } catch {
            toast.error("Could not reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!token || linkError) {
        return (
            <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-error/10 ring-1 ring-error/30 flex items-center justify-center">
                    <FiAlertCircle className="text-error" size={28} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-base-content mb-2">
                        This link isn&apos;t valid
                    </h2>
                    <p className="text-sm text-base-content/60 leading-relaxed">
                        Password reset links work once and expire after an hour. Request a
                        fresh one and we&apos;ll email it straight over.
                    </p>
                </div>
                <Link href="/forgot-password" className="btn btn-primary w-full rounded-xl text-sm font-bold">
                    Request a new link
                </Link>
                <Link
                    href="/signin"
                    className="text-xs text-base-content/50 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                    <FiArrowLeft size={13} /> Back to Login
                </Link>
            </div>
        );
    }

    if (done) {
        return (
            <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 ring-1 ring-success/30 flex items-center justify-center">
                    <FiCheckCircle className="text-success" size={28} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-base-content mb-2">Password updated</h2>
                    <p className="text-sm text-base-content/60">Taking you to the login page…</p>
                </div>
                <Link href="/signin" className="btn btn-primary w-full rounded-xl text-sm font-bold">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-4 text-center mb-1">
                <div className="w-14 h-14 rounded-full bg-primary/10 ring-1 ring-primary/25 flex items-center justify-center">
                    <FiLock className="text-primary" size={24} />
                </div>
                <p className="text-sm text-base-content/60 leading-relaxed">
                    Choose a new password. Use at least 8 characters.
                </p>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="new-password" className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                    New password
                </label>
                <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={15} />
                    <input
                        id="new-password"
                        type={show ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass}
                        autoComplete="new-password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                        aria-label={show ? "Hide password" : "Show password"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary transition-colors"
                    >
                        {show ? <FiEye size={15} /> : <FiEyeOff size={15} />}
                    </button>
                </div>
                {tooShort && <p className="text-xs text-error">Must be at least 8 characters.</p>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                    Confirm password
                </label>
                <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={15} />
                    <input
                        id="confirm-password"
                        type={show ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass}
                        autoComplete="new-password"
                        required
                    />
                </div>
                {mismatch && <p className="text-xs text-error">Passwords don&apos;t match.</p>}
            </div>

            <button
                type="submit"
                disabled={loading || !canSubmit}
                className="btn btn-primary w-full rounded-xl text-sm font-bold disabled:opacity-60"
            >
                {loading ? <span className="loading loading-spinner loading-xs" /> : "Update password"}
            </button>

            <Link
                href="/signin"
                className="text-xs text-center text-base-content/50 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
            >
                <FiArrowLeft size={13} /> Back to Login
            </Link>
        </form>
    );
};

const ResetPasswordPage = () => (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-base-200/50 brand-glow">
        <div className="w-full max-w-md animate-fade-up">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black tracking-tight text-base-content">
                    Doc<span className="text-gradient">Appoint</span>
                </h1>
                <p className="text-sm mt-1 text-base-content/60">Set a new password</p>
            </div>

            <div className="rounded-2xl p-8 border border-base-300 bg-base-100/90 backdrop-blur-sm shadow-xl shadow-base-content/5">
                {/* useSearchParams needs a Suspense boundary to keep this route
                    statically renderable. */}
                <Suspense fallback={<div className="h-64 rounded-xl skeleton-shimmer" />}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    </div>
);

export default ResetPasswordPage;
