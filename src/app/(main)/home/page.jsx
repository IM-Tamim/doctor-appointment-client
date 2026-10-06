import HeroBanner from "@/components/pages/homepage/HeroBanner";
import InstallAppSection from "@/components/pages/homepage/InstallAppSection";
import SpecialtyMarquee from "@/components/pages/homepage/SpecialtyMarquee";
import PatientTestimonials from "@/components/pages/homepage/PatientTestimonials";
import TopRatedDoctors from "@/components/pages/homepage/TopRatedDoctors";
import WhyChooseUs from "@/components/pages/homepage/WhyChooseUs";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("meta");
    return { title: t("homeTitle"), description: t("homeDesc") };
};

const HomePage = () => {
    return (
        <div>
            <HeroBanner />
            <SpecialtyMarquee />
            <TopRatedDoctors />
            <WhyChooseUs />
            <InstallAppSection />
            <PatientTestimonials />
        </div>
    );
};

export default HomePage;
