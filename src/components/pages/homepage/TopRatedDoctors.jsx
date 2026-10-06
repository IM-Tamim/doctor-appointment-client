import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import DoctorCard from "@/components/ui/DoctorCard";
import { getDoctors } from "@/lib/doctors";
import { getTranslations } from "next-intl/server";


const TopRatedDoctors = async () => {
    const { doctors: topDoctors } = await getDoctors({ sort: "rating", limit: 3 });
    const t = await getTranslations("home");

    if (topDoctors.length === 0) return null;

    return (
        <section className="bg-base-100 py-20">
            <div className="max-w-7xl mx-auto px-4">

                <div className="text-center mb-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                        {t("topEyebrow")}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-base-content">
                        {t("topTitle1")} <span className="text-primary">{t("topTitle2")}</span>
                    </h2>
                    <p className="text-sm text-base-content/60 mt-2 max-w-md mx-auto">
                        {t("topText")}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topDoctors.map((doctor, i) => (
                        <DoctorCard key={doctor._id} doctor={doctor} priority={i === 0} />
                    ))}
                </div>


                <div className="text-center mt-10">
                    <Link
                        href="/all-appointments"
                        className="btn btn-primary btn-outline rounded-xl font-bold flex items-center gap-2 mx-auto w-fit hover:-translate-y-0.5 transition-transform duration-300"
                    >
                        {t("viewAll")} <FiArrowRight size={16} />
                    </Link>
                </div>

            </div>
        </section>
    );
};

export default TopRatedDoctors;