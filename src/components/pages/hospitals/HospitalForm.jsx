"use client";
import { useState } from "react";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import { useTranslations } from "next-intl";

export const toHospitalForm = (h = {}) => ({
    name: h.name || "",
    city: h.city || "",
    address: h.address || "",
    phone: h.phone || "",
    emergencyPhone: h.emergencyPhone || "",
    logo: h.logo || "",
    image: h.image || "",
    imageCredit: h.imageCredit || "",
    imageSource: h.imageSource || "",
    departments: (h.departments || []).join(", "),
});

/**
 * Hospital details form, shared by the admin (any hospital) and the hospital
 * manager (their own hospital). `lockIdentity` keeps name/city read-only for
 * managers — those identify the hospital platform-wide.
 */
const HospitalForm = ({ initial, onSubmit, onCancel, saving, submitLabel, lockIdentity = false }) => {
    const t = useTranslations("hospitalForm");
    const [form, setForm] = useState(initial);
    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
            className="bg-base-100 rounded-2xl border border-base-300 p-6 space-y-4"
        >
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label className="label font-medium">{t("name")}</label>
                    <input value={form.name} onChange={set("name")} className="input input-bordered w-full read-only:bg-base-200 read-only:text-base-content/60 read-only:cursor-not-allowed" required readOnly={lockIdentity} title={lockIdentity ? t("locked") : undefined} />
                </div>
                <div>
                    <label className="label font-medium">{t("city")}</label>
                    <input value={form.city} onChange={set("city")} className="input input-bordered w-full read-only:bg-base-200 read-only:text-base-content/60 read-only:cursor-not-allowed" required readOnly={lockIdentity} title={lockIdentity ? t("locked") : undefined} />
                </div>
            </div>
            <div>
                <label className="label font-medium">{t("address")}</label>
                <input value={form.address} onChange={set("address")} className="input input-bordered w-full" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label className="label font-medium">{t("phone")}</label>
                    <input type="tel" value={form.phone} onChange={set("phone")} className="input input-bordered w-full" />
                </div>
                <div>
                    <label className="label font-medium">{t("emergency")}</label>
                    <input type="tel" value={form.emergencyPhone} onChange={set("emergencyPhone")} className="input input-bordered w-full" />
                </div>
            </div>
            <div>
                <label className="label font-medium">{t("departments")}</label>
                <input
                    value={form.departments}
                    onChange={set("departments")}
                    placeholder={t("departmentsHint")}
                    className="input input-bordered w-full"
                />
            </div>
            <div>
                {/* A new photo needs its own credit; the old one no longer applies. */}
                <CloudinaryUpload
                    label={t("cover")}
                    accept="image/*"
                    value={form.image}
                    onChange={(image) => setForm((prev) => ({ ...prev, image, imageCredit: "", imageSource: "" }))}
                />
                <p className="text-[11px] text-base-content/45 mt-1">
                    {form.imageCredit ? t("coverCredit", { credit: form.imageCredit }) : t("coverHint")}
                </p>
            </div>
            <CloudinaryUpload
                label={t("logo")}
                accept="image/*"
                value={form.logo}
                onChange={(logo) => setForm((prev) => ({ ...prev, logo }))}
            />
            <div className="flex gap-2 justify-end">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="btn btn-ghost">{t("cancel")}</button>
                )}
                <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? <span className="loading loading-spinner loading-sm" /> : submitLabel}
                </button>
            </div>
        </form>
    );
};

export default HospitalForm;
