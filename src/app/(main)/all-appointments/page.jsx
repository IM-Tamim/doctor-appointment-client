import DoctorsSearch from "@/components/pages/all-appointments/DoctorsSearch";
import { getAllDoctorsCached } from "@/lib/doctors";

export const metadata = {
    title: "All Appointments | DocAppoint",
    description: "Browse all available doctors and book your appointment instantly.",
};

const AllAppointmentPage = async () => {
    const doctors = await getAllDoctorsCached();

    return (
        <div className="min-h-screen bg-base-200/40">

            <div className="bg-base-100 border-b border-base-300 brand-glow">
                <div className="max-w-7xl mx-auto px-4 py-14 text-center animate-fade-up">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                        Find Your Doctor
                    </p>
                    <h1 className="text-3xl md:text-4xl font-black text-base-content">
                        All <span className="text-gradient">Appointments</span>
                    </h1>
                    <p className="text-sm text-base-content/60 mt-2 max-w-md mx-auto">
                        Browse our qualified doctors and book your appointment instantly.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-10">
                <DoctorsSearch doctors={doctors} />
            </div>
        </div>
    );
};

export default AllAppointmentPage;