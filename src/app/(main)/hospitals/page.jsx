import Link from "next/link";
import { FiMapPin, FiPhone, FiArrowRight, FiUsers } from "react-icons/fi";
import { getHospitalsPage } from "@/lib/hospitals";
import HospitalLogo from "@/components/pages/hospitals/HospitalLogo";
import HospitalCover from "@/components/pages/hospitals/HospitalCover";
import LinkPagination from "@/components/shared/LinkPagination";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("hospitals");
    return { title: t("metaTitle"), description: t("metaDesc") };
};

const PAGE_SIZE = 9;

const HospitalsPage = async ({ searchParams }) => {
    const { city, page: pageParam } = await searchParams;
    const selectedCity = typeof city === "string" ? city : "";
    const page = Math.max(1, parseInt(pageParam, 10) || 1);

    // The API returns one page plus every city, so the chips stay put while paging.
    const { hospitals, cities, totalPages } = await getHospitalsPage({ city: selectedCity, page, limit: PAGE_SIZE });
    const t = await getTranslations("hospitals");
    const ts = await getTranslations("common.specialties");
    const tcity = await getTranslations("common.cities");
    const hrefFor = (p) => {
        const qs = new URLSearchParams();
        if (selectedCity) qs.set("city", selectedCity);
        if (p > 1) qs.set("page", String(p));
        return qs.size ? `/hospitals?${qs}` : "/hospitals";
    };

    return (
        <div className="min-h-screen bg-base-200/40">
            <div className="bg-base-100 border-b border-base-300 brand-glow">
                <div className="max-w-7xl mx-auto px-4 py-14 text-center animate-fade-up">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                        {t("eyebrow")}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-black text-base-content">
                        {t("title1")} <span className="text-gradient">{t("title2")}</span>
                    </h1>
                    <p className="text-sm text-base-content/60 mt-2 max-w-md mx-auto">
                        {t("intro")}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-10">
                {cities.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {["", ...cities].map((c) => {
                            const active = c.toLowerCase() === selectedCity.toLowerCase();
                            return (
                                <Link
                                    key={c || "all"}
                                    href={c ? `/hospitals?city=${encodeURIComponent(c)}` : "/hospitals"}
                                    aria-current={active ? "page" : undefined}
                                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                                        active
                                            ? "bg-primary text-primary-content border-primary"
                                            : "bg-base-100 text-base-content/60 border-base-300 hover:border-primary/50 hover:text-primary"
                                    }`}
                                >
                                    {c ? (tcity.has(c) ? tcity(c) : c) : t("allCities")}
                                </Link>
                            );
                        })}
                    </div>
                )}

                {hospitals.length === 0 ? (
                    <p className="text-center text-base-content/50 py-20">{t("none")}</p>
                ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {hospitals.map((h, i) => (
                            <Link
                                key={h._id}
                                href={`/hospitals/${h._id}`}
                                className="reveal card-lift bg-base-100 rounded-2xl border border-base-300 overflow-hidden flex flex-col group"
                            >
                                <div className="relative aspect-16/10 bg-base-200 overflow-hidden">
                                    <HospitalCover hospital={h} priority={i < 3} className="group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-5 flex flex-col gap-4 flex-1">
                                <div className="flex items-center gap-3">
                                    {h.logo && <HospitalLogo hospital={h} />}
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-base-content leading-tight group-hover:text-primary transition-colors">
                                            {h.name}
                                        </h2>
                                        <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                                            <FiMapPin size={11} className="text-primary shrink-0" />
                                            {[h.address, h.city].filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                </div>

                                {h.departments?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {h.departments.slice(0, 5).map((d) => (
                                            <span key={d} className="text-[11px] bg-base-200 border border-base-300 rounded-full px-2.5 py-1 text-base-content/70">
                                                {ts.has(d) ? ts(d) : d}
                                            </span>
                                        ))}
                                        {h.departments.length > 5 && (
                                            <span className="text-[11px] text-base-content/40 px-1 py-1">
                                                {t("more", { count: h.departments.length - 5 })}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-3 mt-auto border-t border-base-300 text-xs">
                                    <span className="flex items-center gap-1.5 text-base-content/60">
                                        <FiUsers size={12} className="text-primary" />
                                        {t("doctors", { count: h.doctorCount || 0 })}
                                    </span>
                                    {h.emergencyPhone && (
                                        <span className="flex items-center gap-1.5 text-error font-semibold">
                                            <FiPhone size={12} /> {h.emergencyPhone}
                                        </span>
                                    )}
                                    <FiArrowRight size={14} className="text-primary group-hover:translate-x-0.5 transition-transform" />
                                </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <LinkPagination page={page} totalPages={totalPages} hrefFor={hrefFor} label={t("title2")} />
                    </>
                )}
            </div>
        </div>
    );
};

export default HospitalsPage;
