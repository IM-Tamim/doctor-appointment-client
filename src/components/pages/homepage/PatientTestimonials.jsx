import { getDoctorStatsCached } from "@/lib/doctors";
import TestimonialsCarousel from "./TestimonialsCarousel";
import { getTranslations } from "next-intl/server";

// Server component: the 5-star quotes come pre-filtered from the stats
// endpoint (shared with the hero and the specialty marquee), so neither the
// server nor the browser handles full doctor records just to show a few quotes.
const PatientTestimonials = async () => {
    const { testimonials: reviews } = await getDoctorStatsCached();
    const t = await getTranslations("home");

    if (reviews.length === 0) return null;

    return (
        <section className="bg-base-200/40 py-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12 reveal">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                        {t("storiesEyebrow")}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-base-content">
                        {t("storiesTitle1")} <span className="text-gradient">{t("storiesTitle2")}</span>
                    </h2>
                    <p className="text-sm text-base-content/60 mt-2 max-w-md mx-auto">
                        {t("storiesText")}
                    </p>
                </div>

                <TestimonialsCarousel reviews={reviews} />
            </div>
        </section>
    );
};

export default PatientTestimonials;
