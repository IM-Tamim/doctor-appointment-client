"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { applyAsDoctor, getMyDoctorApplication } from "@/lib/doctors";
import toast from "react-hot-toast";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

const SPECIALTIES = [
    "Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics",
    "Gynecology", "General Medicine", "Dentistry", "Psychiatry", "ENT",
];

const BecomeDoctorPage = () => {
    const { data: session } = authClient.useSession();
    const [application, setApplication] = useState(undefined); // undefined = loading, null = none yet
    const [reapplyMode, setReapplyMode] = useState(false);
    const [form, setForm] = useState({
        specialty: "", degree: "", registrationNumber: "", hospital: "", phone: "",
        experience: "", location: "",
        bio: "", fee: "", credentialImageUrl: "", image: "",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!session) return;
            const { data: tokenData } = await authClient.token();
            const result = await getMyDoctorApplication(tokenData?.token);
            setApplication(result);
        };
        load();
    }, [session]);

    const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.specialty || !form.degree || !form.registrationNumber || !form.hospital || !form.phone) {
            toast.error("Please fill all required fields.");
            return;
        }
        if (!form.credentialImageUrl) {
            toast.error("A credential document is required so an admin can verify you.");
            return;
        }

        setSubmitting(true);
        try {
            const { data: tokenData } = await authClient.token();
            const result = await applyAsDoctor({ ...form, fee: Number(form.fee) || 0 }, tokenData?.token);
            if (result?.message && !result?.insertedId) {
                toast.error(result.message);
            } else {
                toast.success("Application submitted! An admin will review it shortly.");
                setReapplyMode(false);
                setApplication({ approvalStatus: "pending", specialty: form.specialty });
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (application === undefined) {
        return (
            <div className="flex justify-center py-24">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    // Already applied — show status instead of the form (unless resubmitting
    // after a rejection, in which case reapplyMode drops through to the form)
    if (application && !reapplyMode) {
        const statusMap = {
            pending: {
                icon: FiClock,
                color: "text-warning",
                bg: "bg-warning/10",
                title: "Application Pending",
                text: "Your application is under review. You'll be notified once an admin makes a decision.",
            },
            approved: {
                icon: FiCheckCircle,
                color: "text-success",
                bg: "bg-success/10",
                title: "Application Approved",
                text: "You're now a doctor on DocAppoint! Head to your doctor dashboard to get started.",
            },
            rejected: {
                icon: FiXCircle,
                color: "text-primary",
                bg: "bg-primary/10",
                title: "Application Rejected",
                text: application.rejectionReason || "Your application wasn't approved this time.",
            },
        };
        const s = statusMap[application.approvalStatus] || statusMap.pending;
        const Icon = s.icon;

        return (
            <div className="p-6 lg:p-8 max-w-xl mx-auto">
                <div className={`rounded-2xl border border-base-300 p-8 text-center ${s.bg}`}>
                    <Icon className={`mx-auto mb-4 ${s.color}`} size={40} />
                    <h2 className="font-black text-xl mb-2">{s.title}</h2>
                    <p className="text-sm text-base-content/60">{s.text}</p>
                    {application.specialty && (
                        <p className="text-xs text-base-content/40 mt-3">Specialty applied for: {application.specialty}</p>
                    )}
                    {application.approvalStatus === "rejected" && (
                        <button
                            onClick={() => setReapplyMode(true)}
                            className="btn btn-primary btn-sm mt-5"
                        >
                            Apply Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // No application yet — show the form
    return (
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
            <div className="bg-base-100 rounded-2xl shadow-lg border border-base-300 p-6 md:p-8">
                <h1 className="text-2xl font-black mb-1">
                    Apply as a <span className="text-primary">Doctor</span>
                </h1>
                <p className="text-sm text-base-content/60 mb-6">
                    Submit your credentials below. An admin will verify and approve your
                    application before your profile goes live to patients.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label font-medium">Specialty *</label>
                        <select
                            name="specialty"
                            value={form.specialty}
                            onChange={handleChange}
                            className="select select-bordered w-full"
                            required
                        >
                            <option value="">Select specialty</option>
                            {SPECIALTIES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label font-medium">Degree *</label>
                            <input
                                name="degree"
                                value={form.degree}
                                onChange={handleChange}
                                placeholder="e.g. MBBS, FCPS"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="label font-medium">Registration Number *</label>
                            <input
                                name="registrationNumber"
                                value={form.registrationNumber}
                                onChange={handleChange}
                                placeholder="BMDC Reg. No."
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label font-medium">Hospital / Clinic *</label>
                            <input
                                name="hospital"
                                value={form.hospital}
                                onChange={handleChange}
                                placeholder="e.g. Rajshahi Medical College Hospital"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="label font-medium">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="e.g. 01712345678"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label font-medium">Years of Experience</label>
                            <input
                                name="experience"
                                value={form.experience}
                                onChange={handleChange}
                                placeholder="e.g. 8 years"
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div>
                            <label className="label font-medium">Location</label>
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="e.g. Rajshahi, Bangladesh"
                                className="input input-bordered w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label font-medium">Consultation Fee (BDT)</label>
                        <input
                            type="number"
                            name="fee"
                            value={form.fee}
                            onChange={handleChange}
                            placeholder="500"
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div>
                        <label className="label font-medium">Short Bio</label>
                        <textarea
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            placeholder="A short professional summary patients will see."
                            className="textarea textarea-bordered w-full"
                            rows={3}
                        />
                    </div>

                    <CloudinaryUpload
                        label="Profile Picture"
                        value={form.image}
                        onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
                        accept="image/*"
                    />

                    <CloudinaryUpload
                        label="Credential Document *"
                        value={form.credentialImageUrl}
                        onChange={(url) => setForm((prev) => ({ ...prev, credentialImageUrl: url }))}
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary w-full mt-2"
                    >
                        {submitting ? <span className="loading loading-spinner loading-sm" /> : "Submit Application"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BecomeDoctorPage;
