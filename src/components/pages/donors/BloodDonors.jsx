"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiDroplet, FiMapPin, FiPhone, FiLock, FiAlertTriangle, FiCheckCircle, FiSearch } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import {
    BLOOD_GROUPS, searchDonors, getMyDonorProfile, saveMyDonorProfile, deleteMyDonorProfile,
    getBloodRequests, createBloodRequest, closeBloodRequest,
} from "@/lib/emergency";
import { todayISO } from "@/lib/schedule";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";
import Pagination from "@/components/shared/Pagination";

const field = "input input-bordered input-sm w-full rounded-lg";

const tokenOrNull = async (session) => {
    if (!session) return null;
    const { data } = await authClient.token();
    return data?.token || null;
};

const GroupChips = ({ value, onChange, allowAll = true }) => {
    const t = useTranslations("donors");
    return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("group")}>
        {[...(allowAll ? [""] : []), ...BLOOD_GROUPS].map((g) => (
            <button
                key={g || "all"}
                type="button"
                role="radio"
                aria-checked={value === g}
                onClick={() => onChange(g)}
                className={`min-w-11 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    value === g ? "bg-error text-error-content border-error" : "bg-base-100 border-base-300 hover:border-error/50"
                }`}
            >
                {g || t("all")}
            </button>
        ))}
    </div>
    );
};

const DonorForm = ({ session }) => {
    const t = useTranslations("donors");
    const tc = useTranslations("common");
    const { date: prettyDate } = useFormat();
    const [donor, setDonor] = useState(undefined);
    const [form, setForm] = useState({ bloodGroup: "", area: "", phone: "", lastDonationDate: "", available: true });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await getMyDonorProfile(await tokenOrNull(session));
            const d = res.ok ? res.data : null;
            setDonor(d);
            if (d) setForm({ bloodGroup: d.bloodGroup, area: d.area, phone: d.phone, lastDonationDate: d.lastDonationDate || "", available: d.available });
            else setForm((f) => ({ ...f, phone: session.user.phone || "" }));
        })();
    }, [session]);

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await saveMyDonorProfile({ ...form, lastDonationDate: form.lastDonationDate || null }, await tokenOrNull(session));
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        setDonor(res.data);
        toast.success(t("saved"));
    };

    const remove = async () => {
        const res = await deleteMyDonorProfile(await tokenOrNull(session));
        if (res.ok) {
            setDonor(null);
            toast.success(t("unlisted"));
        }
    };

    if (donor === undefined) return <div className="skeleton h-48 rounded-2xl" />;

    return (
        <form onSubmit={save} className="bg-base-100 border border-base-300 rounded-2xl p-5 space-y-3">
            <h2 className="font-bold flex items-center gap-2"><FiDroplet className="text-error" /> {donor ? t("yourProfile") : t("become")}</h2>
            {donor && (
                <p className={`text-xs rounded-lg px-3 py-2 flex items-center gap-1.5 ${donor.eligibleFrom <= todayISO() ? "bg-success/10" : "bg-warning/10"}`}>
                    <FiCheckCircle size={12} />
                    {donor.eligibleFrom <= todayISO() ? t("canNow") : t("canFrom", { date: prettyDate(donor.eligibleFrom) })}
                </p>
            )}
            <GroupChips value={form.bloodGroup} onChange={(bloodGroup) => setForm({ ...form, bloodGroup })} allowAll={false} />
            <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder={t("areaHint")} aria-label={t("area")} className={field} required />
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("phone")} aria-label={t("phone")} className={field} required />
            <label className="text-xs text-base-content/60 flex flex-col gap-1">
                {t("lastDonation")}
                <input type="date" max={todayISO()} value={form.lastDonationDate} onChange={(e) => setForm({ ...form, lastDonationDate: e.target.value })} className={field} />
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="toggle toggle-sm toggle-success" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                {t("available")}
            </label>
            <p className="text-[11px] text-base-content/45">{t("gap")}</p>
            <div className="flex gap-2">
                <button disabled={busy || !form.bloodGroup} className="btn btn-error btn-sm flex-1">
                    {busy ? <span className="loading loading-spinner loading-xs" /> : donor ? tc("save") : t("register")}
                </button>
                {donor && <button type="button" onClick={remove} className="btn btn-ghost btn-sm">{tc("remove")}</button>}
            </div>
        </form>
    );
};

const RequestForm = ({ session, onPosted }) => {
    const t = useTranslations("donors");
    const [form, setForm] = useState({ bloodGroup: "", area: "", hospital: "", units: 1, contactPhone: session.user.phone || "", neededBy: "", note: "" });
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await createBloodRequest({ ...form, neededBy: form.neededBy || null }, await tokenOrNull(session));
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        toast.success(res.data.notified ? t("postedNotified", { count: res.data.notified }) : t("posted"));
        setForm((f) => ({ ...f, note: "", hospital: "" }));
        onPosted();
    };

    return (
        <form onSubmit={submit} className="bg-base-100 border border-error/30 rounded-2xl p-5 space-y-3">
            <h2 className="font-bold flex items-center gap-2"><FiAlertTriangle className="text-error" /> {t("request")}</h2>
            <GroupChips value={form.bloodGroup} onChange={(bloodGroup) => setForm({ ...form, bloodGroup })} allowAll={false} />
            <div className="grid grid-cols-2 gap-2">
                <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder={t("areaCity")} aria-label={t("area")} className={`${field} col-span-2`} required />
                <input value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} placeholder={t("hospitalOpt")} aria-label={t("hospital")} className={`${field} col-span-2`} />
                <input type="number" min="1" max="10" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} aria-label={t("units")} className={field} />
                <input type="date" min={todayISO()} value={form.neededBy} onChange={(e) => setForm({ ...form, neededBy: e.target.value })} aria-label={t("neededBy")} className={field} />
                <input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder={t("contact")} aria-label={t("contact")} className={`${field} col-span-2`} required />
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={t("noteOpt")} aria-label={t("note")} className={`${field} col-span-2`} />
            </div>
            <button disabled={busy || !form.bloodGroup} className="btn btn-error btn-sm w-full">
                {busy ? <span className="loading loading-spinner loading-xs" /> : t("post")}
            </button>
        </form>
    );
};

const BloodDonors = () => {
    const t = useTranslations("donors");
    const { date: prettyDate, number } = useFormat();
    const { data: session, isPending } = authClient.useSession();
    const [group, setGroup] = useState("");
    const [area, setArea] = useState("");
    const [areaQuery, setAreaQuery] = useState("");
    const [page, setPage] = useState(1);
    const [result, setResult] = useState(null);
    const [requests, setRequests] = useState([]);
    const [reqVersion, setReqVersion] = useState(0);
    const debounce = useRef(null);

    useEffect(() => {
        if (isPending) return;
        let cancelled = false;
        (async () => {
            const res = await searchDonors({ bloodGroup: group, area: areaQuery, page }, await tokenOrNull(session));
            if (!cancelled) setResult(res.ok ? res.data : { donors: [], total: 0, totalPages: 1, phoneVisible: false });
        })();
        return () => { cancelled = true; };
    }, [group, areaQuery, page, session, isPending]);

    useEffect(() => {
        if (isPending) return;
        let cancelled = false;
        (async () => {
            const res = await getBloodRequests({}, await tokenOrNull(session));
            if (!cancelled && res.ok) setRequests(res.data);
        })();
        return () => { cancelled = true; };
    }, [session, isPending, reqVersion]);

    const onArea = (v) => {
        setArea(v);
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => { setAreaQuery(v.trim()); setPage(1); }, 300);
    };

    const close = async (id) => {
        const res = await closeBloodRequest(id, await tokenOrNull(session));
        if (res.ok) setReqVersion((v) => v + 1);
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-3">
                    <GroupChips value={group} onChange={(g) => { setGroup(g); setPage(1); }} />
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={14} />
                        <input value={area} onChange={(e) => onArea(e.target.value)} placeholder={t("search")} aria-label={t("area")} className="input input-bordered input-sm w-full rounded-lg pl-9" />
                    </div>
                </div>

                {result && !result.phoneVisible && (
                    <p className="text-xs bg-base-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                        <FiLock size={12} /> <Link href="/signin?callbackUrl=/blood-donors" className="link link-primary">{t("signIn")}</Link> {t("toSeePhones")}
                    </p>
                )}

                {!result ? (
                    <div className="grid sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
                ) : result.donors.length === 0 ? (
                    <p className="text-center text-sm text-base-content/50 py-12">{t("none")}</p>
                ) : (
                    <>
                        <p className="text-xs text-base-content/50">{t("count", { count: result.total })}</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {result.donors.map((d) => (
                                <div key={d._id} className="bg-base-100 border border-base-300 rounded-2xl p-4 flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-error/10 text-error font-black flex items-center justify-center shrink-0">{d.bloodGroup}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold truncate">{d.name}</p>
                                        <p className="text-xs text-base-content/55 flex items-center gap-1 truncate"><FiMapPin size={11} /> {d.area}</p>
                                        <p className="text-[11px] text-base-content/40">{d.lastDonationDate ? t("lastDonated", { date: prettyDate(d.lastDonationDate) }) : t("firstTime")}</p>
                                    </div>
                                    {d.phone ? (
                                        <a href={`tel:${d.phone}`} className="btn btn-success btn-sm btn-circle" aria-label={t("call", { name: d.name })}><FiPhone size={14} /></a>
                                    ) : (
                                        <span className="btn btn-ghost btn-sm btn-circle btn-disabled" aria-label={t("signInPhone")}><FiLock size={13} /></span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
                    </>
                )}

                <section>
                    <h2 className="font-bold mb-3 flex items-center gap-2"><FiAlertTriangle className="text-error" /> {t("openRequests")}</h2>
                    {requests.length === 0 ? (
                        <p className="text-sm text-base-content/50">{t("noRequests")}</p>
                    ) : (
                        <div className="space-y-2">
                            {requests.map((r) => (
                                <div key={r._id} className="bg-base-100 border border-base-300 rounded-xl p-3 flex items-center gap-3">
                                    <span className="badge badge-error font-bold">{r.bloodGroup}</span>
                                    <div className="min-w-0 flex-1 text-sm">
                                        <p className="font-semibold truncate">{t("unitsCount", { count: r.units })} · {r.area}{r.hospital ? ` · ${r.hospital}` : ""}</p>
                                        <p className="text-xs text-base-content/50 truncate">
                                            {r.neededBy ? t("neededOn", { date: prettyDate(r.neededBy) }) : t("soon")}{r.note ? ` · ${r.note}` : ""}
                                        </p>
                                    </div>
                                    {r.contactPhone ? (
                                        <a href={`tel:${r.contactPhone}`} className="btn btn-xs btn-error btn-outline gap-1"><FiPhone size={11} /> {t("callShort")}</a>
                                    ) : (
                                        <FiLock className="text-base-content/30" aria-label={t("signInContact")} />
                                    )}
                                    {session && r.userId === session.user.id && (
                                        <button onClick={() => close(r._id)} className="btn btn-xs btn-ghost">{t("close")}</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div className="space-y-4">
                {session ? (
                    <>
                        <DonorForm session={session} />
                        <RequestForm session={session} onPosted={() => setReqVersion((v) => v + 1)} />
                    </>
                ) : (
                    <div className="bg-base-100 border border-base-300 rounded-2xl p-5 text-sm space-y-3">
                        <p className="font-bold">{t("helpTitle")}</p>
                        <p className="text-base-content/60">{t("helpText")}</p>
                        <Link href="/signin?callbackUrl=/blood-donors" className="btn btn-error btn-sm w-full">{t("signIn")}</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BloodDonors;
