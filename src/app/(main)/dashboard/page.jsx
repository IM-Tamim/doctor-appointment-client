import { authClient } from "@/lib/auth-client";
import MyBookings from "@/components/pages/dashboard/MyBookings";
import MyProfile from "@/components/pages/dashboard/MyProfile";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("meta");
    return { title: t("dashTitle"), description: t("dashDesc") };
};

const DashboardPage = async () => {
    const t = await getTranslations("meta");
    return (
        <div className="min-h-screen bg-base-200">
            <div className="bg-base-200 border-b border-base-300">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-2xl md:text-3xl font-black text-base-content text-center">
                        {t("dash1")} <span className="text-primary">{t("dash2")}</span>
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
                        aria-label={t("bookings")}
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
                        aria-label={t("profile")}
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