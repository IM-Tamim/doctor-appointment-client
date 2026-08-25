"use client";
import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiMail, FiCheckCircle, FiSend } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const inputClass =
        "w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-base-200 border border-base-300 text-base-content outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Better Auth deliberately answers the same way whether or not the
            // address exists, so we mirror that and never confirm which emails
            // are registered.
            const { error } = await authClient.requestPasswordReset({
                email: email.trim(),
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) {
                toast.error(error.message || "Could not send the reset link.");
                return;
            }
            setSent(true);
        } catch {
            toast.error("Could not reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-base-200/50 brand-glow">
            <div className="w-full max-w-md animate-fade-up">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tight text-base-content">
                        Doc<span className="text-gradient">Appoint</span>
                    </h1>
                    <p className="text-sm mt-1 text-base-content/60">
                        {sent ? "Check your inbox" : "Forgot your password?"}
                    </p>
                </div>

                <div className="rounded-2xl p-8 border border-base-300 bg-base-100/90 backdrop-blur-sm shadow-xl shadow-base-content/5">

                    {sent ? (
                        <div className="flex flex-col items-center gap-5 text-center">
                            <div className="w-16 h-16 rounded-full bg-success/10 ring-1 ring-success/30 flex items-center justify-center">
                                <FiCheckCircle className="text-success" size={28} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-base-content mb-2">
                                    Reset link sent
                                </h2>
                                <p className="text-sm text-base-content/60 leading-relaxed">
                                    If an account exists for{" "}
                                    <span className="font-semibold text-base-content break-all">{email}</span>,
                                    a password reset link is on its way. It expires in 1 hour.
                                </p>
                            </div>

                            <p className="text-xs text-base-content/45">
                                Didn&apos;t get it? Check your spam folder, or{" "}
                                <button
                                    onClick={() => setSent(false)}
                                    className="text-primary font-semibold hover:underline"
                                >
                                    try another address
                                </button>
                                .
                            </p>

                            <Link
                                href="/signin"
                                className="btn btn-primary btn-outline w-full rounded-xl text-sm font-bold gap-2"
                            >
                                <FiArrowLeft size={15} /> Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={onSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col items-center gap-4 text-center mb-1">
                                <div className="w-14 h-14 rounded-full bg-primary/10 ring-1 ring-primary/25 flex items-center justify-center">
                                    <FiMail className="text-primary" size={24} />
                                </div>
                                <p className="text-sm text-base-content/60 leading-relaxed">
                                    Enter the email you registered with and we&apos;ll send you a
                                    link to set a new password.
                                </p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="reset-email"
                                    className="text-xs font-semibold uppercase tracking-widest text-base-content/60"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <FiMail
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                                        size={15}
                                    />
                                    <input
                                        id="reset-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@gmail.com"
                                        className={inputClass}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="btn btn-primary w-full rounded-xl text-sm font-bold gap-2 disabled:opacity-60"
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    <>Send reset link <FiSend size={15} /></>
                                )}
                            </button>

                            <Link
                                href="/signin"
                                className="text-xs text-center text-base-content/50 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                            >
                                <FiArrowLeft size={13} /> Back to Login
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
