import Link from "next/link";
import { FiArrowRight, FiSearch, FiCalendar, FiCheckCircle, FiShield } from "react-icons/fi";
import { getAllDoctorsCached } from "@/lib/doctors";

const steps = [
    {
        icon: FiSearch,
        title: "Find a Doctor",
        desc: "Browse specialists by name or specialty from our verified doctor list.",
    },
    {
        icon: FiCalendar,
        title: "Book Appointment",
        desc: "Pick a convenient time slot and fill in your details in seconds.",
    },
    {
        icon: FiCheckCircle,
        title: "Get Confirmed",
        desc: "Receive instant confirmation and visit your doctor stress-free.",
    },
];

const HeroBanner = async () => {
    const doctors = await getAllDoctorsCached();

    const totalDoctors = doctors.length;
    const totalReviews = doctors.reduce((sum, d) => sum + (d.totalReviews || 0), 0);
    const specialties = new Set(doctors.map((d) => d.specialty)).size;
    // getAllDoctors() fails soft to [] when the API is down — without this guard
    // the average is 0/0 and the stat renders a literal "NaN★".
    const avgRating = totalDoctors
        ? (doctors.reduce((sum, d) => sum + (d.rating || 0), 0) / totalDoctors).toFixed(1)
        : null;

    const stats = [
        { value: `${totalDoctors}+`, label: "Doctors" },
        { value: `${totalReviews.toLocaleString()}+`, label: "Patient Reviews" },
        { value: avgRating ? `${avgRating}★` : "—", label: "Avg Rating" },
        { value: `${specialties}+`, label: "Specialties" },
    ];

    return (
        <section className="relative bg-base-100 overflow-hidden brand-glow">
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="absolute -top-40 -right-24 w-[30rem] h-[30rem] rounded-full bg-primary/10 blur-3xl animate-float" />
                <div
                    className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-secondary/10 blur-3xl animate-float"
                    style={{ animationDelay: "-3s" }}
                />

                {/* Heartbeat trace. One path, one animated property
                    (stroke-dashoffset) — stays on the compositor. */}
                <svg
                    className="absolute inset-x-0 bottom-8 w-full h-24 opacity-[0.18]"
                    viewBox="0 0 1400 100"
                    preserveAspectRatio="none"
                    fill="none"
                >
                    <path
                        className="ecg-line"
                        d="M0 50 H420 l18 -34 l16 60 l14 -46 l16 20 H700 l18 -30 l16 54 l14 -42 l16 18 H1400"
                        stroke="var(--color-primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    <div className="flex-1 text-center lg:text-left">

                        <span className="animate-fade-up inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 ring-1 ring-primary/20 px-4 py-1.5 rounded-full mb-6">
                            <span className="relative flex w-1.5 h-1.5">
                                <span className="absolute inline-flex w-full h-full rounded-full bg-primary animate-pulse-ring" />
                                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
                            </span>
                            Trusted Healthcare Platform
                        </span>

                        <h1 className="animate-fade-up delay-1 text-4xl md:text-5xl lg:text-6xl font-black text-base-content leading-[1.08]">
                            Your Health, <br className="hidden sm:block" />
                            Our{" "}
                            <span className="relative inline-block text-gradient">
                                Priority
                                <svg
                                    className="absolute -bottom-2 left-0 w-full"
                                    viewBox="0 0 200 8"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M0 6 Q50 0 100 4 Q150 8 200 3"
                                        stroke="var(--color-primary)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        fill="none"
                                        opacity="0.55"
                                    />
                                </svg>
                            </span>
                        </h1>

                        <p className="animate-fade-up delay-2 mt-7 text-base md:text-lg text-base-content/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Connect with top-rated doctors across all specialties. Skip the waiting
                            room — schedule your visit in seconds and get the care you deserve.
                        </p>

                        <div className="animate-fade-up delay-3 mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                            <Link
                                href="/all-appointments"
                                className="btn btn-primary rounded-xl font-bold gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Book Appointment <FiArrowRight size={16} />
                            </Link>
                        </div>

                        <p className="animate-fade-up delay-4 mt-6 flex items-center gap-2 justify-center lg:justify-start text-xs text-base-content/45">
                            <FiShield size={13} className="text-primary shrink-0" />
                            Every doctor is admin-verified before they can accept bookings.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
                            {stats.map((stat, i) => (
                                <div
                                    key={stat.label}
                                    className={`animate-fade-up delay-${i + 3} bg-base-100/70 backdrop-blur-sm border border-base-300 rounded-2xl px-3 py-4 flex flex-col items-center lg:items-start gap-0.5 card-lift`}
                                >
                                    <p className="text-xl md:text-2xl font-black text-primary tabular-nums">
                                        {stat.value}
                                    </p>
                                    <p className="text-xs text-base-content/50">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="animate-fade-up delay-3 flex-1 w-full max-w-md">
                        <div className="bg-base-100/80 backdrop-blur-sm border border-base-300 rounded-3xl p-6 md:p-7 shadow-xl shadow-base-content/5">

                            <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-6">
                                How It Works
                            </p>

                            <div className="flex flex-col">
                                {steps.map((step, i) => {
                                    const Icon = step.icon;
                                    const isLast = i === steps.length - 1;
                                    return (
                                        <div key={step.title} className="flex gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:ring-primary transition-colors duration-300">
                                                    <Icon
                                                        size={18}
                                                        className="text-primary group-hover:text-primary-content transition-colors duration-300"
                                                    />
                                                </div>
                                                {!isLast && <div className="w-px flex-1 bg-base-300 my-2" />}
                                            </div>

                                            <div className={isLast ? "pb-0" : "pb-7"}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-black text-primary/40 tabular-nums">
                                                        0{i + 1}
                                                    </span>
                                                    <p className="font-bold text-sm text-base-content">
                                                        {step.title}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-base-content/50 leading-relaxed">
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* No CTA here on purpose — the hero already has one
                                "Book Appointment" button and a second link to the
                                same page just split the user's attention. */}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default HeroBanner;
