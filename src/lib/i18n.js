"use client";
import { useLocale, useTranslations } from "next-intl";
import { localYears, prettyDate, to12h } from "./schedule";

/**
 * Translate a fixed vocabulary item (specialty, status…) if the catalogue has
 * it, otherwise show the stored value as-is.
 */
export const useLabel = (namespace) => {
    const t = useTranslations(namespace);
    return (key) => (key && t.has(key) ? t(key) : key);
};

/** Date/time formatters for the current UI language. */
export const useFormat = () => {
    const locale = useLocale();
    return {
        locale,
        date: (iso) => prettyDate(iso, locale),
        time: (hhmm) => to12h(hhmm, locale),
        money: (n) => `৳${Number(n || 0).toLocaleString(locale === "bn" ? "bn-BD" : "en-IN")}`,
        number: (n) => Number(n || 0).toLocaleString(locale === "bn" ? "bn-BD" : "en-IN"),
        years: (text) => localYears(text, locale),
    };
};
