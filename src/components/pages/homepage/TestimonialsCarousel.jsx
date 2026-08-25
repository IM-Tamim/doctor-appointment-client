"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { FiStar } from "react-icons/fi";

const StarDisplay = ({ rating }) => (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((s) => (
            <FiStar
                key={s}
                size={13}
                className={s <= rating ? "text-warning fill-warning" : "text-base-300"}
            />
        ))}
    </div>
);

/**
 * Only the carousel is a client component. The reviews themselves are fetched
 * and filtered on the server (see PatientTestimonials) so the browser never
 * downloads the full doctor list just to render a few quotes.
 */
const TestimonialsCarousel = ({ reviews }) => (
    <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={reviews.length > 3}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        className="!pb-12"
    >
        {reviews.map((review, i) => (
            <SwiperSlide key={i} className="!h-auto">
                <div className="card-lift bg-base-100 border border-base-300 rounded-2xl p-6 flex flex-col gap-4 h-full">
                    <StarDisplay rating={review.rating} />

                    <p className="text-sm text-base-content/65 leading-relaxed flex-1">
                        &ldquo;{review.comment}&rdquo;
                    </p>

                    <div className="flex items-center gap-3 pt-3 border-t border-base-300">
                        <div className="w-10 h-10 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0">
                            {review.userName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-base-content truncate">
                                {review.userName}
                            </p>
                            <p className="text-xs text-base-content/45 truncate">
                                Patient of {review.doctorName}
                            </p>
                        </div>
                    </div>
                </div>
            </SwiperSlide>
        ))}
    </Swiper>
);

export default TestimonialsCarousel;
