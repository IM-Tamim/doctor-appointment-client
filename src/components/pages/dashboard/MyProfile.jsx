"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";
import Image from "next/image";
import { FiUser, FiMail, FiEdit2 } from "react-icons/fi";
import { FiX } from "react-icons/fi";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";

const MyProfile = () => {
    const { data: session, isPending } = authClient.useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const user = session?.user;

    const inputClass =
        "w-full px-4 py-3 rounded-xl text-sm bg-base-200 border border-base-300 text-base-content outline-none focus:border-primary transition-all";

    const openModal = () => {
        setImageUrl(user?.image || "");
        setIsOpen(true);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await authClient.updateUser({
                name: data.name,
                image: imageUrl || user?.image,
            });
            toast.success("Profile updated successfully!");
            setIsOpen(false);
        } catch {
            toast.error("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    if (isPending) {
        return (
            <div className="flex justify-center py-24">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-md mx-auto">
                <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">

                    <div className="h-24 bg-primary/10 border-b border-base-300" />
                    <div className="px-6 pb-6">
                        <div className="relative flex items-end justify-between -mt-10 mb-4">
                            <div className="relative w-20 h-20 rounded-2xl border-4 border-base-100 overflow-hidden bg-base-200">
                                {user?.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FiUser size={28} className="text-base-content/30" />
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-7 right-3">
                                <div className="badge badge-success badge-sm">Active</div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3">
                            <div className="flex items-center gap-3 bg-base-200 border border-base-300 rounded-xl px-4 py-3">
                                <FiUser size={15} className="text-primary shrink-0" />
                                <div>
                                    <p className="text-xs text-base-content/40">Full Name</p>
                                    <p className="text-sm font-semibold text-base-content">{user?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-base-200 border border-base-300 rounded-xl px-4 py-3">
                                <FiMail size={15} className="text-primary shrink-0" />
                                <div>
                                    <p className="text-xs text-base-content/40">Email Address</p>
                                    <p className="text-sm font-semibold text-base-content">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={openModal}
                            className="btn btn-primary btn-outline w-full rounded-xl font-bold mt-5 flex items-center gap-2"
                        >
                            <FiEdit2 size={14} /> Update Profile
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    <div className="relative bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-md z-10">

                        <div className="flex items-start justify-between p-6 pb-4">
                            <div>
                                <h3 className="font-black text-xl text-base-content">Update Profile</h3>
                                <p className="text-sm text-base-content/50 mt-0.5">Edit your account details</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="btn btn-sm btn-ghost btn-circle mt-1">
                                <FiX size={16} />
                            </button>
                        </div>

                        <form onSubmit={onSubmit} className="px-6 pb-6 flex flex-col gap-4">

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-base-content">
                                    Name <span className="text-primary">*</span>
                                </label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                                    <input
                                        name="name"
                                        type="text"
                                        defaultValue={user?.name}
                                        className={`${inputClass} pl-10`}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-base-content">
                                    Profile Picture
                                </label>
                                <CloudinaryUpload
                                    value={imageUrl}
                                    onChange={setImageUrl}
                                    accept="image/*"
                                    label=""
                                />
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="btn btn-warning btn-outline flex-1 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary flex-1 rounded-xl font-bold disabled:opacity-60"
                                >
                                    {loading
                                        ? <span className="loading loading-spinner loading-xs" />
                                        : "Save Changes"
                                    }
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyProfile;