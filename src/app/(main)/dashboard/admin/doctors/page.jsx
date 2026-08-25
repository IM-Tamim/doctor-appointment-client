"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { hardSignOut } from "@/lib/hardSignOut";
import { getPendingDoctors, approveDoctor, rejectDoctor } from "@/lib/admin";
import toast from "react-hot-toast";
import { FaCheck, FaTimes } from "react-icons/fa";

const AdminDoctorsPage = () => {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [pending, setPending] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [reason, setReason] = useState("");

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
            const result = await getPendingDoctors(tokenData.token);
            if (Array.isArray(result)) {
                setPending(result);
            } else {
                setError(result?.message || "Unexpected response from server.");
                setPending([]);
            }
        } catch {
            setError("Couldn't reach the server. Is it running?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [session]);

    const handleRepairSession = async () => {
        await hardSignOut(`/signin?callbackUrl=/dashboard/admin/doctors`);
    };

    const handleApprove = async (id) => {
        setBusyId(id);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            await approveDoctor(id, token);
            toast.success("Doctor approved.");
            setPending((prev) => prev.filter((d) => d._id !== id));
        } catch {
            toast.error("Failed to approve.");
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (id) => {
        setBusyId(id);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            await rejectDoctor(id, reason, token);
            toast.success("Application rejected.");
            setPending((prev) => prev.filter((d) => d._id !== id));
            setRejectingId(null);
            setReason("");
        } catch {
            toast.error("Failed to reject.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-8">
                Doctor <span className="text-primary">Approvals</span>
            </h1>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary" />
                </div>
            ) : error ? (
                <div className="alert alert-primary/10 border border-primary/30 rounded-2xl flex-col items-start gap-3">
                    <p className="text-sm">
                        <span className="font-bold">Couldn&apos;t load applications:</span> {error}
                    </p>
                    <button onClick={handleRepairSession} className="btn btn-sm btn-primary">
                        Log out & sign in again
                    </button>
                </div>
            ) : pending.length === 0 ? (
                <div className="text-center py-16 text-base-content/50">
                    No pending applications right now.
                </div>
            ) : (
                <div className="space-y-4">
                    {pending.map((d) => (
                        <div key={d._id} className="bg-base-100 rounded-2xl border border-base-300 p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-lg">{d.name}</h3>
                                    <p className="text-sm text-base-content/60">{d.email}</p>
                                    <p className="text-sm text-base-content/60">{d.phone || "No phone provided"}</p>
                                    <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        <p><span className="text-base-content/50">Specialty:</span> {d.specialty}</p>
                                        <p><span className="text-base-content/50">Degree:</span> {d.degree}</p>
                                        <p><span className="text-base-content/50">Reg. No:</span> {d.registrationNumber}</p>
                                        <p><span className="text-base-content/50">Hospital:</span> {d.hospital}</p>
                                        <p><span className="text-base-content/50">Experience:</span> {d.experience || "Not specified"}</p>
                                        <p><span className="text-base-content/50">Location:</span> {d.location || "Not specified"}</p>
                                        <p><span className="text-base-content/50">Fee:</span> {d.fee} BDT</p>
                                        <p><span className="text-base-content/50">Applied:</span> {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}</p>
                                    </div>
                                    {d.bio && <p className="text-sm mt-3 text-base-content/70">{d.bio}</p>}
                                    {d.credentialImageUrl && (
                                        <a
                                            href={d.credentialImageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="link link-primary text-sm mt-2 inline-block"
                                        >
                                            View credential document →
                                        </a>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleApprove(d._id)}
                                        disabled={busyId === d._id}
                                        className="btn btn-sm btn-success text-success-content"
                                    >
                                        <FaCheck size={12} /> Approve
                                    </button>
                                    <button
                                        onClick={() => setRejectingId(d._id)}
                                        disabled={busyId === d._id}
                                        className="btn btn-sm btn-error btn-soft"
                                    >
                                        <FaTimes size={12} /> Reject
                                    </button>
                                </div>
                            </div>

                            {rejectingId === d._id && (
                                <div className="mt-4 pt-4 border-t border-base-300 flex gap-2">
                                    <input
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Reason for rejection (optional)"
                                        className="input input-bordered input-sm flex-1"
                                    />
                                    <button
                                        onClick={() => handleReject(d._id)}
                                        disabled={busyId === d._id}
                                        className="btn btn-sm btn-primary"
                                    >
                                        Confirm Reject
                                    </button>
                                    <button
                                        onClick={() => { setRejectingId(null); setReason(""); }}
                                        className="btn btn-sm btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDoctorsPage;
