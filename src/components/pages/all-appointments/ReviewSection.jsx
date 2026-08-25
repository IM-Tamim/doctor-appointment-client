"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { addReview } from "@/lib/doctors";
import toast from "react-hot-toast";
import { FiStar, FiSend } from "react-icons/fi";

const StarPicker = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
            <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
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
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState(doctor.reviews || []);
    const [liveRating, setLiveRating] = useState(doctor.rating);
    const [liveTotalReviews, setLiveTotalReviews] = useState(doctor.totalReviews);
    const { data: session } = authClient.useSession();

    const user = session?.user;

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please login to submit a review.");
            return;
        }
        if (rating === 0) {
            toast.error("Please select a star rating.");
            return;
        }

        setLoading(true);

        // Only the rating and comment go over the wire — the server takes the
        // reviewer's identity from the JWT so it can't be spoofed.
        const reviewData = { rating, comment };

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
            // Mirror the server's running mean rather than the old halving formula.
            setLiveTotalReviews((prevTotal) => {
                const nextTotal = prevTotal + 1;
                setLiveRating(parseFloat((((liveRating * prevTotal) + rating) / nextTotal).toFixed(1)));
                return nextTotal;
            });
            toast.success("Review submitted successfully!");
            setRating(0);
            setComment("");
        } catch {
            toast.error("Failed to submit review.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 pb-10">

            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 mb-6 flex items-center gap-4">
                <div className="text-center px-6 border-r border-base-300">
                    <p className="text-4xl font-black text-primary">{liveRating}</p>
                    <StarDisplay rating={Math.round(liveRating)} />
                    <p className="text-xs text-base-content/40 mt-1">{liveTotalReviews} reviews</p>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-base-content">Overall Rating</p>
                    <p className="text-xs text-base-content/50 mt-1 leading-relaxed">
                        Based on {liveTotalReviews} patient review{liveTotalReviews !== 1 ? "s" : ""}. Rating updates instantly after each review.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="bg-base-100 border border-base-300 rounded-2xl p-6 flex flex-col gap-4 h-fit">
                    <h2 className="text-lg font-black text-base-content">Leave a Review</h2>

                    {!user ? (
                        <p className="text-sm text-base-content/50">
                            Please{" "}
                            <a href="/signin" className="text-primary font-semibold hover:underline">
                                login
                            </a>{" "}
                            to leave a review.
                        </p>
                    ) : (
                        <form onSubmit={onSubmit} className="flex flex-col gap-4">

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                    Your Rating
                                </label>
                                <StarPicker value={rating} onChange={setRating} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
                                    Your Review
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience with this doctor..."
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
                                    : <><FiSend size={14} /> Submit Review</>
                                }
                            </button>

                        </form>
                    )}
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <h2 className="text-lg font-black text-base-content">
                        Patient Reviews
                        <span className="text-sm font-normal text-base-content/40 ml-2">
                            ({reviews.length})
                        </span>
                    </h2>

                    {reviews.length === 0 ? (
                        <div className="bg-base-100 border border-base-300 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center">
                                <FiStar size={22} className="text-base-content/20" />
                            </div>
                            <p className="text-sm font-semibold text-base-content/50">No reviews yet</p>
                            <p className="text-xs text-base-content/40">Be the first to review this doctor.</p>
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
                                                    {new Date(review.date).toLocaleDateString("en-GB", {
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