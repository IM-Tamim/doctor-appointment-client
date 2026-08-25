"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { applyAsDoctor } from "@/lib/doctors";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";

const SPECIALTIES = [
    "Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics",
    "Gynecology", "General Medicine", "Dentistry", "Psychiatry", "ENT",
];

const ApplyDoctorPage = () => {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [form, setForm] = useState({
        specialty: "",
        degree: "",
        registrationNumber: "",
        hospital: "",
        bio: "",
        fee: "",
        credentialImageUrl: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.specialty || !form.degree || !form.registrationNumber || !form.hospital) {
            toast.error("Please fill all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            const result = await applyAsDoctor(
                { ...form, fee: Number(form.fee) || 0 },
                token
            );
            if (result?.message) {
                toast.error(result.message);
            } else {
                toast.success("Application submitted! An admin will review it shortly.");
                router.push("/dashboard/patient");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 py-10">
            <div className="container mx-auto px-4 max-w-2xl">
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
                            label="Credential Document (optional)"
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
        </div>
    );
};

export default ApplyDoctorPage;
