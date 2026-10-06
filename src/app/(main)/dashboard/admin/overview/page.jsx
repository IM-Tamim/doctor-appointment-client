"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { getAdminStats } from "@/lib/admin";
import { api } from "@/lib/http";
import { useApiData, unwrap } from "@/lib/useApiData";
import { hardSignOut } from "@/lib/hardSignOut";
import { FaUserInjured, FaUserMd, FaHourglassHalf, FaCalendarCheck } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";

// recharts is heavy and only this page uses it — keep it out of every other bundle.
const AnalyticsCharts = dynamic(() => import("@/components/pages/admin/AnalyticsCharts"), {
    ssr: false,
    loading: () => (
        <div className="grid lg:grid-cols-2 gap-5">
            <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
        </div>
    ),
});

const CARDS = [
    { key: "totalPatients", icon: FaUserInjured, color: "text-info" },
    { key: "totalDoctors", icon: FaUserMd, color: "text-success" },
    { key: "pendingDoctors", icon: FaHourglassHalf, color: "text-warning" },
    { key: "totalAppointments", icon: FaCalendarCheck, color: "text-primary" },
];

const RANGES = [7, 30, 90, 365];

const AdminOverviewPage = () => {
    const ta = useTranslations("admin");
    const t = useTranslations("admin.overview");
    const specialtyName = useLabel("common.specialties");
    const { locale, date, money, number } = useFormat();
    const taka = (n) => money(Math.round(n || 0));
    const pct = (r) => `${(r * 100).toLocaleString(locale === "bn" ? "bn-BD" : "en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    const [days, setDays] = useState(30);

    const stats = useApiData(async (token) => {
        const result = await getAdminStats(token);
        if (result?.message) throw new Error(result.message);
        return result;
    });
    const analytics = useApiData(async (token) => unwrap(await api(`/admin/analytics?days=${days}`, { token })), [days]);
    const a = analytics.data;

    const handleRepairSession = async () => {
        await hardSignOut(`/signin?callbackUrl=/dashboard/admin/overview`);
    };

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl md:text-3xl font-black">
                {t("title1")} <span className="text-primary">{t("title2")}</span>
            </h1>

            {stats.error ? (
                <div className="alert border border-primary/30 rounded-2xl flex-col items-start gap-3">
                    <p className="text-sm">
                        <span className="font-bold">{t("statsFailed")}</span> {stats.error}
                    </p>
                    <button onClick={handleRepairSession} className="btn btn-sm btn-primary">
                        {ta("relogin")}
                    </button>
                </div>
            ) : (
                <>
                {/* These four are live totals for the whole platform, not the
                    range below — labelling them stops the range buttons looking
                    broken when these numbers stay put. */}
                <p className="text-xs font-semibold uppercase tracking-widest text-base-content/45">{t("allTime")}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CARDS.map(({ key, icon: Icon, color }) => (
                        <div key={key} className="bg-base-100 rounded-2xl border border-base-300 p-5 flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-full bg-base-200 flex items-center justify-center ${color}`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                {stats.loading ? <div className="skeleton h-7 w-12" /> : <p className="text-2xl font-black">{number(stats.data?.[key] ?? 0)}</p>}
                                <p className="text-xs text-base-content/60">{t(`cards.${key}`)}</p>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black">{t("analytics")}</h2>
                    {a && <span className="text-xs text-base-content/50">{date(a.range.from)} → {date(a.range.to)}</span>}
                    {analytics.refreshing && <span className="loading loading-spinner loading-xs text-primary" />}
                </div>
                <div className="join" role="group" aria-label={t("range")}>
                    {RANGES.map((r) => (
                        <button
                            key={r}
                            onClick={() => setDays(r)}
                            aria-pressed={days === r}
                            className={`btn btn-sm join-item ${days === r ? "btn-primary" : "btn-ghost border-base-300"}`}
                        >
                            {r === 365 ? t("year") : t("days", { count: number(r) })}
                        </button>
                    ))}
                </div>
            </div>

            {analytics.error ? (
                <p className="text-sm text-error">{analytics.error}</p>
            ) : !a ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                </div>
            ) : (
                <div className={analytics.refreshing ? "opacity-60 transition-opacity space-y-6" : "transition-opacity space-y-6"}>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: t("net"), value: taka(a.totals.revenue), hint: t("refunded", { amount: taka(a.totals.refunded) }) },
                            { label: t("bookings"), value: number(a.totals.bookings), hint: a.range.days === 365 ? t("year") : t("days", { count: number(a.range.days) }) },
                            { label: t("cancelRate"), value: pct(a.totals.cancellationRate), hint: t("cancelled", { count: number(a.totals.status.cancelled || 0) }) },
                            { label: t("noShowRate"), value: pct(a.totals.noShowRate), hint: t("visits", { noShow: number(a.totals.status.no_show || 0), total: number((a.totals.status.completed || 0) + (a.totals.status.no_show || 0)) }) },
                        ].map((tile) => (
                            <div key={tile.label} className="bg-base-100 rounded-2xl border border-base-300 p-5">
                                <p className="text-xs text-base-content/55">{tile.label}</p>
                                <p className="text-3xl font-black tabular-nums mt-1">{tile.value}</p>
                                <p className="text-[11px] text-base-content/45 mt-1">{tile.hint}</p>
                            </div>
                        ))}
                    </div>

                    <AnalyticsCharts data={a} />

                    <section className="bg-base-100 border border-base-300 rounded-2xl p-5">
                        <h2 className="font-bold text-sm mb-3">{t("topDoctors")}</h2>
                        {a.topDoctors.length === 0 ? (
                            <p className="text-sm text-base-content/50">{t("noBookings")}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-sm">
                                    <thead>
                                        <tr><th>#</th><th>{t("doctor")}</th><th>{t("specialty")}</th><th className="text-right">{t("bookings")}</th><th className="text-right">{t("completed")}</th><th className="text-right">{t("revenue")}</th><th className="text-right">{t("rating")}</th></tr>
                                    </thead>
                                    <tbody>
                                        {a.topDoctors.map((d, i) => (
                                            <tr key={d.doctorId}>
                                                <td className="text-base-content/50">{number(i + 1)}</td>
                                                <td className="font-semibold">{d.name}</td>
                                                <td className="text-base-content/70">{specialtyName(d.specialty)}</td>
                                                <td className="text-right tabular-nums">{number(d.bookings)}</td>
                                                <td className="text-right tabular-nums">{number(d.completed)}</td>
                                                <td className="text-right tabular-nums">{taka(d.revenue)}</td>
                                                <td className="text-right tabular-nums">{d.rating != null ? number(d.rating) : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
};

export default AdminOverviewPage;
