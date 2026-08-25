import MyBookings from "@/components/pages/dashboard/MyBookings";

export const metadata = {
    title: "My Bookings | DocAppoint",
    description: "Manage your appointments.",
};

const PatientBookingsPage = () => {
    return (
        <div className="min-h-screen bg-base-200">
            <div className="bg-base-200 border-b border-base-300">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-2xl md:text-3xl font-black text-base-content">
                        My <span className="text-primary">Bookings</span>
                    </h1>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <MyBookings />
            </div>
        </div>
    );
};

export default PatientBookingsPage;
