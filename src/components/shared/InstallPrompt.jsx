"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FiDownload, FiX, FiShare } from "react-icons/fi";
import Logo from "./Logo";

const DISMISS_KEY = "docappoint:install-dismissed";

const subscribeNoop = () => () => {};

/**
 * Environment facts, read through useSyncExternalStore so they resolve to
 * `false` on the server and during hydration, then to the real value on the
 * next paint. Doing this with useState + useEffect would mean calling setState
 * synchronously inside an effect — a cascading render, and a lint error.
 * Each snapshot returns a primitive, which is what keeps React from looping.
 */
const useIsIosSafari = () =>
    useSyncExternalStore(
        subscribeNoop,
        () => {
            const ua = navigator.userAgent;
            return (
                /iphone|ipad|ipod/i.test(ua) &&
                /safari/i.test(ua) &&
                !/crios|fxios|edgios/i.test(ua)
            );
        },
        () => false
    );

const useIsEligible = () =>
    useSyncExternalStore(
        subscribeNoop,
        () => {
            const standalone =
                window.matchMedia("(display-mode: standalone)").matches ||
                window.navigator.standalone === true;
            if (standalone) return false; // already installed — never nag
            try {
                return !localStorage.getItem(DISMISS_KEY);
            } catch {
                return true; // private mode can throw; assume not dismissed
            }
        },
        () => false
    );

/**
 * Prompts installation of the PWA.
 *
 * Two paths, because the platforms genuinely differ:
 *  - Chromium fires `beforeinstallprompt`, which we capture and replay on a tap.
 *  - iOS Safari has no such event, so installing is a manual
 *    Share → "Add to Home Screen". There we can only show instructions.
 */
const InstallPrompt = () => {
    const isIosSafari = useIsIosSafari();
    const eligible = useIsEligible();

    const [deferred, setDeferred] = useState(null);
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        // Only listeners here — no state written during the effect body.
        const onBeforeInstall = (e) => {
            e.preventDefault(); // suppress Chrome's own mini-infobar
            setDeferred(e);
        };
        const onInstalled = () => setClosed(true);

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const dismiss = () => {
        setClosed(true);
        try {
            localStorage.setItem(DISMISS_KEY, "1");
        } catch {
            /* ignore */
        }
    };

    const install = async () => {
        if (!deferred) return;
        deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
        setClosed(true);
    };

    const show = eligible && !closed && (Boolean(deferred) || isIosSafari);
    if (!show) return null;

    return (
        <div className="fixed inset-x-3 bottom-3 z-40 sm:left-auto sm:right-4 sm:w-96 animate-fade-up safe-bottom">
            <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
                <Logo size={40} className="shrink-0" />

                <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-base-content">Install DocAppoint</p>

                    {isIosSafari && !deferred ? (
                        <p className="text-xs text-base-content/60 mt-1 leading-relaxed">
                            Tap <FiShare size={11} className="inline mx-0.5 text-primary" /> Share,
                            then{" "}
                            <span className="font-semibold text-base-content">Add to Home Screen</span>.
                        </p>
                    ) : (
                        <>
                            <p className="text-xs text-base-content/60 mt-1 leading-relaxed">
                                Add it to your home screen for faster booking and a fullscreen app.
                            </p>
                            <button
                                onClick={install}
                                className="btn btn-primary btn-sm rounded-lg mt-3 gap-1.5 font-bold"
                            >
                                <FiDownload size={13} /> Install
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={dismiss}
                    aria-label="Dismiss install prompt"
                    className="btn btn-ghost btn-xs btn-circle shrink-0"
                >
                    <FiX size={14} />
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
