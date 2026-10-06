import { getDoctorByIdCached } from "@/lib/doctors";
import { FiMapPin, FiClock, FiStar, FiUser, FiAward, FiCalendar, FiDollarSign, FiVideo, FiRepeat } from "react-icons/fi";
import { notFound } from "next/navigation";
import { scheduleRows, slotMinutesOf, weekdayName, localNumber, localYears } from "@/lib/schedule";
import SaveDoctorButton from "@/components/shared/SaveDoctorButton";
import { MdOutlineLocalHospital } from "react-icons/md";
import Image from "next/image";
import BookingModal from "@/components/pages/all-appointments/BookingModal";
import ReviewSection from "@/components/pages/all-appointments/ReviewSection";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { cld } from "@/lib/cloudinary";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }) => {
    const { id } = await params;
    const { token } = await auth.api.getToken({ headers: await headers() });
    const doctor = await getDoctorByIdCached(id, token);
    return {
        title: doctor?.name ? `${doctor.name} | DocAppoint` : (await getTranslations("doctor"))("metaTitle"),
        description: doctor?.bio,
    };
};

const DoctorDetailsPage = async ({ params }) => {
    const { id } = await params;
    const { token } = await auth.api.getToken({
        headers: await headers()
    });
    const doctor = await getDoctorByIdCached(id, token);
    if (!doctor?._id) notFound();

    const locale = await getLocale();
    const t = await getTranslations("doctor");
    const tc = await getTranslations("common");
    const ts = await getTranslations("common.specialties");
    const rows = scheduleRows(doctor, locale);
    const num = (n) => localNumber(n ?? 0, locale);
    const consultationType = doctor.consultationType || "in-person";

    return (
        <div className="min-h-screen bg-linear-to-br from-base-200 via-base-200 to-base-300">

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="bg-base-100 rounded-2xl border border-base-300 shadow-xl overflow-hidden">

                    <div className="h-1.5 bg-linear-to-r from-primary to-primary"></div>

                    <div className="p-6 md:p-8">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">

                            <div className="relative w-full lg:w-72 shrink-0">
                                <div className="relative w-full h-80 lg:h-72 rounded-2xl overflow-hidden border-2 border-base-300 shadow-lg group">
                                    <Image
                                        src={cld(doctor.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0e9080&color=fff&size=400&bold=true`}
                                        alt={doctor.name}
                                        fill
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                        {t("verified")}
                                    </div>
                                    <SaveDoctorButton doctorId={doctor._id} className="absolute top-3 right-3" />
                                </div>
                            </div>

                            <div className="flex-1 space-y-5">

                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary px-4 py-1.5 rounded-full border border-primary/30">
                                            {ts.has(doctor.specialty) ? ts(doctor.specialty) : doctor.specialty}
                                        </span>
                                        {doctor.rating >= 4.5 && (
                                            <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1">
                                                <FiAward size={12} />
                                                {t("topRated")}
                                            </span>
                                        )}
                                        {consultationType !== "in-person" && (
                                            <span className="text-xs font-medium bg-info/15 text-info px-3 py-1.5 rounded-full flex items-center gap-1">
                                                <FiVideo size={12} />
                                                {consultationType === "online" ? t("onlineOnly") : t("videoAvailable")}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-base-content leading-tight">
                                        {doctor.name}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-sm text-base-content/60 flex items-center gap-1">
                                            <FiUser size={12} />
                                            {localYears(doctor.experience, locale) || t("noExperience")}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl border border-base-300">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                            <MdOutlineLocalHospital size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-base-content/40 font-medium">{t("hospital")}</p>
                                            {doctor.hospitalId ? (
                                                <Link href={`/hospitals/${doctor.hospitalId}`} className="text-sm font-semibold text-base-content hover:text-primary">
                                                    {doctor.hospital}
                                                </Link>
                                            ) : (
                                                <p className="text-sm font-semibold text-base-content">{doctor.hospital || tc("independent")}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl border border-base-300">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                            <FiMapPin size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-base-content/40 font-medium">{t("location")}</p>
                                            <p className="text-sm font-semibold text-base-content">{doctor.location || t("notSpecified")}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FiClock size={14} className="text-primary" />
                                        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                                            {t("schedule", { minutes: num(slotMinutesOf(doctor)) })}
                                        </p>
                                    </div>
                                    {rows.every((r) => r.ranges.length === 0) ? (
                                        <p className="text-xs text-base-content/40">{t("noSchedule")}</p>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                                            {rows.map((r) => (
                                                <div key={r.day} className="flex items-start gap-2 text-xs">
                                                    <span className="font-bold text-base-content/70 w-20 shrink-0">{weekdayName(r.day, locale)}</span>
                                                    <span className={r.ranges.length ? "text-base-content/70" : "text-base-content/35"}>
                                                        {r.ranges.length ? r.ranges.join(", ") : t("closed")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-base-300 mt-2">
                                    <div>
                                        <p className="text-xs text-base-content/40 font-semibold uppercase tracking-wider">{t("fee")}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-primary">৳{num(doctor.fee)}</span>
                                            <span className="text-xs text-base-content/40">{t("perVisit")}</span>
                                        </div>
                                        {doctor.followUpFeePercent < 100 && (
                                            <p className="text-[11px] text-success flex items-center gap-1 mt-0.5">
                                                <FiRepeat size={10} /> {doctor.followUpFeePercent === 0 ? t("followUpFree") : t("followUpPercent", { percent: num(doctor.followUpFeePercent) })}
                                            </p>
                                        )}
                                    </div>
                                    <BookingModal doctor={doctor} />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-base-100 rounded-2xl border border-base-300 shadow-lg overflow-hidden">
                    <div className="h-1 w-20 bg-primary"></div>
                    <div className="p-6 md:p-8">
                        <h2 className="text-xl font-black text-base-content mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary rounded-full"></span>
                            {t("about")}
                        </h2>
                        <p className="text-base-content/70 leading-relaxed">
                            {doctor.bio || t("noBio")}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-base-100 rounded-xl border border-base-300 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <FiCalendar className="text-primary" size={18} />
                        </div>
                        <p className="text-xs text-base-content/40">{t("years")}</p>
                        <p className="text-lg font-bold text-base-content">{localYears(doctor.experience, locale) || "—"}</p>
                    </div>
                    <div className="bg-base-100 rounded-xl border border-base-300 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <FiStar className="text-primary fill-primary/20" size={18} />
                        </div>
                        <p className="text-xs text-base-content/40">{t("rating")}</p>
                        <p className="text-lg font-bold text-base-content">{num(doctor.rating)} / {num(5)}</p>
                    </div>
                    <div className="bg-base-100 rounded-xl border border-base-300 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <FiDollarSign className="text-primary" size={18} />
                        </div>
                        <p className="text-xs text-base-content/40">{t("fee")}</p>
                        <p className="text-lg font-bold text-primary">৳{num(doctor.fee)}</p>
                    </div>
                </div>
            </div>

            <ReviewSection doctor={doctor} />
        </div>
    );
};

export default DoctorDetailsPage;