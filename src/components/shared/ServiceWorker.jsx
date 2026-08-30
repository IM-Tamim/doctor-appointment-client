"use client";
import { useEffect } from "react";

/**
 * Registers the service worker that makes DocAppoint installable.
 *
 * Registration is deliberately deferred to the `load` event — doing it during
 * hydration competes with the app's own first paint and fetches for bandwidth
 * on exactly the slow mobile connections this is meant to help.
 *
 * Dev is skipped: the SW would cache Turbopack's HMR chunks and you'd spend an
 * afternoon wondering why your edits don't show up.
 */
const ServiceWorker = () => {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return;
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

        const register = () => {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then((reg) => {
                    // If a new build is waiting, activate it right away rather
                    // than leaving the user on a stale shell until every tab closes.
                    if (reg.waiting) reg.waiting.postMessage("SKIP_WAITING");

                    reg.addEventListener("updatefound", () => {
                        const next = reg.installing;
                        if (!next) return;
                        next.addEventListener("statechange", () => {
                            if (next.state === "installed" && navigator.serviceWorker.controller) {
                                next.postMessage("SKIP_WAITING");
                            }
                        });
                    });
                })
                .catch((err) => {
                    // Never let a failed registration break the page.
                    console.warn("Service worker registration failed:", err.message);
                });
        };

        if (document.readyState === "complete") register();
        else window.addEventListener("load", register, { once: true });

        return () => window.removeEventListener("load", register);
    }, []);

    return null;
};

export default ServiceWorker;
