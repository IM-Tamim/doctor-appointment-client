"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { useApiData, unwrap } from "@/lib/useApiData";
import { getProfiles, createProfile, updateProfile, deleteProfile, RELATIONS } from "@/lib/patient";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";

const EMPTY = { name: "", age: "", gender: "", relation: "" };

const FamilyPage = () => {
    const t = useTranslations("family");
    const tc = useTranslations("common");
    const relationName = useLabel("common.relations");
    const genderName = useLabel("common.genders");
    const { number } = useFormat();
    const { data: profiles, reload: load } = useApiData(async (token) => unwrap(await getProfiles(token)));
    const [editing, setEditing] = useState(null); // null | "new" | profile
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);

    const startEdit = (p) => {
        setEditing(p);
        setForm(p === "new" ? EMPTY : { name: p.name, age: p.age, gender: p.gender, relation: p.relation });
    };

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        const { data: tokenData } = await authClient.token();
        const body = { ...form, age: Number(form.age) };
        const res = editing === "new"
            ? await createProfile(body, tokenData?.token)
            : await updateProfile(editing.id, body, tokenData?.token);
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        toast.success(editing === "new" ? t("added") : t("saved"));
        setEditing(null);
        load();
    };

    const remove = async (p) => {
        if (!window.confirm(t("confirmRemove", { name: p.name }))) return;
        const { data: tokenData } = await authClient.token();
        const res = await deleteProfile(p.id, tokenData?.token);
        if (!res.ok) return toast.error(res.message);
        toast.success(t("removed"));
        load();
    };

    const field = "input input-bordered w-full rounded-xl";

    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-black">
                    {t("title1")} <span className="text-primary">{t("title2")}</span>
                </h1>
                {editing === null && (
                    <button onClick={() => startEdit("new")} className="btn btn-primary btn-sm gap-1">
                        <FiPlus size={14} /> {t("addMember")}
                    </button>
                )}
            </div>
            <p className="text-sm text-base-content/50 mb-6">
                {t("intro")}
            </p>

            {editing !== null && (
                <form onSubmit={save} className="bg-base-100 border border-base-300 rounded-2xl p-5 mb-6 grid sm:grid-cols-2 gap-3">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("fullName")} aria-label={t("fullName")} className={`${field} sm:col-span-2`} required />
                    <input type="number" min="0" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder={t("age")} aria-label={t("age")} className={field} required />
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} aria-label={t("gender")} className="select select-bordered w-full rounded-xl" required>
                        <option value="">{t("gender")}</option>
                        {["Male", "Female", "Other"].map((g) => <option key={g} value={g}>{genderName(g)}</option>)}
                    </select>
                    <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} aria-label={t("relation")} className="select select-bordered w-full rounded-xl sm:col-span-2 capitalize" required>
                        <option value="">{t("relationTo")}</option>
                        {RELATIONS.map((r) => <option key={r} value={r} className="capitalize">{relationName(r)}</option>)}
                    </select>
                    <div className="flex gap-2 sm:col-span-2 justify-end">
                        <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost">{tc("cancel")}</button>
                        <button disabled={busy} className="btn btn-primary">
                            {busy ? <span className="loading loading-spinner loading-sm" /> : editing === "new" ? tc("add") : tc("save")}
                        </button>
                    </div>
                </form>
            )}

            {profiles === null ? (
                <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
            ) : profiles.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                    <FiUsers size={28} className="text-base-content/30" />
                    <p className="text-sm text-base-content/50">{t("none")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {profiles.map((p) => (
                        <div key={p.id} className="bg-base-100 border border-base-300 rounded-2xl p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary shrink-0">
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold truncate">{p.name}</p>
                                    <p className="text-xs text-base-content/50 capitalize">{t("summary", { relation: relationName(p.relation), age: number(p.age), gender: genderName(p.gender) })}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => startEdit(p)} className="btn btn-ghost btn-xs gap-1"><FiEdit2 size={11} /> {tc("edit")}</button>
                                <button onClick={() => remove(p)} className="btn btn-ghost btn-xs text-error gap-1"><FiTrash2 size={11} /> {tc("remove")}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FamilyPage;
