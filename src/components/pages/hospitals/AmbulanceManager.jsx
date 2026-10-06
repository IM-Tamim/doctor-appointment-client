"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiTruck } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { AMBULANCE_TYPES, fetchAmbulances, addAmbulance, updateAmbulance, removeAmbulance } from "@/lib/emergency";
import { useTranslations } from "next-intl";

/**
 * Ambulances for one hospital. Used by admins (any hospital) and hospital
 * managers (the server pins them to their own hospital regardless of input).
 */
const AmbulanceManager = ({ hospitalId }) => {
    const t = useTranslations("ambulances");
    const th = useTranslations("hospitals");
    const typeName = (type) => (th.has(`ambulanceTypes.${type}`) ? th(`ambulanceTypes.${type}`) : type);
    const [list, setList] = useState(null);
    const [version, setVersion] = useState(0);
    const [form, setForm] = useState({ type: "AC", phone: "", vehicleNo: "" });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetchAmbulances({ hospitalId }).then((res) => !cancelled && setList(res.ok ? res.data : []));
        return () => { cancelled = true; };
    }, [hospitalId, version]);

    const withToken = async (fn) => {
        const { data: tokenData } = await authClient.token();
        const res = await fn(tokenData?.token);
        if (!res.ok) toast.error(res.message);
        else setVersion((v) => v + 1);
        return res;
    };

    const add = async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await withToken((token) => addAmbulance({ ...form, hospitalId }, token));
        setBusy(false);
        if (res.ok) {
            toast.success(t("added"));
            setForm({ type: "AC", phone: "", vehicleNo: "" });
        }
    };

    return (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2"><FiTruck className="text-error" /> {t("title")}</h2>
            {list === null ? (
                <div className="skeleton h-16 rounded-xl" />
            ) : list.length === 0 ? (
                <p className="text-sm text-base-content/50 mb-3">{t("none")}</p>
            ) : (
                <div className="space-y-2 mb-4">
                    {list.map((a) => (
                        <div key={a._id} className="flex flex-wrap items-center gap-2 bg-base-200 rounded-xl px-3 py-2">
                            <span className="badge badge-sm badge-outline">{typeName(a.type)}</span>
                            <span className="text-sm font-semibold flex-1">{a.phone}{a.vehicleNo ? <span className="text-xs text-base-content/45"> · {a.vehicleNo}</span> : null}</span>
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-xs toggle-success"
                                    checked={a.available}
                                    onChange={() => withToken((token) => updateAmbulance(a._id, { available: !a.available }, token))}
                                />
                                {a.available ? th("available") : th("onCall")}
                            </label>
                            <button onClick={() => withToken((token) => removeAmbulance(a._id, token))} className="btn btn-ghost btn-xs text-error" aria-label={t("remove")}>
                                <FiTrash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={add} className="flex flex-wrap gap-2">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select select-bordered select-sm" aria-label={t("type")}>
                    {AMBULANCE_TYPES.map((type) => <option key={type} value={type}>{typeName(type)}</option>)}
                </select>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("phone")} aria-label={t("phone")} className="input input-bordered input-sm flex-1 min-w-32" required />
                <input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} placeholder={t("vehicle")} aria-label={t("vehicleLabel")} className="input input-bordered input-sm flex-1 min-w-32" />
                <button disabled={busy} className="btn btn-sm btn-error btn-outline gap-1"><FiPlus size={12} /> {t("add")}</button>
            </form>
        </div>
    );
};

export default AmbulanceManager;
