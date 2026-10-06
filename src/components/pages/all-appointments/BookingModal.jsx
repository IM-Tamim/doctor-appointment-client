"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiX, FiCalendar, FiVideo, FiMapPin, FiCheckCircle, FiDownload, FiUsers, FiRepeat } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";
import { createAppointment, getPaymentConfig, downloadReceipt } from "@/lib/appointments";
import { getProfiles } from "@/lib/patient";
import { workingDays, weekdayName } from "@/lib/schedule";
import { useTranslations } from "next-intl";
import { useFormat, useLabel } from "@/lib/i18n";
import SlotPicker from "@/components/pages/booking/SlotPicker";

const inputClass =
    "w-full px-4 py-3 rounded-xl text-sm bg-base-200 border border-base-300 text-base-content outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

const Section = ({ n, title, children }) => (
    <div className="flex flex-col gap-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-base-content/50">
            <span className="text-primary">{n}.</span> {title}
        </p>
        {children}
    </div>
);

const Choice = ({ active, onClick, icon: Icon, title, hint, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        className={`flex-1 text-left rounded-xl border p-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            active ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-base-300 hover:border-primary/50"
        }`}
    >
        <span className="flex items-center gap-2 font-semibold text-sm">
            {Icon && <Icon size={14} className="text-primary" />} {title}
        </span>
        {hint && <span className="block text-[11px] text-base-content/50 mt-0.5">{hint}</span>}
    </button>
);

/**
 * Booking flow. Uncontrolled (renders its own "Book Appointment" button) on
 * the doctor page; controlled via `open`/`onClose` for follow-ups, where
 * `followUp` fixes the patient, the date window and the discounted fee.
 */
const BookingModal = ({ doctor, followUp, open, onClose }) => {
    const router = useRouter();
    const t = useTranslations("booking");
    const tc = useTranslations("common");
    const { locale, date: prettyDate, time: to12h, money, number } = useFormat();
    const genderName = useLabel("common.genders");
    const relationName = useLabel("common.relations");
    const controlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlled ? open : internalOpen;

    const consultationType = doctor.consultationType || "in-person";
    const { data: session } = authClient.useSession();
    const [mode, setMode] = useState(consultationType === "online" ? "online" : "in-person");
    const [slot, setSlot] = useState({ date: "", time: "", serial: null });
    const [profiles, setProfiles] = useState([]);
    const [who, setWho] = useState("self");
    // Prefilled from the follow-up's patient or the account; re-seeded on every open.
    const freshDetails = () => ({
        patientName: followUp?.patient?.patientName || session?.user?.name || "",
        gender: "",
        age: "",
        phone: followUp?.patient?.phone || session?.user?.phone || "",
        reason: "",
    });
    const [details, setDetails] = useState(freshDetails);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [sslReady, setSslReady] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [booked, setBooked] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        (async () => {
            const cfg = await getPaymentConfig();
            if (!cancelled) setSslReady(Boolean(cfg.ok && cfg.data.sslcommerz));
            if (followUp || !session) return;
            const { data: tokenData } = await authClient.token();
            const res = await getProfiles(tokenData?.token);
            if (!cancelled && res.ok) setProfiles(res.data);
        })();
        return () => { cancelled = true; };
    }, [isOpen, followUp, session]);

    // Online visits must be prepaid, so "pay at hospital" disappears for them.
    const chooseMode = (next) => {
        setMode(next);
        if (next === "online" && paymentMethod === "cash") setPaymentMethod("");
    };

    const fee = followUp ? followUp.fee : doctor.fee || 0;
    const days = workingDays(doctor);

    const close = () => {
        if (controlled) onClose?.();
        else setInternalOpen(false);
        setSlot({ date: "", time: "", serial: null });
        setBooked(null);
    };

    const openModal = () => {
        if (!session) {
            router.push("/signin");
            return;
        }
        setDetails(freshDetails());
        setInternalOpen(true);
    };

    const canSubmit =
        slot.date && slot.time && paymentMethod && details.phone.trim() &&
        (followUp || who !== "self" || details.patientName.trim());

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const { data: tokenData } = await authClient.token();
            // Identity comes from the JWT; a family profile is looked up server-side.
            const body = {
                doctorId: doctor._id,
                appointmentDate: slot.date,
                appointmentTime: slot.time,
                consultationMode: mode,
                paymentMethod,
                phone: details.phone,
                reason: details.reason,
                ...(followUp
                    ? { parentAppointmentId: followUp.parentAppointmentId }
                    : who === "self"
                        ? { patientName: details.patientName, gender: details.gender, age: details.age }
                        : { profileId: who }),
            };
            const res = await createAppointment(body, tokenData?.token);
            if (!res.ok) {
                toast.error(res.message);
                return;
            }
            if (res.data.needsPayment) {
                toast.success(t("held", { serial: number(res.data.serial) }));
                router.push(`/payment/${res.data.insertedId}`);
                return;
            }
            toast.success(t("bookedToast", { serial: number(res.data.serial) }));
            setBooked({ ...res.data, _id: res.data.insertedId, appointmentDate: slot.date, appointmentTime: slot.time });
        } catch {
            toast.error(t("error"));
        } finally {
            setSubmitting(false);
        }
    };

    const getReceipt = async () => {
        try {
            const { data: tokenData } = await authClient.token();
            await downloadReceipt(booked, tokenData?.token, locale);
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <>
            {!controlled && (
                <button
                    onClick={openModal}
                    className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform duration-300"
                >
                    {t("book")}
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={close} />

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="booking-title"
                        className="relative bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-lg z-10 max-h-[92vh] overflow-y-auto animate-fade-up"
                    >
                        <div className="sticky top-0 bg-base-100 z-10 flex items-start justify-between p-6 pb-4 border-b border-base-300">
                            <div>
                                <h3 id="booking-title" className="font-black text-xl text-base-content flex items-center gap-2">
                                    {followUp && <FiRepeat className="text-primary" size={18} />}
                                    {followUp ? t("followUp") : t("book")}
                                </h3>
                                <p className="text-sm text-base-content/50 mt-0.5">{t("with", { name: doctor.name })}</p>
                            </div>
                            <button onClick={close} className="btn btn-sm btn-ghost btn-circle mt-1" aria-label={tc("close")}>
                                <FiX size={16} />
                            </button>
                        </div>

                        {booked ? (
                            <div className="p-6 flex flex-col items-center text-center gap-3">
                                <FiCheckCircle size={44} className="text-success" />
                                <p className="font-black text-lg">{t("booked")}</p>
                                <div className="rounded-2xl bg-primary/10 px-8 py-4">
                                    <p className="text-xs uppercase tracking-widest text-base-content/50">{t("serial")}</p>
                                    <p className="text-4xl font-black text-primary">#{number(booked.serial)}</p>
                                </div>
                                <p className="text-sm text-base-content/60">
                                    {t("when", { date: prettyDate(booked.appointmentDate), time: to12h(booked.appointmentTime) })}
                                    <br />{t("receiptNo", { no: booked.receiptNo })}
                                    {booked.paymentMethod === "cash" && <><br />{t("payAtHospital", { amount: money(booked.amount) })}</>}
                                </p>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={getReceipt} className="btn btn-outline btn-sm gap-1"><FiDownload size={13} /> {t("receipt")}</button>
                                    <Link href="/dashboard/patient" className="btn btn-primary btn-sm">{t("myBookings")}</Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={onSubmit} className="p-6 flex flex-col gap-6">
                                {consultationType === "both" && (
                                    <Section n={number(1)} title={t("visitType")}>
                                        <div className="flex gap-2">
                                            <Choice active={mode === "in-person"} onClick={() => chooseMode("in-person")} icon={FiMapPin} title={t("inPerson")} hint={doctor.hospital || t("atChamber")} />
                                            <Choice active={mode === "online"} onClick={() => chooseMode("online")} icon={FiVideo} title={t("video")} hint={t("fromHome")} />
                                        </div>
                                    </Section>
                                )}
                                {consultationType === "online" && (
                                    <p className="text-xs bg-info/10 border border-info/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
                                        <FiVideo className="text-info shrink-0" /> {t("onlineNote")}
                                    </p>
                                )}

                                <Section n={number(consultationType === "both" ? 2 : 1)} title={t("dateTime")}>
                                    {days.length > 0 && !followUp && (
                                        <p className="text-xs text-base-content/60 flex items-center gap-1.5">
                                            <FiCalendar size={12} className="text-primary" /> {t("consultsOn", { days: days.map((d) => weekdayName(d, locale)).join(", ") })}
                                        </p>
                                    )}
                                    {followUp && (
                                        <p className="text-xs bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                                            {t.rich("suggested", { date: prettyDate(followUp.followUpDate), end: prettyDate(followUp.window.end), b: (c) => <b>{c}</b> })}
                                        </p>
                                    )}
                                    <SlotPicker
                                        doctor={doctor}
                                        value={slot}
                                        onChange={setSlot}
                                        minDate={followUp?.window.start}
                                        maxDate={followUp?.window.end}
                                    />
                                </Section>

                                <Section n={number(consultationType === "both" ? 3 : 2)} title={t("patient")}>
                                    {followUp ? (
                                        <p className="text-sm bg-base-200 rounded-xl px-4 py-3">
                                            <b>{followUp.patient.patientName}</b>
                                            {followUp.patient.age ? ` · ${t("yrs", { age: number(followUp.patient.age) })}` : ""}
                                            {followUp.patient.gender ? ` · ${genderName(followUp.patient.gender)}` : ""}
                                        </p>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <FiUsers size={14} className="text-primary shrink-0" />
                                                <select value={who} onChange={(e) => setWho(e.target.value)} className={inputClass} aria-label={t("whoFor")}>
                                                    <option value="self">{t("myself")}</option>
                                                    {profiles.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {t("relation", { name: p.name, relation: relationName(p.relation), age: number(p.age) })}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Link href="/dashboard/patient/family" className="text-xs text-primary hover:underline -mt-1 w-fit">
                                                {t("addFamily")}
                                            </Link>
                                            {who === "self" && (
                                                <div className="grid grid-cols-6 gap-2">
                                                    <input
                                                        value={details.patientName}
                                                        onChange={(e) => setDetails({ ...details, patientName: e.target.value })}
                                                        placeholder={t("fullName")}
                                                        aria-label={t("patientName")}
                                                        className={`${inputClass} col-span-6`}
                                                        required
                                                    />
                                                    <select
                                                        value={details.gender}
                                                        onChange={(e) => setDetails({ ...details, gender: e.target.value })}
                                                        aria-label={t("gender")}
                                                        className={`${inputClass} col-span-3`}
                                                    >
                                                        <option value="">{t("gender")}</option>
                                                        {["Male", "Female", "Other"].map((g) => (
                                                            <option key={g} value={g}>{genderName(g)}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="120"
                                                        value={details.age}
                                                        onChange={(e) => setDetails({ ...details, age: e.target.value })}
                                                        placeholder={t("age")}
                                                        aria-label={t("age")}
                                                        className={`${inputClass} col-span-3`}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <input
                                        type="tel"
                                        value={details.phone}
                                        onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                                        placeholder={t("phone")}
                                        aria-label={t("phoneLabel")}
                                        className={inputClass}
                                        required
                                    />
                                    <input
                                        value={details.reason}
                                        onChange={(e) => setDetails({ ...details, reason: e.target.value })}
                                        placeholder={t("reason")}
                                        aria-label={t("reasonLabel")}
                                        className={inputClass}
                                    />
                                </Section>

                                <Section n={number(consultationType === "both" ? 4 : 3)} title={t("payment")}>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        {mode === "in-person" && (
                                            <Choice active={paymentMethod === "cash"} onClick={() => setPaymentMethod("cash")} title={t("cash")} hint={t("cashHint")} />
                                        )}
                                        <Choice active={paymentMethod === "demo_mobile"} onClick={() => setPaymentMethod("demo_mobile")} title={t("mobile")} hint={t("mobileHint")} />
                                        <Choice
                                            active={paymentMethod === "sslcommerz"}
                                            onClick={() => setPaymentMethod("sslcommerz")}
                                            disabled={!sslReady}
                                            title={t("card")}
                                            hint={sslReady ? t("sslHint") : t("sslOff")}
                                        />
                                    </div>
                                </Section>

                                <div className="rounded-xl bg-base-200 p-4 text-sm flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-base-content/60">
                                            {slot.time ? t.rich("serialAt", { serial: number(slot.serial), time: to12h(slot.time), b: (c) => <b className="text-primary">{c}</b> }) : t("chooseSlot")}
                                        </p>
                                        {followUp && followUp.fee < followUp.regularFee && (
                                            <p className="text-xs text-success">{t("discount")}</p>
                                        )}
                                    </div>
                                    <p className="text-2xl font-black text-primary">{money(fee)}</p>
                                </div>

                                <button type="submit" disabled={submitting || !canSubmit} className="btn btn-primary w-full rounded-xl font-bold">
                                    {submitting ? (
                                        <span className="loading loading-spinner loading-xs" />
                                    ) : paymentMethod && paymentMethod !== "cash" ? (
                                        t("continuePay")
                                    ) : (
                                        t("confirm")
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default BookingModal;
