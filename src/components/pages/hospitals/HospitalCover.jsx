import Image from "next/image";
import { cld } from "@/lib/cloudinary";

/**
 * The hospital's cover photo, or — when there's no freely usable photo — a
 * designed cover with its initials. Never a stock photo of some other building.
 * The parent sets the size; this fills it.
 */
const HospitalCover = ({ hospital, sizes = "(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw", priority = false, className = "" }) => {
    if (hospital.image) {
        return (
            <Image
                src={cld(hospital.image)}
                alt={hospital.name}
                fill
                sizes={sizes}
                priority={priority}
                className={`object-cover ${className}`}
            />
        );
    }

    const initials = (hospital.name || "?")
        .replace(/\(.*?\)/g, "")
        .split(/\s+/)
        .filter((w) => /^[A-Za-z]/.test(w))
        .slice(0, 3)
        .map((w) => w[0].toUpperCase())
        .join("");

    return (
        <div
            aria-hidden="true"
            className={`absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary/90 via-primary to-secondary/80 ${className}`}
        >
            <svg className="absolute inset-0 w-full h-full opacity-15" aria-hidden="true">
                <defs>
                    <pattern id="hospital-cross" width="44" height="44" patternUnits="userSpaceOnUse">
                        <path d="M18 10h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hospital-cross)" />
            </svg>
            <span className="relative text-4xl font-black tracking-wider text-white drop-shadow-sm">{initials}</span>
        </div>
    );
};

export default HospitalCover;
