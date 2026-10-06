import Link from "next/link";
import { notFound } from "next/navigation";
import { FiMapPin, FiPhone, FiArrowLeft, FiAlertTriangle, FiTruck } from "react-icons/fi";
import { getHospitalByIdCached } from "@/lib/hospitals";
import { getAmbulances } from "@/lib/emergency";
import DoctorCard from "@/components/ui/DoctorCard";
import HospitalLogo from "@/components/pages/hospitals/HospitalLogo";
import HospitalCover from "@/components/pages/hospitals/HospitalCover";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }) => {
    const { id } = await params;
    const hospital = await getHospitalByIdCached(id);
    const t = await getTranslations("hospitals");
    return {
        title: hospital ? `${hospital.name} | DocAppoint` : t("metaTitle"),
        description: hospital ? t("detailDesc", { name: hospital.name }) : undefined,
    };
};

const HospitalDetailsPage = async ({ params }) => {
    const { id } = await params;
    const hospital = await getHospitalByIdCached(id);
    if (!hospital) notFound();

    const doctors = hospital.doctors || [];
    const ambulances = await getAmbulances({ hospitalId: id });
    const t = await getTranslations("hospitals");
    const ts = await getTranslations("common.specialties");

    return (
        <div className="min-h-screen bg-base-200/40">
            <div className="bg-base-100 border-b border-base-300 brand-glow">
                <div className="max-w-7xl mx-auto px-4 py-10">
                    <Link href="/hospitals" className="text-xs text-base-content/50 hover:text-primary inline-flex items-center gap-1 mb-6">
                        <FiArrowLeft size={12} /> {t("back")}
                    </Link>

                    <figure className="mb-6">
                        <div className="relative h-52 sm:h-64 md:h-80 rounded-2xl overflow-hidden border border-base-300 bg-base-200">
                            <HospitalCover hospital={hospital} priority sizes="(min-width: 1280px) 1248px, 100vw" />
                        </div>
                        {hospital.image && hospital.imageCredit && (
                            <figcaption className="text-[11px] text-base-content/45 mt-1.5 text-right">
                                {t("photo")}{" "}
                                {hospital.imageSource ? (
                                    <a href={hospital.imageSource} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline-offset-2 hover:underline">
                                        {hospital.imageCredit}
                                    </a>
                                ) : (
                                    hospital.imageCredit
                                )}
                            </figcaption>
                        )}
                    </figure>

                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="flex items-center gap-4">
                            {hospital.logo && <HospitalLogo hospital={hospital} size="lg" />}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-base-content">{hospital.name}</h1>
                                <p className="text-sm text-base-content/60 mt-1 flex items-center gap-1.5">
                                    <FiMapPin size={13} className="text-primary shrink-0" />
                                    {[hospital.address, hospital.city].filter(Boolean).join(", ")}
                                </p>
                                {hospital.phone && (
                                    <a href={`tel:${hospital.phone}`} className="text-sm text-base-content/60 hover:text-primary mt-1 flex items-center gap-1.5">
                                        <FiPhone size={13} className="text-primary shrink-0" />
                                        {hospital.phone}
                                    </a>
                                )}
                            </div>
                        </div>

                        {hospital.emergencyPhone && (
                            <a
                                href={`tel:${hospital.emergencyPhone}`}
                                className="btn btn-error rounded-xl gap-2 font-bold shadow-lg shadow-error/20"
                            >
                                <FiAlertTriangle size={16} />
                                {t("emergency", { phone: hospital.emergencyPhone })}
                            </a>
                        )}
                    </div>

                    {hospital.departments?.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-2">
                                {t("departments")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {hospital.departments.map((d) => (
                                    <span key={d} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 font-medium">
                                        {ts.has(d) ? ts(d) : d}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {ambulances.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 pt-8">
                    <h2 className="text-xl font-black text-base-content mb-4 flex items-center gap-2">
                        <FiTruck className="text-error" /> {t("ambulances")}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {ambulances.map((a) => (
                            <a
                                key={a._id}
                                href={`tel:${a.phone}`}
                                className="bg-base-100 border border-base-300 hover:border-error/50 rounded-xl px-4 py-3 flex items-center gap-3"
                            >
                                <span className="badge badge-sm badge-outline">{t.has(`ambulanceTypes.${a.type}`) ? t(`ambulanceTypes.${a.type}`) : a.type}</span>
                                <span className="text-sm font-semibold">{a.phone}</span>
                                <span className={`badge badge-xs ${a.available ? "badge-success" : "badge-ghost"}`}>
                                    {a.available ? t("available") : t("onCall")}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-10">
                <h2 className="text-xl font-black text-base-content mb-6">
                    {t("doctorsHere")} <span className="text-base-content/40 font-normal text-base">({doctors.length})</span>
                </h2>
                {doctors.length === 0 ? (
                    <p className="text-sm text-base-content/50">{t("noDoctors")}</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {doctors.map((doctor, i) => (
                            <DoctorCard key={doctor._id} doctor={doctor} priority={i < 4} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalDetailsPage;
