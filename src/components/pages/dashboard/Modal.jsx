"use client";
import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useTranslations } from "next-intl";

/** Small accessible modal shell shared by the dashboard dialogs. */
const Modal = ({ title, subtitle, onClose, children, size = "max-w-md" }) => {
    const tc = useTranslations("common");
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`relative bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full ${size} z-10 max-h-[92vh] overflow-y-auto animate-fade-up`}
            >
                <div className="flex items-start justify-between p-6 pb-3">
                    <div>
                        <h3 className="font-black text-lg text-base-content">{title}</h3>
                        {subtitle && <p className="text-sm text-base-content/50 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle" aria-label={tc("close")}>
                        <FiX size={16} />
                    </button>
                </div>
                <div className="px-6 pb-6">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
