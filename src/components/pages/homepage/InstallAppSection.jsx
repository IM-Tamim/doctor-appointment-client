"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FiDownload, FiShare, FiWifiOff, FiZap, FiSmartphone, FiPlusSquare } from "react-icons/fi";
import Logo from "@/components/shared/Logo";

const APK_URL = "/docappoint.apk";

const subscribeNoop = () => () => {};

/**
 * Environment facts read through useSyncExternalStore so they resolve to
 * `false` on the server and during hydration, then to the real value on the
 * next paint — no setState-in-effect, no hydration mismatch.
 */
const useIsIos = () =>
    useSyncExternalStore(
        subscribeNoop,
        () => /iphone|ipad|ipod/i.test(navigator.userAgent),
        () => false
    );

const useAlreadyInstalled = () =>
    useSyncExternalStore(
        subscribeNoop,
        () =>
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true,
        () => false
    );

// Inside the Capacitor shell the visitor already has the app — offering a
// download of the thing they're currently running would be absurd.
const useInNativeApp = () =>
    useSyncExternalStore(
        subscribeNoop,
        () => navigator.userAgent.includes("DocAppointApp"),
        () => false
    );

const PERKS = [
    { icon: FiZap, label: "Opens straight to booking" },
    { icon: FiWifiOff, label: "Pages you've seen work offline" },
    { icon: FiSmartphone, label: "Fullscreen, no browser bars" },
];

/**
 * Static "get the app" section on the homepage.
 *
 * Replaced a floating fixed-position card: a banner hovering over every route
 * is a nag, whereas on the homepage the same offer reads as a feature.
 *
 * Offers whichever routes actually exist for the visitor:
 *  - the Android APK, a real file served from /public
 *  - the PWA install prompt, where Chromium exposes one
 *  - Share → Add to Home Screen on iOS, which has no such event
 */
const InstallAppSection = () => {
    const isIos = useIsIos();
    const alreadyInstalled = useAlreadyInstalled();
    const inNativeApp = useInNativeApp();
    const [deferred, setDeferred] = useState(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        const onBeforeInstall = (e) => {
            e.preventDefault(); // suppress Chrome's own mini-infobar
            setDeferred(e);
        };
        const onInstalled = () => setInstalled(true);

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const install = async () => {
        if (!deferred) return;
        deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
    };

    if (inNativeApp || alreadyInstalled || installed) return null;

    return (
        <section className="bg-base-100 py-16">
            <div className="max-w-5xl mx-auto px-4">
                <div className="reveal relative overflow-hidden rounded-3xl border border-base-300 bg-base-200/50 brand-glow p-8 md:p-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">

                        <Logo size={80} className="shrink-0 drop-shadow-lg" />

                        <div className="flex-1 text-center md:text-left">
                            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                                Get the app
                            </p>
                            <h2 className="text-2xl md:text-3xl font-black text-base-content">
                                DocAppoint on your{" "}
                                <span className="text-gradient">home screen</span>
                            </h2>
                            <p className="text-sm text-base-content/60 mt-2 max-w-md mx-auto md:mx-0 leading-relaxed">
                                Book appointments in a tap — install it straight from your
                                browser, or grab the Android app.
                            </p>

                            <ul className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 mt-5">
                                {PERKS.map(({ icon: Icon, label }) => (
                                    <li
                                        key={label}
                                        className="flex items-center gap-1.5 text-xs text-base-content/60"
                                    >
                                        <Icon size={13} className="text-primary shrink-0" />
                                        {label}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-7 flex flex-wrap gap-3 justify-center md:justify-start">
                                {/* No APK on iOS — an Android package is useless there. */}
                                {!isIos && (
                                    <a
                                        href={APK_URL}
                                        download="DocAppoint.apk"
                                        className="btn btn-primary rounded-xl font-bold gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <FiDownload size={16} /> Download for Android
                                    </a>
                                )}

                                {deferred && (
                                    <button
                                        onClick={install}
                                        className="btn btn-primary btn-outline rounded-xl font-bold gap-2 hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <FiPlusSquare size={16} /> Install web app
                                    </button>
                                )}
                            </div>

                            {isIos ? (
                                <p className="mt-5 inline-flex items-start gap-2 text-sm text-base-content/70 bg-base-100 border border-base-300 rounded-xl px-4 py-3 text-left">
                                    <FiShare size={15} className="text-primary mt-0.5 shrink-0" />
                                    <span>
                                        On iPhone: tap{" "}
                                        <span className="font-semibold text-base-content">Share</span>, then{" "}
                                        <span className="font-semibold text-base-content">Add to Home Screen</span>.
                                    </span>
                                </p>
                            ) : (
                                <p className="mt-4 text-xs text-base-content/45">
                                    Android will ask you to allow installing from your browser —
                                    expected for apps outside the Play Store.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InstallAppSection;
