"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiSearch, FiX, FiVideo } from "react-icons/fi";
import { MdOutlineLocalHospital } from "react-icons/md";
import DoctorCard from "@/components/ui/DoctorCard";
import Pagination from "@/components/shared/Pagination";
import { useTranslations } from "next-intl";
import { useLabel } from "@/lib/i18n";

const ALL = "All";
const DEBOUNCE_MS = 300;

/**
 * Filters live in the URL; the page (a server component) reads them and asks
 * the API for one page of matches. This component only edits the URL — typing
 * is debounced so we don't fire a request per keystroke.
 */
const DoctorsSearch = ({ result, specialties, hospitals, initial }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const t = useTranslations("search");
    const specialtyName = useLabel("common.specialties");
    const [search, setSearch] = useState(initial.q);
    const debounceRef = useRef(null);

    const specialty = initial.specialty || ALL;
    const hospital = initial.hospital || "";
    const { doctors, total, page, totalPages } = result;

    const pushParams = (changes) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(changes)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        // Any filter change starts over from the first page.
        if (!("page" in changes)) params.delete("page");
        const qs = params.toString();
        startTransition(() => {
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        });
    };

    const onSearchChange = (value) => {
        setSearch(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => pushParams({ q: value.trim() }), DEBOUNCE_MS);
    };

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const reset = () => {
        clearTimeout(debounceRef.current);
        setSearch("");
        startTransition(() => router.replace(pathname, { scroll: false }));
    };

    const specialtyChips = [ALL, ...specialties];

    return (
        <>
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <FiSearch
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                        size={16}
                    />
                    <input
                        type="search"
                        placeholder={t("placeholder")}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        aria-label={t("ariaSearch")}
                        className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm bg-base-100 border border-base-300 text-base-content outline-none shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => onSearchChange("")}
                            aria-label={t("ariaClear")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-primary transition-colors"
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>

                <div className="relative sm:w-64">
                    <MdOutlineLocalHospital
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                        size={16}
                    />
                    <select
                        value={hospital}
                        onChange={(e) => pushParams({ hospital: e.target.value })}
                        aria-label={t("ariaHospital")}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm bg-base-100 border border-base-300 text-base-content outline-none shadow-sm focus:border-primary transition-all"
                    >
                        <option value="">{t("allHospitals")}</option>
                        {hospitals.map((h) => (
                            <option key={h._id} value={h._id}>{h.name}</option>
                        ))}
                        <option value="independent">{t("independent")}</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-5">
                <button
                    onClick={() => pushParams({ type: initial.type === "online" ? "" : "online" })}
                    aria-pressed={initial.type === "online"}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                        initial.type === "online"
                            ? "bg-info text-info-content border-info shadow-sm"
                            : "bg-base-100 text-base-content/60 border-base-300 hover:border-info/60 hover:text-info"
                    }`}
                >
                    <FiVideo size={12} /> {t("online")}
                </button>
                <span className="w-px bg-base-300 mx-1" aria-hidden="true" />
                {specialtyChips.map((s) => {
                    const active = s === specialty;
                    return (
                        <button
                            key={s}
                            onClick={() => pushParams({ specialty: s === ALL ? "" : s })}
                            aria-pressed={active}
                            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                                active
                                    ? "bg-primary text-primary-content border-primary shadow-sm shadow-primary/25"
                                    : "bg-base-100 text-base-content/60 border-base-300 hover:border-primary/50 hover:text-primary"
                            }`}
                        >
                            {s === ALL ? t("all") : specialtyName(s)}
                        </button>
                    );
                })}
            </div>

            <p className="text-xs text-base-content/45 mt-5 text-center flex items-center justify-center gap-2" aria-live="polite">
                {isPending && <span className="loading loading-spinner loading-xs text-primary" />}
                {t("found", { count: total })}
            </p>

            {doctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
                        <FiSearch size={24} className="text-base-content/30" />
                    </div>
                    <p className="text-base font-semibold text-base-content/60">{t("none")}</p>
                    <p className="text-sm text-base-content/40">
                        {t("noneHint")}
                    </p>
                    <button onClick={reset} className="btn btn-sm btn-primary btn-outline rounded-lg mt-2">
                        {t("clear")}
                    </button>
                </div>
            ) : (
                <div className={`transition-opacity duration-200 ${isPending ? "opacity-60" : ""}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                        {doctors.map((doctor, i) => (
                            <DoctorCard key={doctor._id} doctor={doctor} priority={i < 4} />
                        ))}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onChange={(p) => pushParams({ page: p > 1 ? String(p) : "" })}
                    />
                </div>
            )}
        </>
    );
};

export default DoctorsSearch;
