import HeroBanner from "@/components/pages/homepage/HeroBanner";
import SpecialtyMarquee from "@/components/pages/homepage/SpecialtyMarquee";
import PatientTestimonials from "@/components/pages/homepage/PatientTestimonials";
import TopRatedDoctors from "@/components/pages/homepage/TopRatedDoctors";
import WhyChooseUs from "@/components/pages/homepage/WhyChooseUs";

export const metadata = {
    title: "Home | DocAppoint",
    description: "Book doctor appointments instantly with DocAppoint.",
};

const HomePage = () => {
    return (
        <div>
            <HeroBanner />
            <SpecialtyMarquee />
            <TopRatedDoctors />
            <WhyChooseUs />
            <PatientTestimonials />
        </div>
    );
};

export default HomePage;
