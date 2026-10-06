"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

// The server reads this cookie in src/i18n/request.js.
const saveLocale = (locale) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
};

/** EN / বাংলা toggle. Stores the choice in a cookie and re-renders on the server. */
const LanguageSwitcher = ({ className = "" }) => {
    const locale = useLocale();
    const router = useRouter();
    const t = useTranslations("nav");
    const [pending, startTransition] = useTransition();

    const switchTo = (next) => {
        if (next === locale) return;
        saveLocale(next);
        startTransition(() => router.refresh());
    };

    return (
        <div className={`join ${pending ? "opacity-60" : ""} ${className}`} role="group" aria-label={t("language")}>
            {[
                ["en", "EN"],
                ["bn", "বাং"],
            ].map(([code, label]) => (
                <button
                    key={code}
                    type="button"
                    lang={code}
                    onClick={() => switchTo(code)}
                    aria-pressed={locale === code}
                    className={`join-item btn btn-xs ${locale === code ? "btn-primary" : "btn-ghost border-base-300"}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
