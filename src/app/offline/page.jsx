import Link from "next/link";
import { FiWifiOff, FiRefreshCw } from "react-icons/fi";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async () => {
    const t = await getTranslations("offline");
    return { title: t("metaTitle"), description: t("metaDesc") };
};

// Served by the service worker when a navigation fails. Kept dependency-free
// and outside the (main) group on purpose: the navbar and footer both need the
// session and the API, neither of which is reachable offline.
const OfflinePage = async () => {
    const t = await getTranslations("offline");
    return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-base-200/50 brand-glow">
        <div className="w-full max-w-md text-center animate-fade-up">
            <div className="w-20 h-20 mx-auto rounded-full bg-base-100 ring-1 ring-base-300 flex items-center justify-center mb-6 shadow-sm">
                <FiWifiOff className="text-primary" size={32} />
            </div>

            <h1 className="text-2xl font-black text-base-content mb-2">{t("title")}</h1>
            <p className="text-sm text-base-content/60 leading-relaxed mb-8">
                {t("text")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/home" className="btn btn-primary rounded-xl font-bold gap-2">
                    <FiRefreshCw size={15} /> {t("retry")}
                </Link>
            </div>

            <p className="text-xs text-base-content/40 mt-8">
                {t("safe")}
            </p>
        </div>
    </div>
    );
};

export default OfflinePage;
