import Link from "next/link";
import { FiPhoneCall, FiAlertTriangle, FiTruck, FiDroplet } from "react-icons/fi";
import { getHospitalsPage } from "@/lib/hospitals";
import { getAmbulancesPage } from "@/lib/emergency";
import HospitalCover from "@/components/pages/hospitals/HospitalCover";
import LinkPagination from "@/components/shared/LinkPagination";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("emergency");
    return { title: t("metaTitle"), description: t("metaDesc") };
};

const LINES_PER_PAGE = 8;
const AMBULANCES_PER_PAGE = 10;

const toPage = (value) => Math.max(1, parseInt(value, 10) || 1);

const EmergencyPage = async ({ searchParams }) => {
    const { city, page: pageParam, apage: apageParam } = await searchParams;
    const selected = typeof city === "string" ? city : "";
    const page = toPage(pageParam);
    const apage = toPage(apageParam);
    // Hospital lines (?page) and ambulances (?apage) page independently.
    const [lines, fleet] = await Promise.all([
        getHospitalsPage({ city: selected, page, limit: LINES_PER_PAGE, emergency: true }),
        getAmbulancesPage({ city: selected, page: apage, limit: AMBULANCES_PER_PAGE }),
    ]);
    const shown = lines.hospitals;
    const ambulances = fleet.ambulances;
    const cities = lines.cities;
    const t = await getTranslations("emergency");
    const th = await getTranslations("hospitals");
    const tcity = await getTranslations("common.cities");
    const hrefFor = ({ p = page, a = apage }) => {
        const qs = new URLSearchParams();
        if (selected) qs.set("city", selected);
        if (p > 1) qs.set("page", String(p));
        if (a > 1) qs.set("apage", String(a));
        return qs.size ? `/emergency?${qs}` : "/emergency";
    };

    return (
        <div className="min-h-screen bg-base-200/40">
            <div className="bg-error/10 border-b border-error/20">
                <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="text-center md:text-left">
                        <p className="text-xs font-bold uppercase tracking-widest text-error flex items-center gap-1.5 justify-center md:justify-start">
                            <FiAlertTriangle /> {t("lifeThreat")}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-black mt-1">{t("call999")}</h1>
                        <p className="text-sm text-base-content/60 mt-1">
                            {t("national")}
                        </p>
                    </div>
                    <a href="tel:999" className="btn btn-error btn-lg rounded-2xl gap-3 text-xl shadow-xl shadow-error/30">
                        <FiPhoneCall /> 999
                    </a>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                <div className="flex flex-wrap gap-2">
                    {["", ...cities].map((c) => (
                        <Link
                            key={c || "all"}
                            href={c ? `/emergency?city=${encodeURIComponent(c)}` : "/emergency"}
                            aria-current={c === selected ? "page" : undefined}
                            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border ${
                                c === selected ? "bg-error text-error-content border-error" : "bg-base-100 border-base-300 hover:border-error/50"
                            }`}
                        >
                            {c ? (tcity.has(c) ? tcity(c) : c) : th("allCities")}
                        </Link>
                    ))}
                </div>

                <section>
                    <h2 className="text-lg font-black mb-3">{t("lines")}</h2>
                    {shown.length === 0 ? (
                        <p className="text-sm text-base-content/50">{t("noHospitals")}</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {shown.map((h) => (
                                <div key={h._id} className="min-w-0 bg-base-100 border border-base-300 rounded-2xl p-4 flex flex-wrap lg:flex-nowrap items-center gap-3">
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-base-200">
                                        <HospitalCover hospital={h} sizes="112px" className="[&_span]:text-base" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/hospitals/${h._id}`} className="font-bold leading-snug hover:text-primary line-clamp-2">{h.name}</Link>
                                        <p className="text-xs text-base-content/50">{h.city}</p>
                                    </div>
                                    <a href={`tel:${h.emergencyPhone}`} className="btn btn-error btn-sm btn-outline gap-1.5 shrink-0 w-full lg:w-auto">
                                        <FiPhoneCall size={13} /> {h.emergencyPhone}
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                    <LinkPagination page={page} totalPages={lines.totalPages} hrefFor={(p) => hrefFor({ p })} label={t("lines")} />
                </section>

                <section>
                    <h2 className="text-lg font-black mb-3 flex items-center gap-2"><FiTruck className="text-error" /> {th("ambulances")}</h2>
                    {ambulances.length === 0 ? (
                        <p className="text-sm text-base-content/50">{t("noAmbulances")}</p>
                    ) : (
                        <>
                        <ul className="md:hidden space-y-2">
                            {ambulances.map((a) => (
                                <li key={a._id} className="bg-base-100 border border-base-300 rounded-2xl p-3 flex flex-col gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold leading-snug">{a.hospital?.name}</p>
                                        <p className="text-[11px] text-base-content/45">{a.hospital?.city}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="badge badge-sm badge-outline">{th.has(`ambulanceTypes.${a.type}`) ? th(`ambulanceTypes.${a.type}`) : a.type}</span>
                                        <span className={`badge badge-sm ${a.available ? "badge-success" : "badge-ghost"}`}>
                                            {a.available ? th("available") : th("onCall")}
                                        </span>
                                        <a href={`tel:${a.phone}`} className="btn btn-sm btn-error gap-1 ml-auto"><FiPhoneCall size={12} /> {a.phone}</a>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="hidden md:block overflow-x-auto bg-base-100 border border-base-300 rounded-2xl">
                            <table className="table table-sm">
                                <thead><tr><th>{t("hospital")}</th><th>{t("type")}</th><th>{t("status")}</th><th className="text-right">{t("call")}</th></tr></thead>
                                <tbody>
                                    {ambulances.map((a) => (
                                        <tr key={a._id}>
                                            <td>
                                                <span className="font-semibold">{a.hospital?.name}</span>
                                                <span className="block text-[11px] text-base-content/45">{a.hospital?.city}</span>
                                            </td>
                                            <td><span className="badge badge-sm badge-outline">{th.has(`ambulanceTypes.${a.type}`) ? th(`ambulanceTypes.${a.type}`) : a.type}</span></td>
                                            <td>
                                                <span className={`badge badge-sm ${a.available ? "badge-success" : "badge-ghost"}`}>
                                                    {a.available ? th("available") : th("onCall")}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <a href={`tel:${a.phone}`} className="btn btn-xs btn-error gap-1"><FiPhoneCall size={11} /> {a.phone}</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </>
                    )}
                    <LinkPagination page={apage} totalPages={fleet.totalPages} hrefFor={(a) => hrefFor({ a })} label={th("ambulances")} />
                </section>

                <Link href="/blood-donors" className="flex items-center gap-3 bg-base-100 border border-base-300 rounded-2xl p-4 hover:border-error/50">
                    <FiDroplet className="text-error" size={22} />
                    <div>
                        <p className="font-bold">{t("needBlood")}</p>
                        <p className="text-xs text-base-content/55">{t("needBloodText")}</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default EmergencyPage;
