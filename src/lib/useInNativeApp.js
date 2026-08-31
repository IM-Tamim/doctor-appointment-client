"use client";
import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/**
 * True when the page is running inside the Capacitor Android/iOS shell.
 *
 * Detection is by a marker appended to the user agent (`appendUserAgent` in
 * capacitor.config.json) rather than by sniffing for a WebView, which is both
 * unreliable and catches unrelated in-app browsers.
 *
 * Server snapshot is `false`, so this never causes a hydration mismatch —
 * the browser and the app render identically until the first client paint.
 */
export const useInNativeApp = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => navigator.userAgent.includes("DocAppointApp"),
    () => false
  );
