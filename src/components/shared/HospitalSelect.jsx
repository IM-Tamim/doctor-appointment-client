"use client";
import { useEffect, useState } from "react";
import { fetchHospitalOptions } from "@/lib/hospitals";
import { useTranslations } from "next-intl";

/**
 * Hospital picker for doctor forms. An empty value means an independent /
 * online-only practice (stored as hospitalId: null on the server).
 */
const HospitalSelect = ({ value, onChange, name = "hospitalId", className = "select select-bordered w-full" }) => {
    const t = useTranslations("hospitalSelect");
    const [hospitals, setHospitals] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchHospitalOptions().then((list) => {
            if (!cancelled) setHospitals(list);
        });
        return () => { cancelled = true; };
    }, []);

    return (
        <select
            name={name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={className}
            disabled={hospitals === null}
        >
            <option value="">
                {hospitals === null ? t("loading") : t("none")}
            </option>
            {(hospitals || []).map((h) => (
                <option key={h._id} value={h._id}>
                    {h.name}{h.city ? ` — ${h.city}` : ""}
                </option>
            ))}
        </select>
    );
};

export default HospitalSelect;
