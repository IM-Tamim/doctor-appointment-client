import Image from "next/image";
import { cld } from "@/lib/cloudinary";

const SIZES = {
    md: { box: "w-14 h-14 text-base", px: 56 },
    lg: { box: "w-20 h-20 text-xl", px: 80 },
};

/** Logo if the admin uploaded one, otherwise the hospital's initials. */
const HospitalLogo = ({ hospital, size = "md" }) => {
    const { box, px } = SIZES[size] || SIZES.md;
    const initials = (hospital.name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

    return (
        <div className={`relative ${box} rounded-xl overflow-hidden shrink-0 bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center`}>
            {hospital.logo ? (
                <Image src={cld(hospital.logo)} alt={`${hospital.name} logo`} fill sizes={`${px}px`} className="object-cover" />
            ) : (
                <span className="font-black text-primary">{initials}</span>
            )}
        </div>
    );
};

export default HospitalLogo;
