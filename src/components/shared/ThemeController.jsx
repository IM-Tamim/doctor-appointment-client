"use client";
import { useSyncExternalStore } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

const LIGHT = "docappoint";
const DARK = "docappoint-dark";

// The <html data-theme> attribute is the source of truth — layout.js sets it
// before first paint. Subscribing to it with useSyncExternalStore keeps React
// in sync without a setState-inside-effect (and without a hydration mismatch,
// since the server snapshot is always the light theme the server rendered).
const subscribe = (onChange) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
};

const getSnapshot = () => document.documentElement.getAttribute("data-theme") === DARK;
const getServerSnapshot = () => false;

const ThemeController = () => {
    const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const handleToggle = () => {
        const dark = !isDark;
        document.documentElement.setAttribute("data-theme", dark ? DARK : LIGHT);
        localStorage.setItem("theme", dark ? "dark" : "light");
    };

    return (
        <button
            onClick={handleToggle}
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Light mode" : "Dark mode"}
        >
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
