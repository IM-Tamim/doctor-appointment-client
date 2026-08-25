import { getDoctorByIdCached } from "@/lib/doctors";
import { FiMapPin, FiClock, FiStar, FiUser, FiAward, FiCalendar, FiDollarSign } from "react-icons/fi";
import { MdOutlineLocalHospital } from "react-icons/md";
import Image from "next/image";
import BookingModal from "@/components/pages/all-appointments/BookingModal";
import ReviewSection from "@/components/pages/all-appointments/ReviewSection";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const generateMetadata = async ({ params }) => {
    const { id } = await params;
    const { token } = await auth.api.getToken({ headers: await headers() });
    const doctor = await getDoctorByIdCached(id, token);
    return {
        title: `${doctor.name} | DocAppoint`,
        description: doctor.bio,
    };
};

const DoctorDetailsPage = async ({ params }) => {
    const { id } = await params;
    const { token } = await auth.api.getToken({
        headers: await headers()
    });
    const doctor = await getDoctorByIdCached(id, token);

    return (
        <div className="min-h-screen bg-linear-to-br from-base-200 via-base-200 to-base-300">

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="bg-base-100 rounded-2xl border border-base-300 shadow-xl overflow-hidden">

                    <div className="h-1.5 bg-linear-to-r from-primary to-primary"></div>

                    <div className="p-6 md:p-8">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">

                            <div className="relative w-full lg:w-72 shrink-0">
                                <div className="relative w-full h-80 lg:h-72 rounded-2xl overflow-hidden border-2 border-base-300 shadow-lg group">
                                    <Image
                                        src={doctor.image}
                                        alt={doctor.name}
                                        fill
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                        Verified
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-5">

                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary px-4 py-1.5 rounded-full border border-primary/30">
                                            {doctor.specialty}
                                        </span>
                                        <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1">
                                            <FiAward size={12} />
                                            Top Rated
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-base-content leading-tight">
                                        {doctor.name}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-sm text-base-content/60 flex items-center gap-1">
                                            <FiUser size={12} />
                                            {doctor.experience || "Experience not listed"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl border border-base-300">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                            <MdOutlineLocalHospital size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-base-content/40 font-medium">Hospital</p>
                                            <p className="text-sm font-semibold text-base-content">{doctor.hospital}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl border border-base-300">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                            <FiMapPin size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-base-content/40 font-medium">Location</p>
                                            <p className="text-sm font-semibold text-base-content">{doctor.location || "Not specified"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FiClock size={14} className="text-primary" />
                                        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/60">Available Time Slots</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {(doctor.availability || []).filter((d) => d.slots?.length > 0).length === 0 ? (
                                            <p className="text-xs text-base-content/40">No availability set yet.</p>
                                        ) : (
                                            (doctor.availability || [])
                                                .filter((d) => d.slots?.length > 0)
                                                .map((d) => (
                                                    <div key={d.day} className="flex items-start gap-2">
                                                        <span className="text-xs font-bold text-base-content/70 w-20 shrink-0 pt-2">{d.day}</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {d.slots.map((s, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="text-xs flex items-center gap-1.5 bg-base-200 border border-base-300 px-3 py-2 rounded-lg text-base-content/70 font-medium hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                                                                >
                                                                    <FiClock size={10} className="text-primary" />
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-base-300 mt-2">
                                    <div>
                                        <p className="text-xs text-base-content/40 font-semibold uppercase tracking-wider">Consultation Fee</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-primary">৳{doctor.fee}</span>
                                            <span className="text-xs text-base-content/40">/ per visit</span>
                                        </div>
                                    </div>
                                    <BookingModal doctor={doctor} />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-base-100 rounded-2xl border border-base-300 shadow-lg overflow-hidden">
                    <div className="h-1 w-20 bg-primary"></div>
                    <div className="p-6 md:p-8">
                        <h2 className="text-xl font-black text-base-content mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary rounded-full"></span>
                            About the Doctor
                        </h2>
                        <p className="text-base-content/70 leading-relaxed">
                            {doctor.bio || "No bio provided yet."}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-base-100 rounded-xl border border-base-300 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <FiCalendar className="text-primary" size={18} />
                        </div>
                        <p className="text-xs text-base-content/40">Years of Experience</p>
                        <p className="text-lg font-bold text-base-content">{doctor.experience || "—"}</p>
                    </div>
                    <div className="bg-base-100 rounded-xl border border-base-300 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <FiStar className="text-primary fill-primary/20" size={18} />
                        </div>
                        <p className="text-xs text-base-content/40">Patient Rating</p>
                        <p className="text-lg font-bold text-base-content">{doctor.rating} / 5.0</p>
                    </div>
                    <div className="bg-base-100 rounded-xl border border-base-300 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <FiDollarSign className="text-primary" size={18} />
                        </div>
                        <p className="text-xs text-base-content/40">Consultation Fee</p>
                        <p className="text-lg font-bold text-primary">৳{doctor.fee}</p>
                    </div>
                </div>
            </div>

            <ReviewSection doctor={doctor} />
        </div>
    );
};

export default DoctorDetailsPage;