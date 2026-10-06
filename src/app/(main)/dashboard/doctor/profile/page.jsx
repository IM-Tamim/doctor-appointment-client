"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getMyDoctorProfile, updateMyDoctorProfile } from "@/lib/doctors";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import HospitalSelect from "@/components/shared/HospitalSelect";
import { SPECIALTIES, CONSULTATION_TYPES } from "@/lib/specialties";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";

const DoctorProfilePage = () => {
    const t = useTranslations("doctorProfile");
    const tf = useTranslations("doctorForm");
    const tc = useTranslations("common");
    const specialtyName = useLabel("common.specialties");
    const { number } = useFormat();
    const { data: session } = authClient.useSession();
    const [form, setForm] = useState({
        bio: "", fee: "", image: "", specialty: "", hospitalId: "", experience: "", location: "",
        consultationType: "in-person", followUpFeePercent: 100,
    });
    const [readOnly, setReadOnly] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!session) return;
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            const doctor = await getMyDoctorProfile(token);
            if (doctor && !doctor.message) {
                setForm({
                    bio: doctor.bio || "",
                    fee: doctor.fee || "",
                    image: doctor.image || "",
                    specialty: doctor.specialty || "",
                    hospitalId: doctor.hospitalId || "",
                    experience: doctor.experience || "",
                    location: doctor.location || "",
                    consultationType: doctor.consultationType || "in-person",
                    followUpFeePercent: doctor.followUpFeePercent ?? 100,
                });
                setReadOnly({
                    name: doctor.name,
                    email: doctor.email,
                    degree: doctor.degree,
                    registrationNumber: doctor.registrationNumber,
                    rating: doctor.rating,
                    totalReviews: doctor.totalReviews,
                });
            }
            setLoading(false);
        };
        load();
    }, [session]);

    const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            const result = await updateMyDoctorProfile(
                { ...form, fee: Number(form.fee) || 0, followUpFeePercent: Number(form.followUpFeePercent) },
                token
            );
            if (result?.message && !result?.acknowledged) {
                toast.error(result.message);
                return;
            }
            toast.success(t("updated"));
        } catch {
            toast.error(t("failed"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-6">
                {t("title1")} <span className="text-primary">{t("title2")}</span>
            </h1>

            <div className="bg-base-100 rounded-2xl border border-base-300 p-6 mb-6">
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <p><span className="text-base-content/50">{t("name")}</span> {readOnly.name}</p>
                    <p><span className="text-base-content/50">{t("email")}</span> {readOnly.email}</p>
                    <p><span className="text-base-content/50">{t("degree")}</span> {readOnly.degree}</p>
                    <p><span className="text-base-content/50">{t("regNo")}</span> {readOnly.registrationNumber}</p>
                    <p><span className="text-base-content/50">{t("rating")}</span> {t("reviews", { rating: number(readOnly.rating || 0), count: readOnly.totalReviews || 0 })}</p>
                </div>
                <p className="text-xs text-base-content/40 mt-3">
                    {t("locked")}
                </p>
            </div>

            <form onSubmit={handleSave} className="bg-base-100 rounded-2xl border border-base-300 p-6 space-y-4">
                <div>
                    <label className="label font-medium">{t("specialty")}</label>
                    <select name="specialty" value={form.specialty} onChange={handleChange} className="select select-bordered w-full">
                        {!SPECIALTIES.includes(form.specialty) && form.specialty && <option value={form.specialty}>{form.specialty}</option>}
                        {SPECIALTIES.map((s) => <option key={s} value={s}>{specialtyName(s)}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label font-medium">{tf("hospital")}</label>
                    <HospitalSelect
                        value={form.hospitalId}
                        onChange={(hospitalId) => setForm((prev) => ({ ...prev, hospitalId }))}
                    />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label font-medium">{tf("experience")}</label>
                        <input name="experience" value={form.experience} onChange={handleChange} placeholder={tf("experienceHint")} className="input input-bordered w-full" />
                    </div>
                    <div>
                        <label className="label font-medium">{tf("location")}</label>
                        <input name="location" value={form.location} onChange={handleChange} placeholder={tf("locationHint")} className="input input-bordered w-full" />
                    </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className="label font-medium">{tf("fee")}</label>
                        <input type="number" min="0" name="fee" value={form.fee} onChange={handleChange} className="input input-bordered w-full" />
                    </div>
                    <div>
                        <label className="label font-medium">{t("followUpFee")}</label>
                        <input type="number" min="0" max="100" name="followUpFeePercent" value={form.followUpFeePercent} onChange={handleChange} className="input input-bordered w-full" />
                    </div>
                    <div>
                        <label className="label font-medium">{tf("consultations")}</label>
                        <select name="consultationType" value={form.consultationType} onChange={handleChange} className="select select-bordered w-full">
                            {CONSULTATION_TYPES.map((c) => <option key={c.value} value={c.value}>{tc(`consultation.${c.value}`)}</option>)}
                        </select>
                    </div>
                </div>
                <CloudinaryUpload
                    label={t("photo")}
                    value={form.image}
                    onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
                    accept="image/*"
                />
                <div>
                    <label className="label font-medium">{t("bio")}</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} className="textarea textarea-bordered w-full" />
                </div>
                <button type="submit" disabled={saving} className="btn btn-primary w-full">
                    {saving ? <span className="loading loading-spinner loading-sm" /> : t("save")}
                </button>
            </form>
        </div>
    );
};

export default DoctorProfilePage;
