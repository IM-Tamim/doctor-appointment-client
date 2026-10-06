"use client";
import { useEffect, useState } from "react";
import { FiActivity } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/http";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";

const POLL_MS = 20000;

const TEXT = {
    not_started: (t, q, n) => q.ahead
        ? t("notStartedAhead", { serial: n(q.mySerial), ahead: n(q.ahead) })
        : t("notStarted", { serial: n(q.mySerial) }),
    waiting: (t, q, n) => t("waiting", { current: n(q.currentSerial), serial: n(q.mySerial), minutes: n(q.etaMinutes) }),
    your_turn: (t) => t("yourTurn"),
    passed: (t, q, n) => t("passed", { serial: n(q.mySerial) }),
    done: (t) => t("done"),
};

/** Today's queue position, polled every 20s while the card is on screen. */
const LiveQueue = ({ appointment }) => {
    const t = useTranslations("queue");
    const { number } = useFormat();
    const [q, setQ] = useState(null);

    useEffect(() => {
        let stopped = false;
        const tick = async () => {
            if (document.hidden) return; // don't poll a background tab
            const { data: tokenData } = await authClient.token();
            const res = await api(`/queue/appointments/${appointment._id}`, { token: tokenData?.token });
            if (!stopped && res.ok) setQ(res.data);
        };
        tick();
        const timer = setInterval(tick, POLL_MS);
        const onVisible = () => !document.hidden && tick();
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            stopped = true;
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [appointment._id]);

    if (!q || q.state === "not_today") return null;

    const urgent = q.state === "your_turn" || (q.state === "waiting" && q.ahead <= 2);
    return (
        <div
            aria-live="polite"
            className={`rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 ${urgent ? "bg-success/15 text-success-content" : "bg-info/10"}`}
        >
            <FiActivity size={14} className={`mt-0.5 shrink-0 ${urgent ? "text-success" : "text-info"}`} />
            <span className="text-base-content/80">
                <b className="block text-[10px] uppercase tracking-widest text-base-content/50">{t("title")}</b>
                {TEXT[q.state]?.(t, q, number)}
            </span>
        </div>
    );
};

export default LiveQueue;
