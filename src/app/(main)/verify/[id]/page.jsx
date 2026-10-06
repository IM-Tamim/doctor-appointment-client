import { FiShieldOff, FiCheckCircle, FiLock } from "react-icons/fi";
import { prettyDate } from "@/lib/schedule";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async () => ({
    title: (await getTranslations("verify"))("metaTitle"),
    robots: { index: false },
});

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const getVerification = async (id, code) => {
    try {
        const qs = code ? `?code=${encodeURIComponent(code)}` : "";
        // Authenticity checks must never be served from a cache.
        const res = await fetch(`${API_URL}/verify/prescriptions/${id}${qs}`, { cache: "no-store" });
        return await res.json();
    } catch {
        return null;
    }
};

const Row = ({ label, value }) =>
    value ? (
        <div className="flex justify-between gap-4 py-2 border-b border-base-300 last:border-0 text-sm">
            <span className="text-base-content/50">{label}</span>
            <span className="font-semibold text-right">{value}</span>
        </div>
    ) : null;

const VerifyPrescriptionPage = async ({ params, searchParams }) => {
    const { id } = await params;
    const { code } = await searchParams;
    const v = await getVerification(id, typeof code === "string" ? code : "");
    const t = await getTranslations("verify");
    const ts = await getTranslations("common.specialties");
    const locale = await getLocale();
    const stamp = (iso) => new Date(iso).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

    if (!v) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
                <p className="text-sm text-base-content/60">{t("unreachable")}</p>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] bg-base-200/40 py-12 px-4">
            <div className="max-w-lg mx-auto">
                {v.genuine ? (
                    <div className="bg-base-100 border-2 border-success/40 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-success/10 px-6 py-5 flex items-center gap-3">
                            <FiCheckCircle size={32} className="text-success shrink-0" />
                            <div>
                                <h1 className="text-lg font-black">{t("genuine")}</h1>
                                <p className="text-xs text-base-content/60">{t("issuedBy")}</p>
                            </div>
                        </div>
                        <div className="px-6 py-4">
                            <Row label={t("doctor")} value={v.doctorName} />
                            <Row label={t("qualifications")} value={v.doctorDegree} />
                            <Row label={t("specialty")} value={v.doctorSpecialty && ts.has(v.doctorSpecialty) ? ts(v.doctorSpecialty) : v.doctorSpecialty} />
                            <Row label={t("regNo")} value={v.doctorRegNo} />
                            <Row label={t("hospital")} value={v.hospitalName || t("online")} />
                            <Row label={t("patient")} value={v.patient} />
                            <Row label={t("visitDate")} value={prettyDate(v.visitDate, locale)} />
                            <Row label={t("issued")} value={stamp(v.issuedAt)} />
                            {v.updatedAt && v.issuedAt && new Date(v.updatedAt) - new Date(v.issuedAt) > 60000 && (
                                <Row label={t("edited")} value={stamp(v.updatedAt)} />
                            )}
                            {v.followUpDate && <Row label={t("followUp")} value={prettyDate(v.followUpDate, locale)} />}
                        </div>
                        {v.codeValid && v.medicines?.length > 0 ? (
                            <div className="px-6 pb-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-base-content/50 mb-2">{t("medicines")}</p>
                                <ul className="space-y-1.5">
                                    {v.medicines.map((m, i) => (
                                        <li key={i} className="text-sm bg-base-200 rounded-lg px-3 py-2">
                                            <b>{m.name}</b>
                                            <span className="text-base-content/60">{[m.dose, m.frequency, m.duration].filter(Boolean).map((x) => ` · ${x}`).join("")}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-base-content/50 mt-3">{t("compare")}</p>
                            </div>
                        ) : (
                            <p className="px-6 pb-6 text-xs text-base-content/50 flex items-center gap-1.5">
                                <FiLock size={12} /> {t("count", { count: v.medicineCount || 0 })}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="bg-base-100 border-2 border-error/40 rounded-2xl p-8 text-center">
                        <FiShieldOff size={36} className="text-error mx-auto mb-3" />
                        <h1 className="text-lg font-black">{t("fake")}</h1>
                        <p className="text-sm text-base-content/60 mt-2">
                            {t("fakeText")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyPrescriptionPage;
