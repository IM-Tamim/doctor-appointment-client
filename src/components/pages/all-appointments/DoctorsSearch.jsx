"use client";
import { useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import DoctorCard from "@/components/ui/DoctorCard";
import Pagination from "@/components/shared/Pagination";

const PAGE_SIZE = 8;
const ALL = "All";

const DoctorsSearch = ({ doctors }) => {
    const [search, setSearch] = useState("");
    const [specialty, setSpecialty] = useState(ALL);
    const [page, setPage] = useState(1);

    const specialties = useMemo(
        () => [ALL, ...Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean))).sort()],
        [doctors]
    );

    // The hero and the README both advertise search "by name or specialty",
    // so match against specialty and hospital too — not just the name.
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return doctors.filter((doc) => {
            if (specialty !== ALL && doc.specialty !== specialty) return false;
            if (!q) return true;
            return [doc.name, doc.specialty, doc.hospital, doc.location]
                .some((field) => (field || "").toLowerCase().includes(q));
        });
    }, [doctors, search, specialty]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const reset = () => {
        setSearch("");
        setSpecialty(ALL);
        setPage(1);
    };

    return (
        <>
            <div className="max-w-xl mx-auto relative">
                <FiSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                    size={16}
                />
                <input
                    type="search"
                    placeholder="Search by name, specialty, or hospital..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    aria-label="Search doctors"
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm bg-base-100 border border-base-300 text-base-content outline-none shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
                {search && (
                    <button
                        onClick={() => { setSearch(""); setPage(1); }}
                        aria-label="Clear search"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-primary transition-colors"
                    >
                        <FiX size={16} />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-5">
                {specialties.map((s) => {
                    const active = s === specialty;
                    return (
                        <button
                            key={s}
                            onClick={() => { setSpecialty(s); setPage(1); }}
                            aria-pressed={active}
                            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                                active
                                    ? "bg-primary text-primary-content border-primary shadow-sm shadow-primary/25"
                                    : "bg-base-100 text-base-content/60 border-base-300 hover:border-primary/50 hover:text-primary"
                            }`}
                        >
                            {s}
                        </button>
                    );
                })}
            </div>

            <p className="text-xs text-base-content/45 mt-5 text-center">
                {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found
            </p>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
                        <FiSearch size={24} className="text-base-content/30" />
                    </div>
                    <p className="text-base font-semibold text-base-content/60">No doctors found</p>
                    <p className="text-sm text-base-content/40">
                        Try a different name, specialty, or clear the filters.
                    </p>
                    <button onClick={reset} className="btn btn-sm btn-primary btn-outline rounded-lg mt-2">
                        Clear Filters
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                        {paginated.map((doctor, i) => (
                            <DoctorCard key={doctor._id} doctor={doctor} priority={i < 4} />
                        ))}
                    </div>
                    <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                </>
            )}
        </>
    );
};

export default DoctorsSearch;
