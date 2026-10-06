import Link from "next/link";
import { getDoctorStatsCached } from "@/lib/doctors";
import { getTranslations } from "next-intl/server";
import {
    FaHeartbeat, FaTooth, FaBrain, FaBaby, FaBone,
    FaStethoscope, FaEye, FaUserMd, FaFemale, FaAllergies,
    FaAssistiveListeningSystems, FaLungs, FaVial, FaRibbon, FaHeadSideVirus,
} from "react-icons/fa";
import { GiKidneys, GiStomach } from "react-icons/gi";

const ICONS = {
    Cardiology: FaHeartbeat,
    Dentistry: FaTooth,
    Neurology: FaBrain,
    Pediatrics: FaBaby,
    Orthopedics: FaBone,
    "General Medicine": FaStethoscope,
    ENT: FaAssistiveListeningSystems,
    Ophthalmology: FaEye,
    Psychiatry: FaHeadSideVirus,
    Pulmonology: FaLungs,
    Endocrinology: FaVial,
    Oncology: FaRibbon,
    Nephrology: GiKidneys,
    Urology: GiKidneys,
    Gastroenterology: GiStomach,
    Gynecology: FaFemale,
    Dermatology: FaAllergies,
};

const SpecialtyMarquee = async () => {
    const { specialties } = await getDoctorStatsCached();
    const t = await getTranslations("home");
    const ts = await getTranslations("common.specialties");
    const items = specialties.map((s) => [s.name, s.count]);

    if (items.length === 0) return null;

    // The track holds the list twice so translating it exactly -50% lands on the
    // duplicate — the loop is seamless with no JS and no scroll listener.
    const loop = [...items, ...items];

    return (
        <section className="bg-base-100 border-y border-base-300 py-7">
            <div className="max-w-7xl mx-auto px-4 mb-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
                    {t("browseSpecialty")}
                </p>
            </div>

            <div className="marquee-viewport overflow-hidden">
                <div className="marquee-track gap-3">
                    {loop.map(([name, count], i) => {
                        const Icon = ICONS[name] || FaUserMd;
                        return (
                            <Link
                                key={`${name}-${i}`}
                                href={`/all-appointments?specialty=${encodeURIComponent(name)}`}
                                aria-hidden={i >= items.length}
                                tabIndex={i >= items.length ? -1 : 0}
                                className="shrink-0 flex items-center gap-2.5 bg-base-200/70 hover:bg-primary/10 border border-base-300 hover:border-primary/40 rounded-full pl-4 pr-5 py-2.5 transition-colors duration-300 group"
                            >
                                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-300">
                                    <Icon
                                        size={14}
                                        className="text-primary group-hover:text-primary-content transition-colors duration-300"
                                    />
                                </span>
                                <span className="text-sm font-semibold text-base-content whitespace-nowrap">
                                    {ts.has(name) ? ts(name) : name}
                                </span>
                                <span className="text-xs font-bold text-base-content/40 tabular-nums">
                                    {count}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default SpecialtyMarquee;
