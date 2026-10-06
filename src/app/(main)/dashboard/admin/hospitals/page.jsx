"use client";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiPhone, FiMapPin } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { useApiData } from "@/lib/useApiData";
import { fetchHospitalOptions, createHospital, updateHospital, deleteHospital } from "@/lib/hospitals";
import HospitalForm, { toHospitalForm } from "@/components/pages/hospitals/HospitalForm";
import AmbulanceManager from "@/components/pages/hospitals/AmbulanceManager";
import HospitalCover from "@/components/pages/hospitals/HospitalCover";
import Pagination from "@/components/shared/Pagination";
import { useTranslations } from "next-intl";

const PAGE_SIZE = 8;

const AdminHospitalsPage = () => {
    const t = useTranslations("admin.hospitals");
    const th = useTranslations("hospitals");
    const tc = useTranslations("common");
    const { data, loading, reload: load } = useApiData(() => fetchHospitalOptions());
    const hospitals = data || [];
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(hospitals.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = hospitals.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const [editing, setEditing] = useState(null); // null | "new" | hospital
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const handleSubmit = async (form) => {
        setSaving(true);
        try {
            const { data: tokenData } = await authClient.token();
            const result = editing === "new"
                ? await createHospital(form, tokenData?.token)
                : await updateHospital(editing._id, form, tokenData?.token);
            if (result?.message) {
                toast.error(result.message);
                return;
            }
            toast.success(editing === "new" ? t("added") : t("updated"));
            setEditing(null);
            load();
        } catch {
            toast.error(t("saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const { data: tokenData } = await authClient.token();
            const result = await deleteHospital(id, tokenData?.token);
            if (result?.message) {
                toast.error(result.message);
                return;
            }
            toast.success(t("removed"));
            load();
        } catch {
            toast.error(t("deleteFailed"));
        } finally {
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl md:text-3xl font-black">
                    {t("title1")} <span className="text-primary">{t("title2")}</span>
                </h1>
                {editing === null && (
                    <button onClick={() => setEditing("new")} className="btn btn-primary btn-sm gap-1">
                        <FiPlus size={14} /> {t("add")}
                    </button>
                )}
            </div>

            {editing !== null && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold">{editing === "new" ? t("new") : t("edit", { name: editing.name })}</h2>
                        <button onClick={() => setEditing(null)} className="btn btn-ghost btn-xs btn-circle" aria-label={t("closeForm")}>
                            <FiX size={14} />
                        </button>
                    </div>
                    <HospitalForm
                        key={editing === "new" ? "new" : editing._id}
                        initial={toHospitalForm(editing === "new" ? {} : editing)}
                        onSubmit={handleSubmit}
                        onCancel={() => setEditing(null)}
                        saving={saving}
                        submitLabel={editing === "new" ? t("add") : t("save")}
                    />
                    {editing !== "new" && (
                        <div className="mt-4">
                            <AmbulanceManager hospitalId={String(editing._id)} />
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
                </div>
            ) : hospitals.length === 0 ? (
                <p className="text-center py-16 text-base-content/50">{t("none")}</p>
            ) : (
                <div className="space-y-3">
                    {paged.map((h) => (
                        <div key={h._id} className="bg-base-100 rounded-2xl border border-base-300 p-4 flex flex-wrap items-center justify-between gap-4">
                            <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-base-200">
                                <HospitalCover hospital={h} sizes="160px" className="[&_span]:text-base" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <Link href={`/hospitals/${h._id}`} className="font-bold hover:text-primary">{h.name}</Link>
                                <p className="text-xs text-base-content/50 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="flex items-center gap-1"><FiMapPin size={11} /> {h.city}</span>
                                    {h.emergencyPhone && <span className="flex items-center gap-1"><FiPhone size={11} /> {h.emergencyPhone}</span>}
                                    <span>{th("doctors", { count: h.doctorCount || 0 })}</span>
                                    <span>{t("departments", { count: (h.departments || []).length })}</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditing(h)} className="btn btn-xs btn-outline gap-1">
                                    <FiEdit2 size={11} /> {tc("edit")}
                                </button>
                                {confirmDeleteId === h._id ? (
                                    <>
                                        <button onClick={() => handleDelete(h._id)} className="btn btn-xs btn-error">{t("confirmDelete")}</button>
                                        <button onClick={() => setConfirmDeleteId(null)} className="btn btn-xs btn-ghost">{tc("cancel")}</button>
                                    </>
                                ) : (
                                    <button onClick={() => setConfirmDeleteId(h._id)} className="btn btn-xs btn-error btn-soft gap-1">
                                        <FiTrash2 size={11} /> {t("delete")}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                </div>
            )}
        </div>
    );
};

export default AdminHospitalsPage;
