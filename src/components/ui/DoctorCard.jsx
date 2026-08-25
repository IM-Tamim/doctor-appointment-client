"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FiMapPin, FiClock, FiStar, FiUser, FiArrowRight } from "react-icons/fi";
import { MdOutlineLocalHospital } from "react-icons/md";

const DoctorCard = ({ doctor, priority = false }) => {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [imgFailed, setImgFailed] = useState(false);

    const handleViewDetails = () => {
        router.push(session ? `/doctors/${doctor._id}` : "/signin");
    };

    // next/image ignores a mutated `src` on the DOM node, so the fallback has to
    // be driven by state rather than by reassigning e.target.src.
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        doctor.name
    )}&background=0e9080&color=fff&size=400&bold=true`;

    const slots = (doctor.availability || [])
        .flatMap((d) => (d.slots || []).map((s) => `${d.day.slice(0, 3)} ${s}`))
        .slice(0, 2);

    return (
        <div className="reveal card-lift bg-base-100 rounded-2xl border border-base-300 overflow-hidden flex flex-col group">

            <div className="relative h-56 overflow-hidden bg-base-200">
                <Image
                    src={imgFailed ? fallback : doctor.image}
                    alt={`Portrait of ${doctor.name}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={priority}
                    className="object-cover object-top group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                    onError={() => setImgFailed(true)}
                />

                {/* Bottom scrim keeps the badges legible over light photos. */}
                <div
                    className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-base-100/80 to-transparent pointer-events-none"
                    aria-hidden="true"
                />

                <span className="absolute top-3 left-3 bg-primary text-primary-content text-xs font-semibold px-3 py-1 rounded-full z-10 shadow-sm">
                    {doctor.specialty}
                </span>

                <span className="absolute top-3 right-3 bg-base-100/90 backdrop-blur-sm text-base-content text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm">
                    <FiStar size={11} className="text-warning fill-warning" />
                    {doctor.rating ?? "—"}
                </span>
            </div>

            <div className="p-5 flex flex-col flex-1 gap-3">

                <div>
                    <h3 className="font-bold text-base text-base-content leading-tight group-hover:text-primary transition-colors duration-300">
                        {doctor.name}
                    </h3>
                    <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                        <FiUser size={11} className="shrink-0" />
                        {doctor.experience ? `${doctor.experience} experience` : "New on DocAppoint"}
                        {" · "}
                        {doctor.totalReviews || 0} reviews
                    </p>
                </div>

                <p className="text-xs text-base-content/60 flex items-start gap-1.5">
                    <MdOutlineLocalHospital size={13} className="mt-0.5 shrink-0 text-primary" />
                    {doctor.hospital}
                </p>

                {doctor.location && (
                    <p className="text-xs text-base-content/60 flex items-center gap-1.5">
                        <FiMapPin size={11} className="shrink-0 text-primary" />
                        {doctor.location}
                    </p>
                )}

                {slots.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {slots.map((slot, i) => (
                            <span
                                key={i}
                                className="text-[11px] text-base-content/70 bg-base-200 border border-base-300 rounded-lg px-2 py-1 flex items-center gap-1"
                            >
                                <FiClock size={10} className="shrink-0 text-primary" />
                                {slot}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-base-300 mt-auto">
                    <span className="text-sm font-bold text-primary">
                        ৳ {doctor.fee}
                        <span className="text-xs font-normal text-base-content/40"> /visit</span>
                    </span>
                    <button
                        onClick={handleViewDetails}
                        className="btn btn-sm btn-primary btn-outline rounded-lg text-xs font-semibold gap-1 group/btn"
                    >
                        View Details
                        <FiArrowRight
                            size={12}
                            className="group-hover/btn:translate-x-0.5 transition-transform"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorCard;
