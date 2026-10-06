"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiSend, FiMic, FiMicOff, FiX, FiAlertTriangle, FiPhoneCall, FiStar, FiVideo } from "react-icons/fi";
import { api } from "@/lib/http";
import { localNumber } from "@/lib/schedule";
import { cld } from "@/lib/cloudinary";
import { useLocale, useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";

const GREETING = {
    en: "Hi! Tell me what's bothering you and I'll suggest which kind of doctor to see. I can't diagnose — for emergencies call 999.",
    bn: "আসসালামু আলাইকুম! আপনার সমস্যা লিখুন, আমি কোন ধরনের ডাক্তার দেখাবেন তা জানাব। আমি রোগ নির্ণয় করি না — জরুরি অবস্থায় ৯৯৯-এ কল করুন।",
};
const PLACEHOLDER = { en: "e.g. I've had a cough and fever for 3 days", bn: "যেমন: ৩ দিন ধরে কাশি আর জ্বর" };
const SPEECH_LANG = { en: "en-US", bn: "bn-BD" };

const getRecognition = () =>
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const DoctorChip = ({ d }) => {
    const t = useTranslations("assistant");
    const { money, locale } = useFormat();
    return (
    <Link
        href={`/doctors/${d._id}`}
        className="flex items-center gap-2.5 bg-base-100 border border-base-300 hover:border-primary/50 rounded-xl p-2"
    >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
            src={cld(d.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=0e9080&color=fff`}
            alt=""
            className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
        <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold truncate">{d.name}</span>
            <span className="block text-[11px] text-base-content/55 truncate">
                {d.hospital || t("online")} · {money(d.fee)}
            </span>
        </span>
        <span className="text-[11px] flex items-center gap-0.5 shrink-0">
            <FiStar size={10} className="text-warning fill-warning" /> {localNumber(d.rating, locale)}
            {d.consultationType !== "in-person" && <FiVideo size={10} className="text-info ml-1" />}
        </span>
    </Link>
    );
};

/** Symptom chat. Loaded only when the launcher is opened (see AssistantLauncher). */
const AssistantPanel = ({ onClose }) => {
    const t = useTranslations("assistant");
    const specialtyName = useLabel("common.specialties");
    // The conversation starts in the UI language; the EN/বাং toggle switches just the chat.
    const uiLocale = useLocale();
    const [lang, setLang] = useState(uiLocale === "bn" ? "bn" : "en");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [listening, setListening] = useState(false);
    const listRef = useRef(null);
    const recRef = useRef(null);
    const canListen = Boolean(getRecognition());

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, busy]);

    useEffect(() => () => recRef.current?.abort?.(), []);

    const send = async (text) => {
        const message = (text ?? input).trim();
        if (!message || busy) return;
        setInput("");
        const history = messages.map((m) => ({ role: m.role, content: m.text }));
        setMessages((prev) => [...prev, { role: "user", text: message }]);
        setBusy(true);
        const res = await api("/ai/triage", { method: "POST", body: { message, history, lang } });
        setBusy(false);
        if (!res.ok) {
            setMessages((prev) => [...prev, { role: "assistant", text: res.message, error: true }]);
            return;
        }
        const d = res.data;
        const replyText = [d.reply, d.followUpQuestion].filter(Boolean).join(" ");
        setMessages((prev) => [...prev, { role: "assistant", text: replyText, result: d }]);
    };

    const toggleMic = () => {
        if (listening) {
            recRef.current?.stop();
            return;
        }
        const Recognition = getRecognition();
        if (!Recognition) return;
        const rec = new Recognition();
        rec.lang = SPEECH_LANG[lang];
        rec.interimResults = true;
        rec.onresult = (e) => setInput([...e.results].map((r) => r[0].transcript).join(" "));
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        recRef.current = rec;
        setListening(true);
        rec.start();
    };

    return (
        <div
            role="dialog"
            aria-label={t("dialog")}
            className="fixed z-50 bottom-20 right-3 left-3 sm:left-auto sm:right-5 sm:w-96 h-[70vh] max-h-[560px] bg-base-100 border border-base-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-up"
        >
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-content">
                <div>
                    <p className="font-bold text-sm">{t("title")}</p>
                    <p className="text-[11px] opacity-80">{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-1">
                    <div className="join" role="group" aria-label={t("language")}>
                        {["en", "bn"].map((l) => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                aria-pressed={lang === l}
                                className={`join-item btn btn-xs ${lang === l ? "bg-primary-content text-primary border-0" : "btn-ghost text-primary-content"}`}
                            >
                                {l === "en" ? "EN" : "বাং"}
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-primary-content" aria-label={t("close")}>
                        <FiX size={16} />
                    </button>
                </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-base-200/40" aria-live="polite">
                <div className="bg-base-100 border border-base-300 rounded-2xl rounded-tl-sm p-3 text-sm max-w-[90%]">{GREETING[lang]}</div>

                {messages.map((m, i) =>
                    m.role === "user" ? (
                        <div key={i} className="ml-auto bg-primary text-primary-content rounded-2xl rounded-tr-sm p-3 text-sm max-w-[85%] w-fit">
                            {m.text}
                        </div>
                    ) : (
                        <div key={i} className="space-y-2 max-w-[92%]">
                            {m.result?.emergency && (
                                <div className="bg-error text-error-content rounded-xl p-3 text-sm">
                                    <p className="font-bold flex items-center gap-1.5"><FiAlertTriangle /> {m.result.emergencyMessage}</p>
                                    <a href="tel:999" className="btn btn-sm bg-error-content text-error border-0 mt-2 gap-1.5"><FiPhoneCall /> {t("call999")}</a>
                                </div>
                            )}
                            <div className={`bg-base-100 border rounded-2xl rounded-tl-sm p-3 text-sm ${m.error ? "border-error/40 text-error" : "border-base-300"}`}>
                                {m.text}
                            </div>
                            {m.result && (
                                <>
                                    <p className="text-[11px] font-semibold text-base-content/60 px-1">
                                        {t("suggested")} <span className="text-primary">{specialtyName(m.result.specialty)}</span>
                                        {m.result.urgency === "urgent" && <span className="text-warning"> · {t("urgent")}</span>}
                                    </p>
                                    {m.result.doctors.map((d) => <DoctorChip key={d._id} d={d} />)}
                                    <Link
                                        href={`/all-appointments?specialty=${encodeURIComponent(m.result.specialty)}`}
                                        className="text-xs text-primary hover:underline px-1"
                                    >
                                        {t("seeAll", { specialty: specialtyName(m.result.specialty) })}
                                    </Link>
                                    <p className="text-[10px] text-base-content/45 px-1">{m.result.disclaimer}</p>
                                </>
                            )}
                        </div>
                    )
                )}
                {busy && (
                    <div className="bg-base-100 border border-base-300 rounded-2xl rounded-tl-sm p-3 w-16 flex justify-center">
                        <span className="loading loading-dots loading-sm text-primary" />
                    </div>
                )}
            </div>

            <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="p-2.5 border-t border-base-300 flex items-center gap-2 bg-base-100"
            >
                {canListen && (
                    <button
                        type="button"
                        onClick={toggleMic}
                        aria-pressed={listening}
                        aria-label={listening ? t("stopVoice") : t("speak")}
                        className={`btn btn-sm btn-circle ${listening ? "btn-error animate-pulse" : "btn-ghost"}`}
                    >
                        {listening ? <FiMicOff size={15} /> : <FiMic size={15} />}
                    </button>
                )}
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={PLACEHOLDER[lang]}
                    aria-label={t("describe")}
                    maxLength={1000}
                    className="input input-bordered input-sm flex-1 rounded-xl"
                />
                <button disabled={busy || !input.trim()} className="btn btn-primary btn-sm btn-circle" aria-label={t("send")}>
                    <FiSend size={14} />
                </button>
            </form>
        </div>
    );
};

export default AssistantPanel;
