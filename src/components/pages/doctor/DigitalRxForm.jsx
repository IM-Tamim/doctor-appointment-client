"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiDownload } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { getAppointmentPrescription, saveDigitalPrescription, downloadPrescription } from "@/lib/appointments";
import { addDaysISO } from "@/lib/schedule";
import { useLocale, useTranslations } from "next-intl";

const EMPTY_MED = { name: "", dose: "", frequency: "", duration: "" };
const FREQ_HINTS = ["1+0+1", "1+1+1", "1+0+0", "0+0+1", "1+1+1+1"];

/**
 * Structured prescription for a completed visit. The 1+0+1 style frequency is
 * what medicine reminders read (morning + noon + night).
 */
const DigitalRxForm = ({ appointment, onSaved, onCancel }) => {
    const t = useTranslations("rxForm");
    const locale = useLocale();
    const [form, setForm] = useState({ medicines: [{ ...EMPTY_MED }], tests: "", advice: "", followUpDate: "" });
    const [existing, setExisting] = useState(null);
    const [loading, setLoading] = useState(Boolean(appointment.prescriptionId));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!appointment.prescriptionId) return;
        (async () => {
            const { data: tokenData } = await authClient.token();
            const res = await getAppointmentPrescription(appointment._id, tokenData?.token);
            if (res.ok) {
                setExisting(res.data);
                setForm({
                    medicines: res.data.medicines?.length ? res.data.medicines : [{ ...EMPTY_MED }],
                    tests: (res.data.tests || []).join(", "),
                    advice: res.data.advice || "",
                    followUpDate: res.data.followUpDate || "",
                });
            }
            setLoading(false);
        })();
    }, [appointment]);

    const setMed = (i, key, value) =>
        setForm((f) => ({ ...f, medicines: f.medicines.map((m, j) => (j === i ? { ...m, [key]: value } : m)) }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const { data: tokenData } = await authClient.token();
        const res = await saveDigitalPrescription(
            appointment._id,
            { ...form, medicines: form.medicines.filter((m) => m.name.trim()), followUpDate: form.followUpDate || null },
            tokenData?.token
        );
        setSaving(false);
        if (!res.ok) return toast.error(res.message);
        toast.success(t("saved"));
        onSaved?.();
    };

    const pdf = async () => {
        try {
            const { data: tokenData } = await authClient.token();
            await downloadPrescription(existing, tokenData?.token, locale);
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="skeleton h-40 rounded-xl mt-4" />;

    const field = "input input-bordered input-sm rounded-lg w-full";
    return (
        <form onSubmit={save} className="mt-4 pt-4 border-t border-base-300 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-base-content/50">{t("medicines")}</p>
            {form.medicines.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input value={m.name} onChange={(e) => setMed(i, "name", e.target.value)} placeholder={t("medicine")} aria-label={t("medicineN", { n: i + 1 })} className={`${field} col-span-12 sm:col-span-4`} />
                    <input value={m.dose} onChange={(e) => setMed(i, "dose", e.target.value)} placeholder={t("dose")} aria-label={t("doseN", { n: i + 1 })} className={`${field} col-span-4 sm:col-span-2`} />
                    <input value={m.frequency} onChange={(e) => setMed(i, "frequency", e.target.value)} placeholder="1+0+1" list="rx-freq" aria-label={t("frequencyN", { n: i + 1 })} className={`${field} col-span-4 sm:col-span-3`} />
                    <input value={m.duration} onChange={(e) => setMed(i, "duration", e.target.value)} placeholder={t("duration")} aria-label={t("durationN", { n: i + 1 })} className={`${field} col-span-3 sm:col-span-2`} />
                    <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, medicines: f.medicines.filter((_, j) => j !== i) }))}
                        disabled={form.medicines.length === 1}
                        aria-label={t("removeN", { n: i + 1 })}
                        className="btn btn-ghost btn-xs btn-circle text-error col-span-1"
                    >
                        <FiTrash2 size={13} />
                    </button>
                </div>
            ))}
            <datalist id="rx-freq">{[...FREQ_HINTS, t("asNeeded")].map((f) => <option key={f} value={f} />)}</datalist>
            <button type="button" onClick={() => setForm((f) => ({ ...f, medicines: [...f.medicines, { ...EMPTY_MED }] }))} className="btn btn-xs btn-outline gap-1">
                <FiPlus size={11} /> {t("add")}
            </button>

            <div className="grid sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-base-content/60" htmlFor={`tests-${appointment._id}`}>{t("tests")}</label>
                    <input id={`tests-${appointment._id}`} value={form.tests} onChange={(e) => setForm({ ...form, tests: e.target.value })} placeholder={t("testsHint")} className={field} />
                </div>
                <div>
                    <label className="text-xs font-semibold text-base-content/60" htmlFor={`fu-${appointment._id}`}>{t("followUp")}</label>
                    <input
                        id={`fu-${appointment._id}`}
                        type="date"
                        min={addDaysISO(appointment.appointmentDate, 1)}
                        value={form.followUpDate}
                        onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                        className={field}
                    />
                </div>
            </div>
            <textarea
                value={form.advice}
                onChange={(e) => setForm({ ...form, advice: e.target.value })}
                rows={3}
                placeholder={t("advice")}
                aria-label={t("adviceLabel")}
                className="textarea textarea-bordered w-full text-sm rounded-xl"
            />
            <div className="flex flex-wrap gap-2">
                <button disabled={saving} className="btn btn-xs btn-primary">
                    {saving ? <span className="loading loading-spinner loading-xs" /> : existing ? t("update") : t("save")}
                </button>
                {existing && (
                    <button type="button" onClick={pdf} className="btn btn-xs btn-outline gap-1"><FiDownload size={11} /> PDF</button>
                )}
                <button type="button" onClick={onCancel} className="btn btn-xs btn-ghost">{t("close")}</button>
            </div>
        </form>
    );
};

export default DigitalRxForm;
