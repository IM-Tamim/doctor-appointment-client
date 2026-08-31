"use client";
import { useSyncExternalStore } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

const LIGHT = "docappoint";
const DARK = "docappoint-dark";

// The <html data-theme> attribute is the source of truth — layout.js sets it
// from localStorage before first paint.
const readTheme = () =>
    typeof document === "undefined"
        ? false
        : document.documentElement.getAttribute("data-theme") === DARK;

const subscribe = (onChange) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
};

const getServerSnapshot = () => false;

const ThemeController = () => {
    // Only used for the accessible label. It is `false` on the server and for
    // the hydration render, so it can briefly disagree with the real theme —
    // which is exactly why the click handler below must NOT depend on it.
    const isDark = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

    const handleToggle = () => {
        // Read the DOM, not React state. During hydration `isDark` is still the
        // server snapshot (false), so `!isDark` computed "switch to dark" while
        // the page was *already* dark — the first click did nothing, and only
        // after the observer corrected the state did toggling start working.
        const next = !readTheme();
        document.documentElement.setAttribute("data-theme", next ? DARK : LIGHT);
        localStorage.setItem("theme", next ? "dark" : "light");
    };

    return (
        <button
            onClick={handleToggle}
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title="Toggle theme"
        >
            {/* Icon follows React state. For one frame after hydration this can
                show the light icon while the page is already dark — cosmetic
                only. The click handler deliberately does NOT read this value. */}
            <span className="relative block w-5 h-5">
                <FiSun
                    size={20}
                    className={`absolute inset-0 transition-all duration-300 ${
                        isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                    }`}
                />
                <FiMoon
                    size={20}
                    className={`absolute inset-0 transition-all duration-300 ${
                        isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                    }`}
                />
            </span>
        </button>
    );
};

export default ThemeController;
