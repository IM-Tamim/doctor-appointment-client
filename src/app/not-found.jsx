'use client'
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import Logo from "@/components/shared/Logo";
import { useTranslations } from "next-intl";

const NotFoundPage = () => {
    const router = useRouter();
    const t = useTranslations("notFound");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-linear-to-br from-base-200 via-base-300 to-base-200">
            <Logo size={64} className="mb-4 shadow-md" />
            <h1 className="text-9xl font-black tracking-tight text-primary/15">
                404
            </h1>

            <h2 className="text-2xl font-bold text-base-content mt-4">
                {t("title")}
            </h2>
            <p className="text-sm mt-2 mb-8 text-base-content/60">
                {t("text")}
            </p>

            <button
                onClick={() => router.push("/home")}
                className="btn btn-primary gap-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-primary/20 transition-all"
            >
                <FiArrowLeft size={15} />
                {t("back")}
            </button>
        </div>
    );
};

export default NotFoundPage;