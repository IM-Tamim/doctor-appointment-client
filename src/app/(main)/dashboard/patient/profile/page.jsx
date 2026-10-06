import MyProfile from "@/components/pages/dashboard/MyProfile";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("profile");
    return { title: t("metaTitle"), description: t("metaDesc") };
};

const PatientProfilePage = async () => {
    const t = await getTranslations("profile");
    return (
        <div className="min-h-screen bg-base-200">
            <div className="bg-base-200 border-b border-base-300">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-2xl md:text-3xl font-black text-base-content">
                        {t("title1")} <span className="text-primary">{t("title2")}</span>
                    </h1>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <MyProfile />
            </div>
        </div>
    );
};

export default PatientProfilePage;
