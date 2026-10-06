"use client";
import { useState } from "react";
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";

// Every chart here is a single measure, so one brand hue carries it (no legend
// needed — the card title names the series). Colours come from the theme
// tokens, so dark mode follows the app's own palette.
const INK = "var(--color-primary)";
const GRID = "color-mix(in oklch, var(--color-base-content) 10%, transparent)";
const AXIS = { fontSize: 11, fill: "color-mix(in oklch, var(--color-base-content) 55%, transparent)" };


const TooltipBox = ({ active, payload, label, format, labelFormat }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg px-3 py-2 text-xs">
            <p className="text-base-content/60 mb-0.5">{labelFormat ? labelFormat(label) : label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="font-bold text-base-content tabular-nums">
                    {format(p.value, p.payload)}
                </p>
            ))}
        </div>
    );
};

const Card = ({ title, subtitle, children, className = "" }) => (
    <section className={`bg-base-100 border border-base-300 rounded-2xl p-5 ${className}`}>
        <h2 className="font-bold text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-base-content/50 mb-3">{subtitle}</p>}
        {children}
    </section>
);

/** Horizontal bars for ranked categories; labels sit on the y-axis, values on hover. */
const RankedBars = ({ data, nameKey, valueKey, format, tick }) => (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 30)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={4}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" tick={AXIS} tickFormatter={tick} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey={nameKey} tick={AXIS} width={150} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: GRID }} content={<TooltipBox format={(v) => format(v)} />} />
            <Bar dataKey={valueKey} fill={INK} radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
    </ResponsiveContainer>
);

const AnalyticsCharts = ({ data }) => {
    const t = useTranslations("admin.charts");
    const specialtyName = useLabel("common.specialties");
    const { locale, money, number } = useFormat();
    const taka = (n) => money(Math.round(n || 0));
    const thousands = (v) => `${number(Math.round(v / 1000))}k`;
    const shortDate = (iso) =>
        new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
    const [showTable, setShowTable] = useState(false);
    const daily = data.daily.map((d) => ({ ...d, label: d.date }));
    const bySpecialty = data.bookingsBySpecialty.map((s) => ({ ...s, specialty: specialtyName(s.specialty) }));
    // The API groups bookings without a hospital under this fixed English label.
    const byHospital = data.revenueByHospital.map((h) => (h.hospital === "Online / independent" ? { ...h, hospital: t("independent") } : h));

    return (
        <div className="grid lg:grid-cols-2 gap-5">
            <Card title={t("revenueDay")} subtitle={t("revenueDaySub")} className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={daily} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={INK} stopOpacity={0.28} />
                                <stop offset="100%" stopColor={INK} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke={GRID} />
                        <XAxis dataKey="label" tick={AXIS} tickFormatter={shortDate} minTickGap={24} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS} tickFormatter={thousands} axisLine={false} tickLine={false} width={36} />
                        <Tooltip
                            cursor={{ stroke: GRID, strokeWidth: 1 }}
                            content={<TooltipBox labelFormat={shortDate} format={(v, row) => t("tooltipRevenue", { amount: taka(v), count: row.bookings })} />}
                        />
                        <Area type="monotone" dataKey="net" stroke={INK} strokeWidth={2} fill="url(#revFill)" activeDot={{ r: 4 }} />
                    </AreaChart>
                </ResponsiveContainer>
                <button onClick={() => setShowTable((s) => !s)} className="btn btn-ghost btn-xs mt-2">
                    {showTable ? t("hideTable") : t("showTable")}
                </button>
                {showTable && (
                    <div className="overflow-x-auto max-h-64 mt-2">
                        <table className="table table-xs">
                            <thead><tr><th>{t("date")}</th><th className="text-right">{t("bookings")}</th><th className="text-right">{t("cancelled")}</th><th className="text-right">{t("collected")}</th><th className="text-right">{t("refunded")}</th><th className="text-right">{t("net")}</th></tr></thead>
                            <tbody>
                                {data.daily.map((d) => (
                                    <tr key={d.date}>
                                        <td>{shortDate(d.date)}</td>
                                        <td className="text-right tabular-nums">{number(d.bookings)}</td>
                                        <td className="text-right tabular-nums">{number(d.cancelled)}</td>
                                        <td className="text-right tabular-nums">{taka(d.collected)}</td>
                                        <td className="text-right tabular-nums">{taka(d.refunded)}</td>
                                        <td className="text-right tabular-nums font-semibold">{taka(d.net)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Card title={t("bookingsDay")} subtitle={t("bookingsDaySub")} className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={daily} margin={{ left: 4, right: 12, top: 8, bottom: 0 }} barCategoryGap={2}>
                        <CartesianGrid vertical={false} stroke={GRID} />
                        <XAxis dataKey="label" tick={AXIS} tickFormatter={shortDate} minTickGap={24} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS} tickFormatter={number} allowDecimals={false} axisLine={false} tickLine={false} width={28} />
                        <Tooltip
                            cursor={{ fill: GRID }}
                            content={<TooltipBox labelFormat={shortDate} format={(v, row) => `${t("tooltipBookings", { count: v })}${row.cancelled ? t("tooltipCancelled", { count: number(row.cancelled) }) : ""}`} />}
                        />
                        <Bar dataKey="bookings" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={22} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <Card title={t("byHospital")} subtitle={t("byHospitalSub")}>
                {byHospital.length ? (
                    <RankedBars data={byHospital} nameKey="hospital" valueKey="revenue" format={taka} tick={thousands} />
                ) : <p className="text-sm text-base-content/50">{t("noPayments")}</p>}
            </Card>

            <Card title={t("bySpecialty")}>
                {bySpecialty.length ? (
                    <RankedBars data={bySpecialty} nameKey="specialty" valueKey="bookings" format={(v) => t("tooltipBookings", { count: v })} tick={number} />
                ) : <p className="text-sm text-base-content/50">{t("noBookings")}</p>}
            </Card>
        </div>
    );
};

export default AnalyticsCharts;
