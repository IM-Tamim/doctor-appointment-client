"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { addReview } from "@/lib/doctors";
import { getReviewable } from "@/lib/patient";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/i18n";
import toast from "react-hot-toast";
import { FiStar, FiSend } from "react-icons/fi";

const StarPicker = ({ value, onChange, label }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
            <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
                aria-label={label(s)}
                aria-pressed={s <= value}
                className="transition-transform hover:scale-110"
            >
                <FiStar
                    size={24}
                    className={s <= value ? "text-warning fill-warning" : "text-base-300"}
                />
            </button>
        ))}
    </div>
);

const StarDisplay = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <FiStar
                key={s}
                size={12}
                className={s <= rating ? "text-warning fill-warning" : "text-base-300"}
            />
        ))}
    </div>
);

const ReviewSection = ({ doctor }) => {
    const t = useTranslations("reviews");
    const { locale, date: prettyDate, number } = useFormat();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState(doctor.reviews || []);
    const [liveRating, setLiveRating] = useState(doctor.rating);
    const [liveTotalReviews, setLiveTotalReviews] = useState(doctor.totalReviews);
    const { data: session } = authClient.useSession();
    // Reviews belong to a completed visit — one per appointment.
    const [visits, setVisits] = useState(null);
    const [appointmentId, setAppointmentId] = useState("");

    const user = session?.user;

    useEffect(() => {
        if (!user) return;
        (async () => {
            const { data: tokenData } = await authClient.token();
            const res = await getReviewable(doctor._id, tokenData?.token);
            const list = res.ok ? res.data : [];
            setVisits(list);
            setAppointmentId(list[0]?._id || "");
        })();
    }, [user, doctor._id]);

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error(t("loginFirst"));
            return;
        }
        if (rating === 0) {
            toast.error(t("pickStars"));
            return;
        }

        // Only the rating and comment go over the wire — the server takes the
        // reviewer's identity from the JWT so it can't be spoofed.
        if (!appointmentId) {
            toast.error(t("pickVisit"));
            return;
        }

        setLoading(true);
        const reviewData = { rating, comment, appointmentId };

        try {
            const { data: tokenData } = await authClient.token();
            const result = await addReview(doctor._id, reviewData, tokenData?.token);

            // The server rejects reviews without a completed visit, duplicates,
            // and bad ratings — surface that instead of faking a success.
            if (result?.message && !result?.acknowledged) {
                toast.error(result.message);
                return;
            }

            const newReview = {
                rating,
                comment,
                userName: user.name,
                userEmail: user.email,
                date: new Date().toISOString(),
            };
            setReviews((prev) => [newReview, ...prev]);
            const rest = (visits || []).filter((v) => v._id !== appointmentId);
            setVisits(rest);
            setAppointmentId(rest[0]?._id || "");
            // Mirror the server's running mean rather than the old halving formula.
            setLiveTotalReviews((prevTotal) => {
                const nextTotal = prevTotal + 1;
                setLiveRating(parseFloat((((liveRating * prevTotal) + rating) / nextTotal).toFixed(1)));
                return nextTotal;
            });
            toast.success(t("submitted"));
            setRating(0);
            setComment("");
        } catch {
            toast.error(t("failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 pb-10">

            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 mb-6 flex items-center gap-4">
                <div className="text-center px-6 border-r border-base-300">
                    <p className="text-4xl font-black text-primary">{number(liveRating)}</p>
                    <StarDisplay rating={Math.round(liveRating)} />
                    <p className="text-xs text-base-content/40 mt-1">{t("count", { count: liveTotalReviews || 0 })}</p>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-base-content">{t("overall")}</p>
                    <p className="text-xs text-base-content/50 mt-1 leading-relaxed">
                        {t("basedOn", { count: liveTotalReviews || 0 })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="bg-base-100 border border-base-300 rounded-2xl p-6 flex flex-col gap-4 h-fit">
                    <h2 className="text-lg font-black text-base-content">{t("leave")}</h2>

                    {!user ? (
                        <p className="text-sm text-base-content/50">
                            {t("please")}{" "}
                            <a href="/signin" className="text-primary font-semibold hover:underline">
                                {t("login")}
                            </a>{" "}
                            {t("toLeave")}
                        </p>
                    ) : visits === null ? (
                        <div className="skeleton h-24 rounded-xl" />
                    ) : visits.length === 0 ? (
                        <p className="text-sm text-base-content/50">
                            {t("afterVisit", { name: doctor.name })}
                        </p>
                    ) : (
                        <form onSubmit={onSubmit} className="flex flex-col gap-4">
                            {visits.length > 1 ? (
                                <select
                                    value={appointmentId}
                                    onChange={(e) => setAppointmentId(e.target.value)}
                                    aria-label={t("visitLabel")}
                                    className="select select-bordered select-sm w-full rounded-xl"
                                >
                                    {visits.map((v) => (
                                        <option key={v._id} value={v._id}>
                                            {t("visitOn", { date: prettyDate(v.appointmentDate) })}{v.patientName ? ` (${v.patientName})` : ""}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-xs text-base-content/50">{t("reviewing", { date: prettyDate(visits[0].appointmentDate) })}</p>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                    {t("yourRating")}
                                </label>
                                <StarPicker value={rating} onChange={setRating} label={(s) => t("star", { count: s })} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                    {t("yourReview")}
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t("placeholder")}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-base-200 border border-base-300 text-base-content outline-none focus:border-primary transition-all resize-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full rounded-xl font-bold flex items-center gap-2 disabled:opacity-60"
                            >
                                {loading
                                    ? <span className="loading loading-spinner loading-xs" />
                                    : <><FiSend size={14} /> {t("submit")}</>
                                }
                            </button>

                        </form>
                    )}
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <h2 className="text-lg font-black text-base-content">
                        {t("patientReviews")}
                        <span className="text-sm font-normal text-base-content/40 ml-2">
                            ({number(reviews.length)})
                        </span>
                    </h2>

                    {reviews.length === 0 ? (
                        <div className="bg-base-100 border border-base-300 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center">
                                <FiStar size={22} className="text-base-content/20" />
                            </div>
                            <p className="text-sm font-semibold text-base-content/50">{t("none")}</p>
                            <p className="text-xs text-base-content/40">{t("beFirst")}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {reviews.map((review, i) => (
                                <div
                                    key={i}
                                    className="bg-base-100 border border-base-300 rounded-2xl p-5 flex flex-col gap-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0">
                                                {review.userName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-base-content">{review.userName}</p>
                                                <p className="text-xs text-base-content/40">
                                                    {new Date(review.date).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <StarDisplay rating={review.rating} />
                                    </div>

                                    <p className="text-sm text-base-content/65 leading-relaxed">
                                        {review.comment}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ReviewSection;