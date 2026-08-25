"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { hardSignOut } from "@/lib/hardSignOut";
import { getAllUsers, suspendUser, reactivateUser } from "@/lib/admin";
import Pagination from "@/components/shared/Pagination";
import toast from "react-hot-toast";

const ROLE_FILTERS = ["all", "patient", "doctor", "admin"];
const PAGE_SIZE = 8;

const AdminUsersPage = () => {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirmId, setConfirmId] = useState(null);
    const [page, setPage] = useState(1);

    const load = async (role) => {
        if (!session) return;
        setLoading(true);
        setError("");
        try {
            const { data: tokenData, error: tokenError } = await authClient.token();
            if (tokenError || !tokenData?.token) {
                setError(
                    `Couldn't get an auth token from Better Auth: ${tokenError?.message || "no token was returned"}. ` +
                    `This happens before the role check even runs — check that the JWT plugin is configured correctly and CLIENT_URL/BETTER_AUTH_URL match your running dev server.`
                );
                setLoading(false);
                return;
            }
            const result = await getAllUsers(tokenData.token, role === "all" ? undefined : role);
            if (Array.isArray(result)) {
                setUsers(result);
            } else {
                setError(result?.message || "Unexpected response from server.");
                setUsers([]);
            }
        } catch {
            setError("Couldn't reach the server. Is it running?");
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
            toast.success(`${u.name} reactivated.`);
        } else {
            await suspendUser(u._id, token);
            toast.success(`${u.name} suspended.`);
        }
        setConfirmId(null);
        load(filter);
    };

    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-6">
                Manage <span className="text-primary">Users</span>
            </h1>

            <div role="tablist" className="tabs tabs-boxed w-fit mb-6">
                {ROLE_FILTERS.map((r) => (
                    <button
                        key={r}
                        role="tab"
                        onClick={() => setFilter(r)}
                        className={`tab capitalize ${filter === r ? "tab-active" : ""}`}
                    >
                        {r}
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
                        <span className="font-bold">Couldn&apos;t load users:</span> {error}
                    </p>
                    <button onClick={handleRepairSession} className="btn btn-sm btn-primary">
                        Log out & sign in again
                    </button>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-16 text-base-content/50">No users found.</div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((u) => (
                                    <tr key={u._id}>
                                        <td className="font-medium">{u.name}</td>
                                        <td className="text-sm text-base-content/60">{u.email}</td>
                                        <td className="capitalize">{u.role}</td>
                                        <td>
                                            <span className={`badge badge-sm ${
                                                u.status === "active" ? "badge-success" :
                                                u.status === "suspended" ? "badge-error" : "badge-warning"
                                            }`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td>
                                            {u.role !== "admin" && (
                                                confirmId === u._id ? (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleToggle(u)}
                                                            className="btn btn-xs btn-primary"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmId(null)}
                                                            className="btn btn-xs btn-ghost"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmId(u._id)}
                                                        className={`btn btn-xs ${u.status === "suspended" ? "btn-success" : "btn-error btn-soft"}`}
                                                    >
                                                        {u.status === "suspended" ? "Reactivate" : "Suspend"}
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
