"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { authClient } from "./auth-client";
import { getSavedDoctorIds, saveDoctor, unsaveDoctor } from "./patient";

// One shared copy of the signed-in user's saved doctor ids, so a page of
// twelve DoctorCards makes one request instead of twelve.
let saved = null; // Set<string> | null (not loaded)
let inflight = null;
let loadedFor = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
    listeners.add(l);
    return () => listeners.delete(l);
};
const EMPTY = new Set();

const load = async (userId) => {
    if (loadedFor === userId && (saved || inflight)) return inflight;
    loadedFor = userId;
    inflight = (async () => {
        const { data: tokenData } = await authClient.token();
        const res = await getSavedDoctorIds(tokenData?.token);
        saved = new Set(res.ok ? res.data : []);
        inflight = null;
        emit();
    })();
    return inflight;
};

export const useSavedDoctors = () => {
    const { data: session } = authClient.useSession();
    const userId = session?.user?.id || null;
    const ids = useSyncExternalStore(subscribe, () => saved || EMPTY, () => EMPTY);

    useEffect(() => {
        if (userId) load(userId);
        else if (saved) {
            saved = null;
            loadedFor = null;
            emit();
        }
    }, [userId]);

    const toggle = useCallback(async (doctorId) => {
        if (!userId) return { ok: false, needsLogin: true };
        const next = new Set(saved || []);
        const wasSaved = next.has(doctorId);
        wasSaved ? next.delete(doctorId) : next.add(doctorId);
        saved = next; // optimistic
        emit();
        const { data: tokenData } = await authClient.token();
        const res = wasSaved ? await unsaveDoctor(doctorId, tokenData?.token) : await saveDoctor(doctorId, tokenData?.token);
        if (!res.ok) {
            const rollback = new Set(saved);
            wasSaved ? rollback.add(doctorId) : rollback.delete(doctorId);
            saved = rollback;
            emit();
        }
        return { ...res, saved: !wasSaved };
    }, [userId]);

    return { ids, toggle, signedIn: Boolean(userId) };
};
