import DoctorsSearch from "@/components/pages/all-appointments/DoctorsSearch";
import { getDoctors, getDoctorStatsCached } from "@/lib/doctors";
import { getHospitalsCached } from "@/lib/hospitals";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("search");
    return { title: t("metaTitle"), description: t("metaDesc") };
};

const PAGE_SIZE = 8;

const AllAppointmentPage = async ({ searchParams }) => {
    const params = await searchParams;
    const q = typeof params.q === "string" ? params.q : "";
    const hospital = typeof params.hospital === "string" ? params.hospital : "";
    const specialty = typeof params.specialty === "string" ? params.specialty : "";
    const type = params.type === "online" ? "online" : "";
    const page = Math.max(1, parseInt(params.page, 10) || 1);

    // Search, filters and paging all run on the server now — the browser only
    // ever receives one page of results.
    const [result, stats, hospitals] = await Promise.all([
        getDoctors({ q, hospital, specialty, type, page, limit: PAGE_SIZE }),
        getDoctorStatsCached(),
        getHospitalsCached(),
    ]);
    const t = await getTranslations("search");

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
                <DoctorsSearch
                    result={result}
                    specialties={stats.specialties.map((s) => s.name)}
                    hospitals={hospitals.map((h) => ({ _id: h._id, name: h.name }))}
                    initial={{ q, hospital, specialty, type }}
                />
            </div>
        </div>
    );
};

export default AllAppointmentPage;
