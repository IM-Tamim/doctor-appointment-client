"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getMyDoctorProfile, updateMyDoctorProfile } from "@/lib/doctors";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";
import toast from "react-hot-toast";

const DoctorProfilePage = () => {
    const { data: session } = authClient.useSession();
    const [form, setForm] = useState({
        bio: "", fee: "", image: "", specialty: "", hospital: "", experience: "", location: "",
    });
    const [readOnly, setReadOnly] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!session) return;
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            const doctor = await getMyDoctorProfile(token);
            if (doctor && !doctor.message) {
                setForm({
                    bio: doctor.bio || "",
                    fee: doctor.fee || "",
                    image: doctor.image || "",
                    specialty: doctor.specialty || "",
                    hospital: doctor.hospital || "",
                    experience: doctor.experience || "",
                    location: doctor.location || "",
                });
                setReadOnly({
                    name: doctor.name,
                    email: doctor.email,
                    degree: doctor.degree,
                    registrationNumber: doctor.registrationNumber,
                    rating: doctor.rating,
                    totalReviews: doctor.totalReviews,
                });
            }
            setLoading(false);
        };
        load();
    }, [session]);

    const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            await updateMyDoctorProfile({ ...form, fee: Number(form.fee) || 0 }, token);
            toast.success("Profile updated.");
        } catch {
            toast.error("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black mb-6">
                My <span className="text-primary">Profile</span>
            </h1>

            <div className="bg-base-100 rounded-2xl border border-base-300 p-6 mb-6">
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <p><span className="text-base-content/50">Name:</span> {readOnly.name}</p>
                    <p><span className="text-base-content/50">Email:</span> {readOnly.email}</p>
                    <p><span className="text-base-content/50">Degree:</span> {readOnly.degree}</p>
                    <p><span className="text-base-content/50">Reg. No:</span> {readOnly.registrationNumber}</p>
                    <p><span className="text-base-content/50">Rating:</span> {readOnly.rating || 0} ({readOnly.totalReviews || 0} reviews)</p>
                </div>
                <p className="text-xs text-base-content/40 mt-3">
                    These verified fields can&apos;t be self-edited — contact an admin for changes.
                </p>
            </div>

            <form onSubmit={handleSave} className="bg-base-100 rounded-2xl border border-base-300 p-6 space-y-4">
                <div>
                    <label className="label font-medium">Specialty</label>
                    <input name="specialty" value={form.specialty} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div>
                    <label className="label font-medium">Hospital / Clinic</label>
                    <input name="hospital" value={form.hospital} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label font-medium">Years of Experience</label>
                        <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 8 years" className="input input-bordered w-full" />
                    </div>
                    <div>
                        <label className="label font-medium">Location</label>
                        <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Rajshahi, Bangladesh" className="input input-bordered w-full" />
                    </div>
                </div>
                <div>
                    <label className="label font-medium">Consultation Fee (BDT)</label>
                    <input type="number" name="fee" value={form.fee} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <CloudinaryUpload
                    label="Profile Photo"
                    value={form.image}
                    onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
                    accept="image/*"
                />
                <div>
                    <label className="label font-medium">Bio</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} className="textarea textarea-bordered w-full" />
                </div>
                <button type="submit" disabled={saving} className="btn btn-primary w-full">
                    {saving ? <span className="loading loading-spinner loading-sm" /> : "Save Changes"}
                </button>
            </form>
        </div>
    );
};

export default DoctorProfilePage;
