"use client";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ page, totalPages, onChange }) => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
    );

    return (
        <div className="flex items-center justify-center gap-1 mt-8">
            <button
                onClick={() => onChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-sm btn-ghost btn-circle disabled:opacity-30"
            >
                <FiChevronLeft size={16} />
            </button>

            {pages.map((p, i) => (
                <span key={p} className="flex items-center">
                    {i > 0 && p - pages[i - 1] > 1 && (
                        <span className="px-1 text-base-content/30">…</span>
                    )}
                    <button
                        onClick={() => onChange(p)}
                        className={`btn btn-sm btn-circle ${p === page ? "btn-primary" : "btn-ghost"}`}
                    >
                        {p}
                    </button>
                </span>
            ))}

            <button
                onClick={() => onChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn btn-sm btn-ghost btn-circle disabled:opacity-30"
            >
                <FiChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;
