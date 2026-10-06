"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiHeart } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { getSavedDoctors } from "@/lib/patient";
import { useSavedDoctors } from "@/lib/useSavedDoctors";
import DoctorCard from "@/components/ui/DoctorCard";
import { DoctorGridSkeleton } from "@/components/shared/Skeletons";
import { useTranslations } from "next-intl";

const SavedDoctorsPage = () => {
    const t = useTranslations("saved");
    const { data: session } = authClient.useSession();
    const { ids } = useSavedDoctors();
    const [doctors, setDoctors] = useState(null);

    useEffect(() => {
        if (!session) return;
        (async () => {
            const { data: tokenData } = await authClient.token();
            const res = await getSavedDoctors(tokenData?.token);
            setDoctors(res.ok ? res.data : []);
        })();
    }, [session]);

    // Unsaving from a card removes it here immediately (shared store).
    const visible = (doctors || []).filter((d) => ids.has(d._id));

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-6">
                {t("title1")} <span className="text-primary">{t("title2")}</span>
            </h1>
            {doctors === null ? (
                <DoctorGridSkeleton count={3} />
            ) : visible.length === 0 ? (
                <div className="flex flex-col items-center py-20 gap-3 text-center">
                    <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
                        <FiHeart size={24} className="text-base-content/30" />
                    </div>
                    <p className="font-semibold text-base-content/60">{t("none")}</p>
                    <p className="text-sm text-base-content/40">{t("hint")}</p>
                    <Link href="/all-appointments" className="btn btn-primary btn-sm mt-1">{t("browse")}</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visible.map((d) => <DoctorCard key={d._id} doctor={d} />)}
                </div>
            )}
        </div>
    );
};

export default SavedDoctorsPage;
