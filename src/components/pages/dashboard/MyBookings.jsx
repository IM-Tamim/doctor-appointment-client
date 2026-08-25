"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getMyAppointments } from "@/lib/doctors";
import { FiCalendar, FiClock, FiPhone, FiUser, FiTrash2, FiEdit2, FiFileText } from "react-icons/fi";
import { MdOutlineLocalHospital } from "react-icons/md";
import toast from "react-hot-toast";
import UpdateModal from "./UpdateModal";
import DeleteModal from "./DeleteModal";
import Pagination from "@/components/shared/Pagination";

const PAGE_SIZE = 6;

const STATUS_BADGE = {
    pending: "badge-warning",
    confirmed: "badge-info",
    completed: "badge-success",
    cancelled: "badge-error",
};

const MyBookings = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);
    const [page, setPage] = useState(1);
    const { data: session } = authClient.useSession();

    const email = session?.user?.email;

    useEffect(() => {
        if (!email) return;

        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const { data: tokenData } = await authClient.token();
                const data = await getMyAppointments(tokenData?.token);
                setAppointments(Array.isArray(data) ? data : []);
            } catch {
                toast.error("Failed to load appointments.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [email]);

    const handleDeleteSuccess = (id) => {
        setAppointments((prev) => prev.filter((a) => a._id !== id));
        setAppointmentToDelete(null);
    };

    const handleUpdateSuccess = (updated) => {
        setAppointments((prev) =>
            prev.map((a) => (a._id === updated._id ? updated : a))
        );
        setSelectedAppointment(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="text-sm text-base-content/50">Loading your appointments...</p>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
                    <FiCalendar size={24} className="text-base-content/30" />
                </div>
                <p className="text-base font-semibold text-base-content/60">No appointments yet</p>
                <p className="text-sm text-base-content/40">Book your first appointment to get started.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {appointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((appt) => (
                    <div
                        key={appt._id}
                        className="bg-base-100 border border-base-300 rounded-2xl p-5 flex flex-col gap-3"
                    >
                        {/* Doctor */}
                        <div className="flex items-center gap-2 pb-3 border-b border-base-300">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <MdOutlineLocalHospital size={16} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-base-content truncate">{appt.doctorName}</p>
                                <p className="text-xs text-base-content/40">Doctor</p>
                            </div>
                            <span className={`badge badge-sm ${STATUS_BADGE[appt.status] || "badge-ghost"} capitalize shrink-0`}>
                                {appt.status || "pending"}
                            </span>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-2">
                            <p className="text-xs text-base-content/60 flex items-center gap-2">
                                <FiUser size={12} className="text-primary shrink-0" />
                                {appt.patientName} · {appt.gender}
                            </p>
                            <p className="text-xs text-base-content/60 flex items-center gap-2">
                                <FiPhone size={12} className="text-primary shrink-0" />
                                {appt.phone}
                            </p>
                            <p className="text-xs text-base-content/60 flex items-center gap-2">
                                <FiCalendar size={12} className="text-primary shrink-0" />
                                {appt.appointmentDate}
                            </p>
                            <p className="text-xs text-base-content/60 flex items-center gap-2">
                                <FiClock size={12} className="text-primary shrink-0" />
                                {appt.appointmentTime}
                            </p>
                            {appt.reason && (
                                <p className="text-xs text-base-content/50 italic mt-1">
                                    &ldquo;{appt.reason}&rdquo;
                                </p>
                            )}
                        </div>

                        {/* Prescription (once doctor has added one) */}
                        {appt.prescription && (appt.prescription.notes || appt.prescription.fileUrl) && (
                            <div className="bg-base-200 rounded-xl p-3 text-xs flex flex-col gap-1">
                                <p className="font-semibold flex items-center gap-1 text-base-content/70">
                                    <FiFileText size={12} /> Prescription
                                </p>
                                {appt.prescription.notes && (
                                    <p className="text-base-content/60">{appt.prescription.notes}</p>
                                )}
                                {appt.prescription.fileUrl && (
                                    <a
                                        href={appt.prescription.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="link link-primary"
                                    >
                                        View attached file →
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Actions — locked once the doctor has confirmed/completed/cancelled it */}
                        {appt.status && appt.status !== "pending" ? (
                            <p className="text-xs text-base-content/40 mt-auto pt-3 border-t border-base-300 text-center">
                                This appointment is {appt.status} and can no longer be edited.
                            </p>
                        ) : (
                            <div className="flex gap-2 mt-auto pt-3 border-t border-base-300">
                                <button
                                    onClick={() => setSelectedAppointment(appt)}
                                    className="btn btn-sm btn-primary btn-outline flex-1 rounded-xl flex items-center gap-1"
                                >
                                    <FiEdit2 size={13} /> Update
                                </button>
                                <button
                                    onClick={() => setAppointmentToDelete(appt)}
                                    className="btn btn-sm btn-error btn-outline flex-1 rounded-xl flex items-center gap-1"
                                >
                                    <FiTrash2 size={13} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(appointments.length / PAGE_SIZE))}
                onChange={setPage}
            />

            {/* Update Modal */}
            {selectedAppointment && (
                <UpdateModal
                    appointment={selectedAppointment}
                    onSuccess={handleUpdateSuccess}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}

            {/* Delete Modal */}
            {appointmentToDelete && (
                <DeleteModal
                    appointment={appointmentToDelete}
                    onSuccess={handleDeleteSuccess}
                    onClose={() => setAppointmentToDelete(null)}
                />
            )}
        </>
    );
};

export default MyBookings;