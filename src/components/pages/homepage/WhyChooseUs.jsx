import { FiShield, FiClock, FiAward, FiHeadphones, FiCalendar, FiUsers } from "react-icons/fi";
import { getTranslations } from "next-intl/server";

const features = [
    {
        icon: FiShield,
        key: "verified",
    },
    {
        icon: FiClock,
        key: "allDay",
    },
    {
        icon: FiAward,
        key: "topRated",
    },
    {
        icon: FiCalendar,
        key: "easy",
    },
    {
        icon: FiHeadphones,
        key: "support",
    },
    {
        icon: FiUsers,
        key: "community",
    },
];

const WhyChooseUs = async () => {
    const t = await getTranslations("home");
    return (
        <section className="bg-base-200/40 py-20">
            <div className="max-w-7xl mx-auto px-4">

                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                        {t("whyEyebrow")}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-base-content">
                        {t("whyTitle1")} <span className="text-primary">{t("whyTitle2")}</span>
                    </h2>
                    <p className="text-sm text-base-content/60 mt-2 max-w-md mx-auto">
                        {t("whyText")}
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.key}
                                className={`reveal card-lift bg-base-100 border border-base-300 rounded-2xl p-6 flex flex-col gap-4 group delay-${(i % 3) + 1}`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:ring-primary transition-all duration-300 shrink-0">
                                    <Icon size={20} className="text-primary group-hover:text-primary-content transition-colors duration-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-base-content mb-1">{t(`features.${feature.key}.title`)}</h3>
                                    <p className="text-sm text-base-content/55 leading-relaxed">{t(`features.${feature.key}.desc`)}</p>
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