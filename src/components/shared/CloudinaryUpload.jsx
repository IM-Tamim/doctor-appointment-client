"use client";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiUpload, FiCheck, FiX } from "react-icons/fi";

/**
 * Uploads a file directly to Cloudinary using an unsigned upload preset
 * (free tier, no backend signing needed). Requires:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const CloudinaryUpload = ({ value, onChange, label = "Upload file", accept = "image/*,.pdf" }) => {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;

        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            toast.error("File upload isn't configured yet — paste a link instead, or ask the admin to set up Cloudinary.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
                { method: "POST", body: formData }
            );
            const data = await res.json();

            if (data.secure_url) {
                onChange(data.secure_url);
                toast.success("File uploaded.");
            } else {
                toast.error(data.error?.message || "Upload failed.");
            }
        } catch {
            toast.error("Upload failed. Check your connection and try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label className="label font-medium">{label}</label>

            {value ? (
                <div className="flex items-center gap-2 mb-2">
                    <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="link link-primary text-sm flex items-center gap-1 truncate"
                    >
                        <FiCheck size={14} /> View uploaded file
                    </a>
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="btn btn-xs btn-ghost btn-circle"
                    >
                        <FiX size={12} />
                    </button>
                </div>
            ) : null}

            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="btn btn-sm btn-outline gap-2"
                >
                    {uploading ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : (
                        <FiUpload size={14} />
                    )}
                    {value ? "Replace file" : "Choose file"}
                </button>
                <input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="or paste a link directly"
                    className="input input-bordered input-sm flex-1"
                />
            </div>
        </div>
    );
};

export default CloudinaryUpload;
