"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiSkipForward, FiRotateCcw, FiUsers } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { useApiData, unwrap } from "@/lib/useApiData";
import { api } from "@/lib/http";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";

/** Today's queue for the doctor: who's being seen and a "Next patient" button. */
const QueuePanel = ({ onAdvance }) => {
    const t = useTranslations("doctorQueue");
    const { time: to12h, number } = useFormat();
    const { data: q, reload: load } = useApiData(async (token) => unwrap(await api("/doctor/queue", { token })));
    const [busy, setBusy] = useState(false);

    const act = async (path) => {
        setBusy(true);
        const { data: tokenData } = await authClient.token();
        const res = await api(path, { method: "POST", token: tokenData?.token, body: {} });
        setBusy(false);
        if (!res.ok) return toast.error(res.message);
        if (res.data.patientName) toast.success(t("nowServingToast", { serial: number(res.data.currentSerial), name: res.data.patientName }));
        load();
        onAdvance?.();
    };

    if (!q) return <div className="skeleton h-24 rounded-2xl mb-6" />;

    const waiting = q.list.filter((a) => ["pending", "confirmed"].includes(a.status));
    const current = q.list.find((a) => a.serial === q.currentSerial);
    const next = waiting.find((a) => a.serial > q.currentSerial);

    if (q.list.length === 0) {
        return (
            <div className="bg-base-100 rounded-2xl border border-base-300 p-4 mb-6 text-sm text-base-content/50 flex items-center gap-2">
                <FiUsers className="text-primary" /> {t("none")}
            </div>
        );
    }

    return (
        <div className="bg-base-100 rounded-2xl border border-primary/30 p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="text-center rounded-xl bg-primary text-primary-content px-4 py-2">
                        <p className="text-[9px] uppercase tracking-widest opacity-80">{t("nowServing")}</p>
                        <p className="text-3xl font-black leading-tight">{q.currentSerial ? `#${number(q.currentSerial)}` : "—"}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold">{current ? current.patientName : t("notStarted")}</p>
                        <p className="text-base-content/50 text-xs">
                            {t("waiting", { count: number(waiting.filter((a) => a.serial > q.currentSerial).length) })}
                            {next && t("next", { serial: number(next.serial), name: next.patientName, time: to12h(next.appointmentTime) })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => act("/doctor/queue/next")} disabled={busy || !next} className="btn btn-primary btn-sm gap-1">
                        <FiSkipForward size={14} /> {t("nextPatient")}
                    </button>
                    {q.currentSerial > 0 && (
                        <button onClick={() => act("/doctor/queue/reset")} disabled={busy} className="btn btn-ghost btn-sm gap-1" title={t("restart")} aria-label={t("restart")}>
                            <FiRotateCcw size={13} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueuePanel;
