import { FiShield, FiClock, FiAward, FiHeadphones, FiCalendar, FiUsers } from "react-icons/fi";

const features = [
    {
        icon: FiShield,
        title: "Verified Doctors",
        desc: "Every doctor on our platform is thoroughly verified, licensed, and background-checked for your safety.",
    },
    {
        icon: FiClock,
        title: "24/7 Availability",
        desc: "Book appointments any time of the day or night. Our platform never sleeps so your health doesn't wait.",
    },
    {
        icon: FiAward,
        title: "Top Rated Specialists",
        desc: "We feature only the highest-rated specialists based on real patient reviews and clinical excellence.",
    },
    {
        icon: FiCalendar,
        title: "Easy Scheduling",
        desc: "Pick your preferred date and time slot in seconds. Reschedule or cancel anytime from your dashboard.",
    },
    {
        icon: FiHeadphones,
        title: "Dedicated Support",
        desc: "Our support team is always ready to help you with bookings, queries, and any healthcare concerns.",
    },
    {
        icon: FiUsers,
        title: "Patient Community",
        desc: "Join thousands of patients who trust DocAppoint for their healthcare needs every single day.",
    },
];

const WhyChooseUs = () => {
    return (
        <section className="bg-base-200/40 py-20">
            <div className="max-w-7xl mx-auto px-4">

                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                        Why DocAppoint
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-base-content">
                        Why <span className="text-primary">Choose Us</span>
                    </h2>
                    <p className="text-sm text-base-content/60 mt-2 max-w-md mx-auto">
                        We are committed to making healthcare accessible, reliable, and stress-free for everyone.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className={`reveal card-lift bg-base-100 border border-base-300 rounded-2xl p-6 flex flex-col gap-4 group delay-${(i % 3) + 1}`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:ring-primary transition-all duration-300 shrink-0">
                                    <Icon size={20} className="text-primary group-hover:text-primary-content transition-colors duration-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-base-content mb-1">{feature.title}</h3>
                                    <p className="text-sm text-base-content/55 leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default WhyChooseUs;