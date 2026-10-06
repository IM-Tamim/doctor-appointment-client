"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { FiMessageCircle, FiX } from "react-icons/fi";
import { useTranslations } from "next-intl";

// The chat panel (and its speech code) is only downloaded once someone opens it.
const AssistantPanel = dynamic(() => import("./AssistantPanel"), { ssr: false });

const AssistantLauncher = () => {
    const t = useTranslations("assistant");
    const [open, setOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const toggle = () => {
        setLoaded(true);
        setOpen((o) => !o);
    };

    return (
        <>
            {loaded && open && <AssistantPanel onClose={() => setOpen(false)} />}
            <button
                onClick={toggle}
                onMouseEnter={() => setLoaded(true)} // warm the chunk on hover
                aria-expanded={open}
                aria-label={open ? t("closeLauncher") : t("open")}
                className="fixed z-50 bottom-4 right-4 sm:right-5 btn btn-primary btn-circle btn-lg shadow-xl shadow-primary/30 safe-bottom"
            >
                {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
            </button>
        </>
    );
};

export default AssistantLauncher;
