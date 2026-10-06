"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { applyAsDoctor } from "@/lib/doctors";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import HospitalSelect from "@/components/shared/HospitalSelect";
import { SPECIALTIES, CONSULTATION_TYPES } from "@/lib/specialties";
import { useTranslations } from "next-intl";
import { useLabel } from "@/lib/i18n";


const ApplyDoctorPage = () => {
    const t = useTranslations("doctorForm");
    const tc = useTranslations("common");
    const specialtyName = useLabel("common.specialties");
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [form, setForm] = useState({
        specialty: "",
        degree: "",
        registrationNumber: "",
        hospitalId: "",
        phone: "",
        bio: "",
        fee: "",
        credentialImageUrl: "",
        consultationType: "in-person",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.specialty || !form.degree || !form.registrationNumber || !form.phone) {
            toast.error(t("required"));
            return;
        }

        setSubmitting(true);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            const result = await applyAsDoctor(
                { ...form, fee: Number(form.fee) || 0 },
                token
            );
            if (result?.message) {
                toast.error(result.message);
            } else {
                toast.success(t("submitted"));
                router.push("/dashboard/patient");
            }
        } catch {
            toast.error(t("error"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 py-10">
            <div className="container mx-auto px-4 max-w-2xl">
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
                            {/* The API has always required a phone number; this form
                                never sent one, so every submission was rejected. */}
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
                            label={t("credentialOptional")}
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
        </div>
    );
};

export default ApplyDoctorPage;
