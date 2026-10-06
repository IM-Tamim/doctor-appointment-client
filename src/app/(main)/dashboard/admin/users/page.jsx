"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { hardSignOut } from "@/lib/hardSignOut";
import { getAllUsers, suspendUser, reactivateUser } from "@/lib/admin";
import Pagination from "@/components/shared/Pagination";
import { fetchHospitalOptions } from "@/lib/hospitals";
import { setHospitalManager } from "@/lib/emergency";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

const ROLE_FILTERS = ["all", "patient", "doctor", "hospital_admin", "admin"];
const PAGE_SIZE = 8;

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
    const [managerFor, setManagerFor] = useState(null); // user being assigned

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

    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-6">
                {t("title1")} <span className="text-primary">{t("title2")}</span>
            </h1>

            <div role="tablist" className="tabs tabs-boxed w-fit mb-6">
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
            ) : users.length === 0 ? (
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
                                                managerFor === u._id ? (
                                                    <select
                                                        autoFocus
                                                        defaultValue=""
                                                        onChange={(e) => assignManager(u, e.target.value)}
                                                        onBlur={() => setManagerFor(null)}
                                                        className="select select-bordered select-xs mr-1 max-w-48"
                                                        aria-label={t("pickHospital")}
                                                    >
                                                        <option value="" disabled>{t("which")}</option>
                                                        {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className="inline-flex gap-1 mr-1">
                                                        <button onClick={() => setManagerFor(u._id)} className="btn btn-xs btn-ghost border-base-300">
                                                            {u.role === "hospital_admin" ? t("change") : t("make")}
                                                        </button>
                                                        {u.role === "hospital_admin" && (
                                                            <button onClick={() => assignManager(u, "")} className="btn btn-xs btn-ghost">{t("revoke")}</button>
                                                        )}
                                                    </span>
                                                )
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
        </div>
    );
};

export default AdminUsersPage;
