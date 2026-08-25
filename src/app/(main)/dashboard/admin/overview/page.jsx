"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getAdminStats } from "@/lib/admin";
import { useRouter } from "next/navigation";
import { hardSignOut } from "@/lib/hardSignOut";
import { FaUserInjured, FaUserMd, FaHourglassHalf, FaCalendarCheck } from "react-icons/fa";

const CARDS = [
    { key: "totalPatients", label: "Total Patients", icon: FaUserInjured, color: "text-info" },
    { key: "totalDoctors", label: "Approved Doctors", icon: FaUserMd, color: "text-success" },
    { key: "pendingDoctors", label: "Pending Applications", icon: FaHourglassHalf, color: "text-warning" },
    { key: "totalAppointments", label: "Total Appointments", icon: FaCalendarCheck, color: "text-primary" },
];

const AdminOverviewPage = () => {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const handleRepairSession = async () => {
        await hardSignOut(`/signin?callbackUrl=/dashboard/admin/overview`);
    };

    useEffect(() => {
        const load = async () => {
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
                const result = await getAdminStats(tokenData.token);
                if (result?.message) {
                    // Server rejected the request (e.g. stale role in the token) —
                    // surface it instead of silently showing zeros everywhere.
                    setError(result.message);
                    setStats(null);
                } else {
                    setStats(result);
                }
            } catch {
                setError("Couldn't reach the server. Is it running?");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session]);

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-8">
                Platform <span className="text-primary">Overview</span>
            </h1>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary" />
                </div>
            ) : error ? (
                <div className="alert alert-primary/10 border border-primary/30 rounded-2xl flex-col items-start gap-3">
                    <p className="text-sm">
                        <span className="font-bold">Could not load stats:</span> {error}
                    </p>
                    <button onClick={handleRepairSession} className="btn btn-sm btn-primary">
                        Log out & sign in again
                    </button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                    {CARDS.map(({ key, label, icon: Icon, color }) => (
                        <div key={key} className="bg-base-100 rounded-2xl border border-base-300 p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full bg-base-200 flex items-center justify-center ${color}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stats?.[key] ?? 0}</p>
                                <p className="text-sm text-base-content/60">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminOverviewPage;
