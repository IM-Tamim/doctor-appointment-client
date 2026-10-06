"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { hardSignOut } from "@/lib/hardSignOut";
import { getPendingDoctors, approveDoctor, rejectDoctor } from "@/lib/admin";
import toast from "react-hot-toast";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";

const AdminDoctorsPage = () => {
    const ta = useTranslations("admin");
    const t = useTranslations("admin.approvals");
    const tc = useTranslations("common");
    const specialtyName = useLabel("common.specialties");
    const { locale, money, years } = useFormat();
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [pending, setPending] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [reason, setReason] = useState("");

    const load = async () => {
        if (!session) return;
        setLoading(true);
        setError("");
        try {
            const { data: tokenData, error: tokenError } = await authClient.token();
            if (tokenError || !tokenData?.token) {
                setError(ta("tokenError", { reason: tokenError?.message || ta("noToken") }));
                setLoading(false);
                return;
            }
            const result = await getPendingDoctors(tokenData.token);
            if (Array.isArray(result)) {
                setPending(result);
            } else {
                setError(result?.message || ta("unexpected"));
                setPending([]);
            }
        } catch {
            setError(ta("unreachable"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [session]);

    const handleRepairSession = async () => {
        await hardSignOut(`/signin?callbackUrl=/dashboard/admin/doctors`);
    };

    const handleApprove = async (id) => {
        setBusyId(id);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            await approveDoctor(id, token);
            toast.success(t("approved"));
            setPending((prev) => prev.filter((d) => d._id !== id));
        } catch {
            toast.error(t("approveFailed"));
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (id) => {
        setBusyId(id);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            await rejectDoctor(id, reason, token);
            toast.success(t("rejected"));
            setPending((prev) => prev.filter((d) => d._id !== id));
            setRejectingId(null);
            setReason("");
        } catch {
            toast.error(t("rejectFailed"));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-8">
                {t("title1")} <span className="text-primary">{t("title2")}</span>
            </h1>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary" />
                </div>
            ) : error ? (
                <div className="alert alert-primary/10 border border-primary/30 rounded-2xl flex-col items-start gap-3">
                    <p className="text-sm">
                        <span className="font-bold">{t("loadFailed")}</span> {error}
                    </p>
                    <button onClick={handleRepairSession} className="btn btn-sm btn-primary">
                        {ta("relogin")}
                    </button>
                </div>
            ) : pending.length === 0 ? (
                <div className="text-center py-16 text-base-content/50">
                    {t("none")}
                </div>
            ) : (
                <div className="space-y-4">
                    {pending.map((d) => (
                        <div key={d._id} className="bg-base-100 rounded-2xl border border-base-300 p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-lg">{d.name}</h3>
                                    <p className="text-sm text-base-content/60">{d.email}</p>
                                    <p className="text-sm text-base-content/60">{d.phone || t("noPhone")}</p>
                                    <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        <p><span className="text-base-content/50">{t("specialty")}</span> {specialtyName(d.specialty)}</p>
                                        <p><span className="text-base-content/50">{t("degree")}</span> {d.degree}</p>
                                        <p><span className="text-base-content/50">{t("regNo")}</span> {d.registrationNumber}</p>
                                        <p><span className="text-base-content/50">{t("hospital")}</span> {d.hospital || t("independent")}</p>
                                        <p><span className="text-base-content/50">{t("experience")}</span> {years(d.experience) || t("notSpecified")}</p>
                                        <p><span className="text-base-content/50">{t("location")}</span> {d.location || t("notSpecified")}</p>
                                        <p><span className="text-base-content/50">{t("fee")}</span> {money(d.fee)}</p>
                                        <p><span className="text-base-content/50">{t("applied")}</span> {d.createdAt ? new Date(d.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB") : "—"}</p>
                                    </div>
                                    {d.bio && <p className="text-sm mt-3 text-base-content/70">{d.bio}</p>}
                                    {d.credentialImageUrl && (
                                        <a
                                            href={d.credentialImageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="link link-primary text-sm mt-2 inline-block"
                                        >
                                            {t("credential")}
                                        </a>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleApprove(d._id)}
                                        disabled={busyId === d._id}
                                        className="btn btn-sm btn-success text-success-content"
                                    >
                                        <FaCheck size={12} /> {t("approve")}
                                    </button>
                                    <button
                                        onClick={() => setRejectingId(d._id)}
                                        disabled={busyId === d._id}
                                        className="btn btn-sm btn-error btn-soft"
                                    >
                                        <FaTimes size={12} /> {t("reject")}
                                    </button>
                                </div>
                            </div>

                            {rejectingId === d._id && (
                                <div className="mt-4 pt-4 border-t border-base-300 flex gap-2">
                                    <input
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder={t("reasonHint")}
                                        className="input input-bordered input-sm flex-1"
                                    />
                                    <button
                                        onClick={() => handleReject(d._id)}
                                        disabled={busyId === d._id}
                                        className="btn btn-sm btn-primary"
                                    >
                                        {t("confirmReject")}
                                    </button>
                                    <button
                                        onClick={() => { setRejectingId(null); setReason(""); }}
                                        className="btn btn-sm btn-ghost"
                                    >
                                        {tc("cancel")}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDoctorsPage;
