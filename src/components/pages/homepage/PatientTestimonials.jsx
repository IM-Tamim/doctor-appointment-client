import { getAllDoctorsCached } from "@/lib/doctors";
import TestimonialsCarousel from "./TestimonialsCarousel";

// Server component: the doctor list is fetched once per render (shared with the
// hero and the top-rated grid) and reduced to just the review objects the
// carousel needs. Previously this ran in the browser and pulled every doctor's
// full record — bios, images, availability — to show three quotes.
const PatientTestimonials = async () => {
    const doctors = await getAllDoctorsCached();

    const reviews = doctors.flatMap((doc) =>
        (doc.reviews || [])
            .filter((r) => r.rating === 5)
            .map((r) => ({
                rating: r.rating,
                comment: r.comment,
                userName: r.userName,
                doctorName: doc.name,
            }))
    );

    if (reviews.length === 0) return null;

    return (
        <section className="bg-base-200/40 py-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12 reveal">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                        Patient Stories
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-base-content">
                        What Our <span className="text-gradient">Patients Say</span>
                    </h2>
                    <p className="text-sm text-base-content/60 mt-2 max-w-md mx-auto">
                        Real 5-star experiences from patients who trust DocAppoint.
                    </p>
                </div>

                <TestimonialsCarousel reviews={reviews} />
            </div>
        </section>
    );
};

export default PatientTestimonials;
