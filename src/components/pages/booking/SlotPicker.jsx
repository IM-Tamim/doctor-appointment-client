"use client";
import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getDoctorSlots } from "@/lib/appointments";
import { addDaysISO, todayISO, weekdayOf, weekdayName } from "@/lib/schedule";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";

const STRIP_DAYS = 14;

const CLOSED_KEY = { leave: "leave", not_consulting: "notConsulting", past: "past" };

/**
 * Pick a date, then a free slot. Slots come live from the API (never cached),
 * each with its serial — its position in the doctor's day.
 */
const SlotPicker = ({ doctor, value, onChange, minDate, maxDate, exclude }) => {
    const first = minDate && minDate > todayISO() ? minDate : todayISO();
    const [stripStart, setStripStart] = useState(first);
    const [data, setData] = useState(null);
    const t = useTranslations("slots");
    const { locale, time: to12h, number } = useFormat();

    const workingDays = useMemo(
        () =>
            new Set(
                (doctor.availability || [])
                    .filter((a) => (a.sessions?.length || 0) > 0 || (a.slots?.length || 0) > 0)
                    .map((a) => a.day)
            ),
        [doctor.availability]
    );
    const leave = useMemo(() => new Set([...(doctor.leaveDates || []), ...(doctor.blockedDates || [])]), [doctor]);

    const dates = useMemo(
        () =>
            Array.from({ length: STRIP_DAYS }, (_, i) => addDaysISO(stripStart, i)).filter(
                (d) => !maxDate || d <= maxDate
            ),
        [stripStart, maxDate]
    );

    useEffect(() => {
        if (!value.date) return;
        let cancelled = false;
        getDoctorSlots(doctor._id, value.date, { exclude }).then((res) => {
            if (cancelled) return;
            setData(res.ok ? res.data : { date: value.date, slots: [], closedReason: "error", message: res.message });
        });
        return () => { cancelled = true; };
    }, [doctor._id, value.date, exclude]);

    const pickDate = (date) => onChange({ date, time: "", serial: null });
    const loading = Boolean(value.date) && data?.date !== value.date;
    const canGoBack = stripStart > first;

    const freeCount = data?.slots?.filter((s) => s.available).length ?? 0;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setStripStart(addDaysISO(stripStart, -7) < first ? first : addDaysISO(stripStart, -7))}
                    disabled={!canGoBack}
                    className="btn btn-ghost btn-xs btn-circle"
                    aria-label={t("earlier")}
                >
                    <FiChevronLeft size={14} />
                </button>
                <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 snap-x" role="listbox" aria-label={t("chooseDate")}>
                    {dates.map((d) => {
                        const wd = weekdayOf(d);
                        const open = workingDays.has(wd) && !leave.has(d);
                        const active = value.date === d;
                        return (
                            <button
                                type="button"
                                key={d}
                                role="option"
                                aria-selected={active}
                                onClick={() => pickDate(d)}
                                className={`snap-start shrink-0 w-14 rounded-xl border px-1 py-2 text-center transition-all ${
                                    active
                                        ? "bg-primary text-primary-content border-primary shadow-md shadow-primary/25"
                                        : open
                                            ? "bg-base-100 border-base-300 hover:border-primary/60"
                                            : "bg-base-200/60 border-base-300 text-base-content/35"
                                }`}
                            >
                                <span className="block text-[10px] font-semibold uppercase">{weekdayName(wd, locale, "short")}</span>
                                <span className="block text-lg font-black leading-tight">{number(Number(d.slice(8)))}</span>
                                <span className="block text-[10px] opacity-70">
                                    {new Date(`${d}T00:00:00Z`).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { month: "short", timeZone: "UTC" })}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={() => setStripStart(addDaysISO(stripStart, 7))}
                    disabled={Boolean(maxDate) && addDaysISO(stripStart, 7) > maxDate}
                    className="btn btn-ghost btn-xs btn-circle"
                    aria-label={t("later")}
                >
                    <FiChevronRight size={14} />
                </button>
            </div>

            {!value.date ? (
                <p className="text-xs text-base-content/50">{t("pickDate")}</p>
            ) : loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
                </div>
            ) : data?.closedReason ? (
                <p className="text-xs text-error flex items-start gap-1.5">
                    <FiAlertCircle size={12} className="mt-0.5 shrink-0" />
                    {CLOSED_KEY[data.closedReason] ? t(CLOSED_KEY[data.closedReason]) : data.message || t("none")}
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="listbox" aria-label={t("chooseTime")}>
                        {data.slots.map((s) => {
                            const active = value.time === s.time;
                            return (
                                <button
                                    type="button"
                                    key={s.time}
                                    role="option"
                                    aria-selected={active}
                                    disabled={!s.available}
                                    onClick={() => onChange({ date: value.date, time: s.time, serial: s.serial })}
                                    className={`rounded-xl border px-2 py-1.5 text-center transition-all ${
                                        active
                                            ? "bg-primary text-primary-content border-primary shadow-md shadow-primary/25"
                                            : s.available
                                                ? "bg-base-100 border-base-300 hover:border-primary/60"
                                                : "bg-base-200/60 border-base-300 text-base-content/30 line-through cursor-not-allowed"
                                    }`}
                                >
                                    <span className="block text-sm font-bold">{to12h(s.time)}</span>
                                    <span className="block text-[10px] opacity-75">{t("serial", { serial: number(s.serial) })}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-base-content/45">
                        {t("free", { free: number(freeCount), total: number(data.slots.length), minutes: number(data.slotMinutes) })}
                    </p>
                </>
            )}
        </div>
    );
};

export default SlotPicker;
