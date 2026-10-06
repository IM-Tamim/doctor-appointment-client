import BloodDonors from "@/components/pages/donors/BloodDonors";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("donors");
    return { title: t("metaTitle"), description: t("metaDesc") };
};

const BloodDonorsPage = async () => {
    const t = await getTranslations("donors");
    return (
    <div className="min-h-screen bg-base-200/40">
        <div className="bg-base-100 border-b border-base-300 brand-glow">
            <div className="max-w-7xl mx-auto px-4 py-12 text-center animate-fade-up">
                <p className="text-xs font-semibold uppercase tracking-widest text-error mb-2">{t("eyebrow")}</p>
                <h1 className="text-3xl md:text-4xl font-black text-base-content">
                    {t("title1")} <span className="text-error">{t("title2")}</span>
                </h1>
                <p className="text-sm text-base-content/60 mt-2 max-w-lg mx-auto">
                    {t("intro")}
                </p>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
            <BloodDonors />
        </div>
    </div>
    );
};

export default BloodDonorsPage;
