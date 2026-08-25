/**
 * DocAppoint mark — inline SVG rather than the old PNG.
 *
 * Three reasons: it scales without blurring on hi-dpi screens, it costs zero
 * network requests (the PNG was 37 KB fetched on every page), and it inherits
 * the theme's own colors, so it stays correct in both light and dark mode.
 */
const Logo = ({ size = 40, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="DocAppoint"
    >
        <defs>
            <linearGradient id="da-logo-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="var(--color-primary)" />
                <stop offset="1" stopColor="var(--color-secondary)" />
            </linearGradient>
        </defs>

        {/* Rounded tile */}
        <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#da-logo-bg)" />

        {/* Binder pegs */}
        <rect x="21" y="12" width="5" height="10" rx="2.5" fill="white" opacity="0.92" />
        <rect x="38" y="12" width="5" height="10" rx="2.5" fill="white" opacity="0.92" />

        {/* Calendar face */}
        <rect x="14" y="19" width="36" height="30" rx="5" fill="white" />
        <rect x="14" y="19" width="36" height="7" rx="5" fill="white" opacity="0.75" />

        {/* Confirmation check */}
        <path
            d="M22 35.5 L28.5 42 L42 28.5"
            stroke="var(--color-primary)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </svg>
);

export default Logo;
