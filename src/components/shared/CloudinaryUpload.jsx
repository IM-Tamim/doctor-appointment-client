"use client";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiUpload, FiCheck, FiX } from "react-icons/fi";
import { useTranslations } from "next-intl";

/**
 * Uploads a file directly to Cloudinary using an unsigned upload preset
 * (free tier, no backend signing needed). Requires:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const CloudinaryUpload = ({ value, onChange, label, accept = "image/*,.pdf" }) => {
    const t = useTranslations("upload");
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;

        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            toast.error(t("notConfigured"));
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
                toast.success(t("done"));
            } else {
                toast.error(data.error?.message || t("failed"));
            }
        } catch {
            toast.error(t("network"));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            {label !== "" && <label className="label font-medium">{label ?? t("label")}</label>}

            {value ? (
                <div className="flex items-center gap-2 mb-2">
                    <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="link link-primary text-sm flex items-center gap-1 truncate"
                    >
                        <FiCheck size={14} /> {t("view")}
                    </a>
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="btn btn-xs btn-ghost btn-circle"
                        aria-label={t("remove")}
                    >
                        <FiX size={12} />
                    </button>
                </div>
            ) : null}

            {/* Wraps on narrow screens: side by side the paste field drops to
                ~150px inside a phone-width form card, which truncates both the
                placeholder and any URL already in it. */}
            <div className="flex flex-wrap gap-2">
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
                    {value ? t("replace") : t("choose")}
                </button>
                <input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={t("paste")}
                    className="input input-bordered input-sm flex-1 min-w-48"
                />
            </div>
        </div>
    );
};

export default CloudinaryUpload;
