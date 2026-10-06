"use client";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "./auth-client";

/**
 * Loads data for the signed-in user and reloads it on demand.
 *
 * `fetcher(token)` returns the parsed data (or throws). State is only set from
 * inside the async callback, so effects never update state synchronously.
 * Returns { data, error, loading, refreshing, reload }. `deps` re-run the fetch.
 *
 * `loading` is the first load only (nothing to show yet); `refreshing` is a
 * re-fetch while previous data is still on screen. Callers that change a filter
 * need the second one — without it, switching a range looks like a dead button
 * until the new numbers silently appear.
 */
export const useApiData = (fetcher, deps = []) => {
    const { data: session } = authClient.useSession();
    const [state, setState] = useState({ data: null, error: "", loading: true, key: null });
    const [version, setVersion] = useState(0);
    const reload = useCallback(() => setVersion((v) => v + 1), []);

    // Which fetch the current state belongs to. Comparing it to the key this
    // render asks for gives `refreshing` without a setState in the effect body.
    const key = `${version}|${JSON.stringify(deps)}`;

    useEffect(() => {
        if (!session) return;
        let cancelled = false;
        (async () => {
            try {
                const { data: tokenData } = await authClient.token();
                const data = await fetcher(tokenData?.token);
                if (!cancelled) setState({ data, error: "", loading: false, key });
            } catch (err) {
                if (!cancelled) setState((s) => ({ ...s, error: err?.message || "Something went wrong.", loading: false, key }));
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, version, ...deps]);

    return { ...state, refreshing: Boolean(session) && state.key !== key, reload };
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
