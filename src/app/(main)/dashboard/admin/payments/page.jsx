"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowDownLeft, FiArrowUpRight, FiTrendingUp, FiRotateCcw } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { useApiData, unwrap } from "@/lib/useApiData";
import { getLedger, getRefundPolicy, updateRefundPolicy, resetRefundPolicy } from "@/lib/appointments";
import Pagination from "@/components/shared/Pagination";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";

const METHODS = ["sslcommerz", "demo_mobile", "cash"];

const POLICY_FIELDS = [
    ["fullRefundHours", "hours"],
    ["partialRefundHours", "hours"],
    ["partialRefundPercent", "%"],
    ["doctorCancelPercent", "%"],
    ["freeReschedules", ""],
];

const RefundPolicyForm = () => {
    const t = useTranslations("admin.payments");
    const { number } = useFormat();
    const [policy, setPolicy] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        getRefundPolicy().then((res) => res.ok && setPolicy(res.data));
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        const { data: tokenData } = await authClient.token();
        const res = await updateRefundPolicy(policy, tokenData?.token);
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        setPolicy(res.data);
        toast.success(t("policyUpdated"));
    };

    const reset = async () => {
        const { data: tokenData } = await authClient.token();
        const res = await resetRefundPolicy(tokenData?.token);
        if (res.ok) {
            setPolicy(res.data);
            toast.success(t("policyReset"));
        }
    };

    if (!policy) return <div className="skeleton h-40 rounded-2xl" />;

    return (
        <form onSubmit={save} className="bg-base-100 border border-base-300 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">{t("policy")}</h2>
                <button type="button" onClick={reset} className="btn btn-ghost btn-xs gap-1"><FiRotateCcw size={11} /> {t("defaults")}</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {POLICY_FIELDS.map(([key, unit]) => (
                    <label key={key} className="text-xs text-base-content/60 flex flex-col gap-1">
                        {t(`policyFields.${key}`)}
                        <span className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                value={policy[key]}
                                onChange={(e) => setPolicy({ ...policy, [key]: e.target.value })}
                                className="input input-bordered input-sm w-full"
                            />
                            {unit && <span className="text-base-content/50">{unit === "hours" ? t("hours") : unit}</span>}
                        </span>
                    </label>
                ))}
            </div>
            <p className="text-xs text-base-content/50 mt-3">
                {t("summary", {
                    full: number(policy.fullRefundHours),
                    partial: number(policy.partialRefundHours),
                    percent: number(policy.partialRefundPercent),
                    doctor: number(policy.doctorCancelPercent),
                })}
            </p>
            <button disabled={busy} className="btn btn-primary btn-sm mt-4">
                {busy ? <span className="loading loading-spinner loading-xs" /> : t("savePolicy")}
            </button>
        </form>
    );
};

const AdminPaymentsPage = () => {
    const t = useTranslations("admin.payments");
    const { locale, money: taka } = useFormat();
    const methodName = (m) => (t.has(`methods.${m}`) ? t(`methods.${m}`) : m);
    const [filters, setFilters] = useState({ type: "", method: "", from: "", to: "" });
    const [page, setPage] = useState(1);
    const { data, error } = useApiData(
        async (token) => unwrap(await getLedger({ ...filters, page, limit: 15 }, token)),
        [filters, page]
    );

    const setFilter = (key) => (e) => {
        setFilters((f) => ({ ...f, [key]: e.target.value }));
        setPage(1);
    };

    const s = data?.summary;
    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl md:text-3xl font-black">
                {t("title1")} <span className="text-primary">{t("title2")}</span>
            </h1>

            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    { label: t("collected"), value: s?.collected, sub: t("paymentsCount", { count: s?.payments ?? 0 }), icon: FiArrowDownLeft, color: "text-success" },
                    { label: t("refunded"), value: s?.refunded, sub: t("refundsCount", { count: s?.refunds ?? 0 }), icon: FiArrowUpRight, color: "text-error" },
                    { label: t("net"), value: s?.net, sub: t("forFilter"), icon: FiTrendingUp, color: "text-primary" },
                ].map(({ label, value, sub, icon: Icon, color }) => (
                    <div key={label} className="bg-base-100 border border-base-300 rounded-2xl p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-full bg-base-200 flex items-center justify-center ${color}`}><Icon size={18} /></div>
                        <div>
                            <p className="text-2xl font-black tabular-nums">{data ? taka(value) : "—"}</p>
                            <p className="text-xs text-base-content/50">{label} · {sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl">
                <div className="flex flex-wrap gap-2 p-4 border-b border-base-300">
                    <select value={filters.type} onChange={setFilter("type")} className="select select-bordered select-sm" aria-label={t("entryType")}>
                        <option value="">{t("allEntries")}</option>
                        <option value="payment">{t("paymentsOpt")}</option>
                        <option value="refund">{t("refundsOpt")}</option>
                    </select>
                    <select value={filters.method} onChange={setFilter("method")} className="select select-bordered select-sm" aria-label={t("method")}>
                        <option value="">{t("allMethods")}</option>
                        {METHODS.map((k) => <option key={k} value={k}>{methodName(k)}</option>)}
                    </select>
                    <input type="date" value={filters.from} onChange={setFilter("from")} className="input input-bordered input-sm" aria-label={t("from")} />
                    <input type="date" value={filters.to} onChange={setFilter("to")} className="input input-bordered input-sm" aria-label={t("to")} />
                </div>

                {error ? (
                    <p className="p-6 text-sm text-error">{error}</p>
                ) : !data ? (
                    <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
                ) : data.entries.length === 0 ? (
                    <p className="p-10 text-center text-sm text-base-content/50">{t("none")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr><th>{t("when")}</th><th>{t("type")}</th><th>{t("receipt")}</th><th>{t("patient")}</th><th>{t("doctor")}</th><th>{t("methodCol")}</th><th>{t("txn")}</th><th className="text-right">{t("amount")}</th></tr>
                            </thead>
                            <tbody>
                                {data.entries.map((e) => (
                                    <tr key={e._id}>
                                        <td className="whitespace-nowrap text-xs">{new Date(e.createdAt).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</td>
                                        <td>
                                            <span className={`badge badge-sm ${e.type === "refund" ? "badge-error badge-outline" : "badge-success badge-outline"}`}>{t.has(`types.${e.type}`) ? t(`types.${e.type}`) : e.type}</span>
                                        </td>
                                        <td className="font-mono text-xs">{e.appointment?.receiptNo || "—"}</td>
                                        <td className="text-sm">{e.appointment?.patientName || "—"}</td>
                                        <td className="text-sm">
                                            {e.doctorName}
                                            {e.hospitalName && <span className="block text-[11px] text-base-content/45">{e.hospitalName}</span>}
                                        </td>
                                        <td className="text-xs">{methodName(e.method)}</td>
                                        <td className="font-mono text-[11px] max-w-36 truncate" title={e.transactionId}>{e.transactionId}</td>
                                        <td className={`text-right font-bold tabular-nums ${e.type === "refund" ? "text-error" : ""}`}>
                                            {e.type === "refund" ? "−" : ""}{taka(e.amount)}
                                            {e.note && <span className="block text-[10px] font-normal text-base-content/45 max-w-48 truncate ml-auto" title={e.note}>{e.note}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {data && <div className="pb-4"><Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>}
            </div>

            <RefundPolicyForm />
            <p className="text-xs text-base-content/45">
                {t("note")}
            </p>
        </div>
    );
};

export default AdminPaymentsPage;
