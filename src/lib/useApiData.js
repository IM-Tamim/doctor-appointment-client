"use client";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "./auth-client";

/**
 * Loads data for the signed-in user and reloads it on demand.
 *
 * `fetcher(token)` returns the parsed data (or throws). State is only set from
 * inside the async callback, so effects never update state synchronously.
 * Returns { data, error, loading, reload }. `deps` re-run the fetch.
 */
export const useApiData = (fetcher, deps = []) => {
    const { data: session } = authClient.useSession();
    const [state, setState] = useState({ data: null, error: "", loading: true });
    const [version, setVersion] = useState(0);
    const reload = useCallback(() => setVersion((v) => v + 1), []);

    useEffect(() => {
        if (!session) return;
        let cancelled = false;
        (async () => {
            try {
                const { data: tokenData } = await authClient.token();
                const data = await fetcher(tokenData?.token);
                if (!cancelled) setState({ data, error: "", loading: false });
            } catch (err) {
                if (!cancelled) setState((s) => ({ ...s, error: err?.message || "Something went wrong.", loading: false }));
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, version, ...deps]);

    return { ...state, reload };
};

/** Turns an api() result into data-or-throw for useApiData fetchers. */
export const unwrap = (res) => {
    if (!res.ok) throw new Error(res.message);
    return res.data;
};

/** Re-renders periodically so time-based UI (join buttons, countdowns) updates by itself. */
export const useNow = (intervalMs = 30000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
    return now;
};
