import MyProfile from "@/components/pages/dashboard/MyProfile";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("profile");
    return { title: t("metaTitle"), description: t("metaDesc") };
};

const ManagerProfilePage = async () => {
    const t = await getTranslations("profile");
    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-6">
                {t("title1")} <span className="text-primary">{t("title2")}</span>
            </h1>
            <MyProfile />
        </div>
    );
};

export default ManagerProfilePage;
