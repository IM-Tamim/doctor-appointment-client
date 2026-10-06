"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { applyAsDoctor, getMyDoctorApplication } from "@/lib/doctors";
import toast from "react-hot-toast";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import HospitalSelect from "@/components/shared/HospitalSelect";
import { SPECIALTIES, CONSULTATION_TYPES } from "@/lib/specialties";
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { useLabel } from "@/lib/i18n";


const BecomeDoctorPage = () => {
    const t = useTranslations("doctorForm");
    const tc = useTranslations("common");
    const specialtyName = useLabel("common.specialties");
    const { data: session } = authClient.useSession();
    const [application, setApplication] = useState(undefined); // undefined = loading, null = none yet
    const [reapplyMode, setReapplyMode] = useState(false);
    const [form, setForm] = useState({
        specialty: "", degree: "", registrationNumber: "", hospitalId: "", phone: "",
        experience: "", location: "",
        bio: "", fee: "", credentialImageUrl: "", image: "", consultationType: "in-person",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!session) return;
            const { data: tokenData } = await authClient.token();
            const result = await getMyDoctorApplication(tokenData?.token);
            setApplication(result);
        };
        load();
    }, [session]);

    const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.specialty || !form.degree || !form.registrationNumber || !form.phone) {
            toast.error(t("required"));
            return;
        }
        if (!form.credentialImageUrl) {
            toast.error(t("needCredential"));
            return;
        }

        setSubmitting(true);
        try {
            const { data: tokenData } = await authClient.token();
            const result = await applyAsDoctor({ ...form, fee: Number(form.fee) || 0 }, tokenData?.token);
            if (result?.message && !result?.insertedId) {
                toast.error(result.message);
            } else {
                toast.success(t("submitted"));
                setReapplyMode(false);
                setApplication({ approvalStatus: "pending", specialty: form.specialty });
            }
        } catch {
            toast.error(t("error"));
        } finally {
            setSubmitting(false);
        }
    };

    if (application === undefined) {
        return (
            <div className="flex justify-center py-24">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    // Already applied — show status instead of the form (unless resubmitting
    // after a rejection, in which case reapplyMode drops through to the form)
    if (application && !reapplyMode) {
        const statusMap = {
            pending: {
                icon: FiClock,
                color: "text-warning",
                bg: "bg-warning/10",
            },
            approved: {
                icon: FiCheckCircle,
                color: "text-success",
                bg: "bg-success/10",
            },
            rejected: {
                icon: FiXCircle,
                color: "text-primary",
                bg: "bg-primary/10",
            },
        };
        const key = statusMap[application.approvalStatus] ? application.approvalStatus : "pending";
        const s = statusMap[key];
        const Icon = s.icon;

        return (
            <div className="p-6 lg:p-8 max-w-xl mx-auto">
                <div className={`rounded-2xl border border-base-300 p-8 text-center ${s.bg}`}>
                    <Icon className={`mx-auto mb-4 ${s.color}`} size={40} />
                    <h2 className="font-black text-xl mb-2">{t(`status.${key}.title`)}</h2>
                    <p className="text-sm text-base-content/60">{key === "rejected" && application.rejectionReason ? application.rejectionReason : t(`status.${key}.text`)}</p>
                    {application.specialty && (
                        <p className="text-xs text-base-content/40 mt-3">{t("appliedFor", { specialty: specialtyName(application.specialty) })}</p>
                    )}
                    {application.approvalStatus === "rejected" && (
                        <button
                            onClick={() => setReapplyMode(true)}
                            className="btn btn-primary btn-sm mt-5"
                        >
                            {t("applyAgain")}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // No application yet — show the form
    return (
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
            <div className="bg-base-100 rounded-2xl shadow-lg border border-base-300 p-6 md:p-8">
                <h1 className="text-2xl font-black mb-1">
                    {t("title1")} <span className="text-primary">{t("title2")}</span>
                </h1>
                <p className="text-sm text-base-content/60 mb-6">{t("intro")}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label font-medium">{t("specialty")}</label>
                        <select
                            name="specialty"
                            value={form.specialty}
                            onChange={handleChange}
                            className="select select-bordered w-full"
                            required
                        >
                            <option value="">{t("selectSpecialty")}</option>
                            {SPECIALTIES.map((s) => (
                                <option key={s} value={s}>{specialtyName(s)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label font-medium">{t("degree")}</label>
                            <input
                                name="degree"
                                value={form.degree}
                                onChange={handleChange}
                                placeholder={t("degreeHint")}
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="label font-medium">{t("registration")}</label>
                            <input
                                name="registrationNumber"
                                value={form.registrationNumber}
                                onChange={handleChange}
                                placeholder={t("registrationHint")}
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label font-medium">{t("hospital")}</label>
                            <HospitalSelect
                                value={form.hospitalId}
                                onChange={(hospitalId) => setForm((prev) => ({ ...prev, hospitalId }))}
                            />
                        </div>
                        <div>
                            <label className="label font-medium">{t("phone")}</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder={t("phoneHint")}
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label font-medium">{t("experience")}</label>
                            <input
                                name="experience"
                                value={form.experience}
                                onChange={handleChange}
                                placeholder={t("experienceHint")}
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div>
                            <label className="label font-medium">{t("location")}</label>
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder={t("locationHint")}
                                className="input input-bordered w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label font-medium">{t("consultations")}</label>
                        <select
                            name="consultationType"
                            value={form.consultationType}
                            onChange={handleChange}
                            className="select select-bordered w-full"
                        >
                            {CONSULTATION_TYPES.map((c) => (
                                <option key={c.value} value={c.value}>{tc(`consultation.${c.value}`)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label font-medium">{t("fee")}</label>
                        <input
                            type="number"
                            name="fee"
                            value={form.fee}
                            onChange={handleChange}
                            placeholder="500"
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div>
                        <label className="label font-medium">{t("bio")}</label>
                        <textarea
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            placeholder={t("bioHint")}
                            className="textarea textarea-bordered w-full"
                            rows={3}
                        />
                    </div>

                    <CloudinaryUpload
                        label={t("picture")}
                        value={form.image}
                        onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
                        accept="image/*"
                    />

                    <CloudinaryUpload
                        label={t("credential")}
                        value={form.credentialImageUrl}
                        onChange={(url) => setForm((prev) => ({ ...prev, credentialImageUrl: url }))}
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary w-full mt-2"
                    >
                        {submitting ? <span className="loading loading-spinner loading-sm" /> : t("submit")}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BecomeDoctorPage;
