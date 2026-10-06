"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { hardSignOut } from "@/lib/hardSignOut";
import { getAllUsers, suspendUser, reactivateUser } from "@/lib/admin";
import Pagination from "@/components/shared/Pagination";
import { fetchHospitalOptions } from "@/lib/hospitals";
import { setHospitalManager } from "@/lib/emergency";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

const ROLE_FILTERS = ["all", "patient", "doctor", "hospital_admin", "admin"];
const PAGE_SIZE = 8;

/**
 * Hospital picker for the "make manager" action.
 *
 * This used to be an inline <select> that dismissed itself on blur. Opening a
 * native select popup can blur the element on some platforms, which unmounted
 * the control the moment it was clicked — the list looked like it refused to
 * open. A modal has no blur race, survives a mis-click, and gives 20+ hospitals
 * somewhere to be searched.
 */
const HospitalPicker = ({ user, hospitals, onCancel, onPick }) => {
    const t = useTranslations("admin.users");
    const tc = useTranslations("common");
    const [q, setQ] = useState("");
    const [picked, setPicked] = useState(user.hospitalId || "");

    const needle = q.trim().toLowerCase();
    const matches = needle
        ? hospitals.filter((h) => `${h.name} ${h.city || ""}`.toLowerCase().includes(needle))
        : hospitals;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-md bg-base-100 rounded-2xl border border-base-300 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex items-start justify-between gap-3 p-5 pb-3">
                    <div className="min-w-0">
                        <h3 className="font-black text-lg">{t("assignTitle", { name: user.name })}</h3>
                        <p className="text-sm text-base-content/50 mt-0.5">{t("which")}</p>
                    </div>
                    <button onClick={onCancel} className="btn btn-sm btn-ghost btn-circle" aria-label={tc("close")}>
                        <FiX size={16} />
                    </button>
                </div>

                <div className="px-5">
                    <input
                        autoFocus
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t("hospitalSearch")}
                        aria-label={t("hospitalSearch")}
                        className="input input-bordered input-sm w-full"
                    />
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
                    {matches.length === 0 && <p className="text-sm text-base-content/50 py-4 text-center">{t("noMatch")}</p>}
                    {matches.map((h) => (
                        <button
                            key={h._id}
                            type="button"
                            onClick={() => setPicked(h._id)}
                            aria-pressed={picked === h._id}
                            className={`w-full text-left rounded-xl px-3 py-2 border transition-colors ${picked === h._id
                                ? "border-primary bg-primary/10"
                                : "border-transparent hover:bg-base-200"
                                }`}
                        >
                            <span className="block text-sm font-semibold">{h.name}</span>
                            {h.city && <span className="block text-xs text-base-content/50">{h.city}</span>}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 p-5 pt-3 border-t border-base-300">
                    <button onClick={onCancel} className="btn btn-ghost flex-1 rounded-xl">{tc("cancel")}</button>
                    <button
                        onClick={() => onPick(picked)}
                        disabled={!picked}
                        className="btn btn-primary flex-1 rounded-xl font-bold"
                    >
                        {t("assign")}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminUsersPage = () => {
    const ta = useTranslations("admin");
    const t = useTranslations("admin.users");
    const tc = useTranslations("common");
    const tr = useTranslations("sidebar.roles");
    const roleName = (r) => (r === "all" ? t("all") : tr.has(r) ? tr(r) : r);
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirmId, setConfirmId] = useState(null);
    const [page, setPage] = useState(1);
    const [hospitals, setHospitals] = useState([]);
    const [managerFor, setManagerFor] = useState(null); // user object being assigned
    const [query, setQuery] = useState("");

    useEffect(() => {
        fetchHospitalOptions().then(setHospitals);
    }, []);

    const assignManager = async (u, hospitalId) => {
        const { data: tokenData } = await authClient.token();
        const res = await setHospitalManager(u._id, hospitalId, tokenData?.token);
        if (!res.ok) return toast.error(res.message);
        toast.success(hospitalId ? t("managerSet", { name: u.name }) : t("managerRevoked", { name: u.name }));
        setManagerFor(null);
        load(filter);
    };
    const hospitalName = (id) => hospitals.find((h) => h._id === id)?.name;

    const load = async (role) => {
        if (!session) return;
        setLoading(true);
        setError("");
        try {
            const { data: tokenData, error: tokenError } = await authClient.token();
            if (tokenError || !tokenData?.token) {
                setError(ta("tokenError", { reason: tokenError?.message || ta("noToken") }));
                setLoading(false);
                return;
            }
            const result = await getAllUsers(tokenData.token, role === "all" ? undefined : role);
            if (Array.isArray(result)) {
                setUsers(result);
            } else {
                setError(result?.message || ta("unexpected"));
                setUsers([]);
            }
        } catch {
            setError(ta("unreachable"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); load(filter); }, [session, filter]);

    const handleRepairSession = async () => {
        await hardSignOut(`/signin?callbackUrl=/dashboard/admin/users`);
    };

    const handleToggle = async (u) => {
        const { data: tokenData } = await authClient.token();
        const token = tokenData?.token;
        if (u.status === "suspended") {
            await reactivateUser(u._id, token);
            toast.success(t("reactivated", { name: u.name }));
        } else {
            await suspendUser(u._id, token);
            toast.success(t("suspendedToast", { name: u.name }));
        }
        setConfirmId(null);
        load(filter);
    };

    // 70+ accounts across 9 pages: without a search, finding the one person to
    // promote means paging through every doctor first.
    const needle = query.trim().toLowerCase();
    const visible = needle
        ? users.filter((u) => `${u.name || ""} ${u.email || ""}`.toLowerCase().includes(needle))
        : users;
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const paginated = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-6">
                {t("title1")} <span className="text-primary">{t("title2")}</span>
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div role="tablist" className="tabs tabs-boxed w-fit">
                    {ROLE_FILTERS.map((r) => (
                        <button
                            key={r}
                            role="tab"
                            onClick={() => setFilter(r)}
                            className={`tab capitalize ${filter === r ? "tab-active" : ""}`}
                        >
                            {roleName(r)}
                        </button>
                    ))}
                </div>
                <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder={t("search")}
                    aria-label={t("search")}
                    className="input input-bordered input-sm w-full sm:w-64"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary" />
                </div>
            ) : error ? (
                <div className="alert alert-primary/10 border border-primary/30 rounded-2xl flex-col items-start gap-3">
                    <p className="text-sm">
                        <span className="font-bold">{t("loadFailed")}</span> {error}
                    </p>
                    <button onClick={handleRepairSession} className="btn btn-sm btn-primary">
                        {ta("relogin")}
                    </button>
                </div>
            ) : visible.length === 0 ? (
                <div className="text-center py-16 text-base-content/50">{t("none")}</div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t("name")}</th>
                                    <th>{t("email")}</th>
                                    <th>{t("role")}</th>
                                    <th>{t("status")}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((u) => (
                                    <tr key={u._id}>
                                        <td className="font-medium">{u.name}</td>
                                        <td className="text-sm text-base-content/60">{u.email}</td>
                                        <td className="capitalize">
                                            {roleName(u.role || "patient")}
                                            {u.role === "hospital_admin" && u.hospitalId && (
                                                <span className="block text-[11px] normal-case text-base-content/50">{hospitalName(u.hospitalId)}</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-sm ${
                                                u.status === "active" ? "badge-success" :
                                                u.status === "suspended" ? "badge-error" : "badge-warning"
                                            }`}>
                                                {t.has(`statuses.${u.status}`) ? t(`statuses.${u.status}`) : u.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap">
                                            {["patient", "hospital_admin"].includes(u.role || "patient") && (
                                                <span className="inline-flex gap-1 mr-1">
                                                    <button onClick={() => setManagerFor(u)} className="btn btn-xs btn-ghost border-base-300">
                                                        {u.role === "hospital_admin" ? t("change") : t("make")}
                                                    </button>
                                                    {u.role === "hospital_admin" && (
                                                        <button onClick={() => assignManager(u, "")} className="btn btn-xs btn-ghost">{t("revoke")}</button>
                                                    )}
                                                </span>
                                            )}
                                            {u.role !== "admin" && (
                                                confirmId === u._id ? (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleToggle(u)}
                                                            className="btn btn-xs btn-primary"
                                                        >
                                                            {ta("confirm")}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmId(null)}
                                                            className="btn btn-xs btn-ghost"
                                                        >
                                                            {tc("cancel")}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmId(u._id)}
                                                        className={`btn btn-xs ${u.status === "suspended" ? "btn-success" : "btn-error btn-soft"}`}
                                                    >
                                                        {u.status === "suspended" ? t("reactivate") : t("suspend")}
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </>
            )}

            {managerFor && (
                <HospitalPicker
                    user={managerFor}
                    hospitals={hospitals}
                    onCancel={() => setManagerFor(null)}
                    onPick={(hospitalId) => assignManager(managerFor, hospitalId)}
                />
            )}
        </div>
    );
};

export default AdminUsersPage;
