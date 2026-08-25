"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiGoogle } from "react-icons/si";
import { FiUser, FiMail, FiLock, FiImage, FiArrowRight, FiCheck, FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { Suspense, useState } from "react";
import toast from "react-hot-toast";

const passwordRules = [
    {
        id: "uppercase",
        label: "At least 1 uppercase letter",
        test: (v) => /[A-Z]/.test(v),
    },
    {
        id: "lowercase",
        label: "At least 1 lowercase letter",
        test: (v) => /[a-z]/.test(v),
    },
    {
        id: "minLength",
        label: "Minimum 6 characters",
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
    const [password, setPassword] = useState("");
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const allRulesPassed = passwordRules.every((r) => r.test(password));

    const onSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        const formData = new FormData(e.currentTarget);
        const userData = Object.fromEntries(formData.entries());

        if (!allRulesPassed) {
            setPasswordTouched(true);
            setFormError("Please fix the password issues before registering.");
            return;
        }

        const { data, error } = await authClient.signUp.email({
            email: userData.email,
            password: userData.password,
            name: userData.name,
            image: userData.photo,
            callbackURL: "/signin",
        });

        if (error) {
            setFormError(error.message);
            toast.error(error.message);
        } else {
            await authClient.signOut();
            toast.success("Registration Successful!");
            router.push("/signin");
        }
    };

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
                    <h1 className="text-4xl font-black tracking-tight text-base-content">
                        Doc<span className="text-gradient">Appoint</span>
                    </h1>
                    <p className="text-sm mt-1 text-base-content/60">Create your account</p>
                </div>

                <div className="rounded-2xl p-8 border border-base-300 bg-base-100/90 backdrop-blur-sm shadow-xl shadow-base-content/5">

                    {formError && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium flex items-start gap-2">
                            <FiX className="mt-0.5 shrink-0" size={15} />
                            {formError}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="flex flex-col gap-5">

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                Name
                            </label>
                            <div className="relative">
                                <FiUser
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                                    size={15}
                                />
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="Your Full Name"
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
                                Email
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
                                Photo URL
                            </label>
                            <div className="relative">
                                <FiImage
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                                    size={15}
                                />
                                <input
                                    name="photo"
                                    type="url"
                                    placeholder="https://example.com/photo.jpg"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all bg-base-200 text-base-content border border-base-300 focus:border-primary"
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                Password
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
                                            label={rule.label}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex gap-3 mt-1">
                            <button
                                type="submit"
                                className="btn btn-primary btn-outline flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                            >
                                Register <FiArrowRight size={15} />
                            </button>
                            <button
                                type="reset"
                                onClick={() => {
                                    setPassword("");
                                    setPasswordTouched(false);
                                    setFormError("");
                                }}
                                className="btn btn-warning btn-outline px-5 py-3 rounded-xl text-sm font-medium"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="flex items-center gap-3 my-1">
                            <div className="flex-1 h-px bg-base-300" />
                            <span className="text-xs text-base-content/60">OR</span>
                            <div className="flex-1 h-px bg-base-300" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="btn btn-primary btn-soft w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                        >
                            <SiGoogle size={15} />
                            Continue with Google
                        </button>

                        <p className="text-center text-sm text-base-content/60">
                            Already have an account?{" "}
                            <Link
                                href="/signin"
                                className="font-semibold text-secondary hover:text-info"
                            >
                                Login
                            </Link>
                        </p>

                    </form>
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