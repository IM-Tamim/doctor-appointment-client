import Image from "next/image";
import logoMark from "@/assets/logo-mark.png";
import logoFull from "@/assets/logo-full.png";

/**
 * DocAppoint logo, generated from src/assets/logo.png.
 *
 * - `Logo` is the emblem alone (no wordmark) on a white rounded tile — used at
 *   small sizes next to the "DocAppoint" text, where the wordmark would be
 *   unreadable. The white tile keeps the black/teal artwork legible in dark mode.
 * - `LogoFull` is the complete logo with the wordmark, for larger placements.
 *
 * Static imports let next/image serve a correctly sized, optimised file.
 */
const Logo = ({ size = 40, className = "", priority = false }) => (
    <Image
        src={logoMark}
        alt="DocAppoint"
        width={size}
        height={size}
        priority={priority}
        className={`rounded-[22%] bg-white ring-1 ring-base-content/10 object-contain ${className}`}
    />
);

export const LogoFull = ({ size = 128, className = "", priority = false }) => (
    <Image
        src={logoFull}
        alt="DocAppoint"
        width={size}
        height={size}
        priority={priority}
        className={`rounded-3xl bg-white ring-1 ring-base-content/10 object-contain ${className}`}
    />
);

export default Logo;
