import { authClient } from "@/lib/auth-client";
import MyBookings from "@/components/pages/dashboard/MyBookings";
import MyProfile from "@/components/pages/dashboard/MyProfile";

export const metadata = {
    title: "Dashboard | DocAppoint",
    description: "Manage your appointments and profile.",
};

const DashboardPage = () => {
    return (
        <div className="min-h-screen bg-base-200">
            <div className="bg-base-200 border-b border-base-300">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-2xl md:text-3xl font-black text-base-content text-center">
                        My <span className="text-primary">Dashboard</span>
                    </h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8">
                <div role="tablist" className="tabs tabs-bordered mb-8">
                    <input
                        type="radio"
                        name="dashboard_tabs"
                        role="tab"
                        className="tab font-semibold"
                        aria-label="My Bookings"
                        defaultChecked
                    />
                    <div role="tabpanel" className="tab-content pt-6">
                        <MyBookings />
                    </div>

                    <input
                        type="radio"
                        name="dashboard_tabs"
                        role="tab"
                        className="tab font-semibold"
                        aria-label="My Profile"
                    />
                    <div role="tabpanel" className="tab-content pt-6">
                        <MyProfile />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;