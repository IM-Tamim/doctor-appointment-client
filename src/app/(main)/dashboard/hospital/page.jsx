"use client";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiUserPlus, FiUserMinus, FiExternalLink } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { useApiData, unwrap } from "@/lib/useApiData";
import { getManagedHospital, updateManagedHospital, attachDoctor, detachDoctor } from "@/lib/emergency";
import HospitalForm, { toHospitalForm } from "@/components/pages/hospitals/HospitalForm";
import AmbulanceManager from "@/components/pages/hospitals/AmbulanceManager";
import Avatar from "@/components/shared/Avatar";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";

const HospitalManagerPage = () => {
    const t = useTranslations("manager");
    const specialtyName = useLabel("common.specialties");
    const { money, number } = useFormat();
    const { data, error, reload } = useApiData(async (token) => unwrap(await getManagedHospital(token)));
    const [saving, setSaving] = useState(false);
    const [email, setEmail] = useState("");

    const withToken = async (fn) => {
        const { data: tokenData } = await authClient.token();
        return fn(tokenData?.token);
    };

    const save = async (form) => {
        setSaving(true);
        const res = await withToken((t) => updateManagedHospital(form, t));
        setSaving(false);
        if (!res.ok) return toast.error(res.message);
        toast.success(t("updated"));
        reload();
    };

    const attach = async (e) => {
        e.preventDefault();
        const res = await withToken((t) => attachDoctor(email, t));
        if (!res.ok) return toast.error(res.message);
        toast.success(t("attached", { name: res.data.name }));
        setEmail("");
        reload();
    };

    const detach = async (doctor) => {
        if (!window.confirm(t("confirmDetach", { name: doctor.name }))) return;
        const res = await withToken((t) => detachDoctor(doctor._id, t));
        if (!res.ok) return toast.error(res.message);
        toast.success(t("detached"));
        reload();
    };

    if (error) return <p className="p-8 text-sm text-error">{error}</p>;
    if (!data) {
        return (
            <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
                <div className="skeleton h-9 w-72" />
                <div className="skeleton h-64 rounded-2xl" />
            </div>
        );
    }

    const { hospital, doctors } = data;
    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-black">{hospital.name}</h1>
                <Link href={`/hospitals/${hospital._id}`} className="btn btn-ghost btn-sm gap-1"><FiExternalLink size={13} /> {t("publicPage")}</Link>
            </div>

            <HospitalForm
                key={hospital._id + (hospital.emergencyPhone || "")}
                initial={toHospitalForm(hospital)}
                onSubmit={save}
                saving={saving}
                submitLabel={t("save")}
                lockIdentity
            />

            <section className="bg-base-100 border border-base-300 rounded-2xl p-5">
                <h2 className="font-bold mb-3">{t("doctors", { count: number(doctors.length) })}</h2>
                <div className="space-y-2 mb-4">
                    {doctors.map((d) => (
                        <div key={d._id} className="flex items-center gap-3 bg-base-200 rounded-xl px-3 py-2">
                            <Avatar src={d.image} name={d.name} size="sm" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{d.name}</p>
                                <p className="text-xs text-base-content/50">{specialtyName(d.specialty)} · {money(d.fee)} · ★ {d.rating != null ? number(d.rating) : "—"}</p>
                            </div>
                            <button onClick={() => detach(d)} className="btn btn-ghost btn-xs text-error gap-1"><FiUserMinus size={12} /> {t("remove")}</button>
                        </div>
                    ))}
                    {doctors.length === 0 && <p className="text-sm text-base-content/50">{t("none")}</p>}
                </div>
                <form onSubmit={attach} className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("emailHint")}
                        aria-label={t("emailLabel")}
                        className="input input-bordered input-sm flex-1"
                        required
                    />
                    <button className="btn btn-primary btn-sm gap-1"><FiUserPlus size={13} /> {t("add")}</button>
                </form>
                <p className="text-[11px] text-base-content/45 mt-2">{t("note")}</p>
            </section>

            <AmbulanceManager hospitalId={String(hospital._id)} />
        </div>
    );
};

export default HospitalManagerPage;
