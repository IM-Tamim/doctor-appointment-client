import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getLocale, getTranslations } from "next-intl/server";
import { localNumber } from "@/lib/schedule";

/**
 * Pagination for server-rendered lists: plain links, so it works without
 * JavaScript and every page has its own URL. `hrefFor(page)` builds the link.
 */
const LinkPagination = async ({ page, totalPages, hrefFor, label }) => {
    if (totalPages <= 1) return null;
    const t = await getTranslations("search");
    const locale = await getLocale();

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
    );
    const arrow = "btn btn-sm btn-ghost btn-circle";

    return (
        <nav aria-label={label} className="flex items-center justify-center gap-1 mt-8">
            {page > 1 ? (
                <Link href={hrefFor(page - 1)} className={arrow} aria-label={t("prev")}>
                    <FiChevronLeft size={16} />
                </Link>
            ) : (
                <span className={`${arrow} opacity-30 pointer-events-none`} aria-hidden="true"><FiChevronLeft size={16} /></span>
            )}

            {pages.map((p, i) => (
                <span key={p} className="flex items-center">
                    {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-base-content/30">…</span>}
                    <Link
                        href={hrefFor(p)}
                        aria-current={p === page ? "page" : undefined}
                        className={`btn btn-sm btn-circle ${p === page ? "btn-primary" : "btn-ghost"}`}
                    >
                        {localNumber(p, locale)}
                    </Link>
                </span>
            ))}

            {page < totalPages ? (
                <Link href={hrefFor(page + 1)} className={arrow} aria-label={t("next")}>
                    <FiChevronRight size={16} />
                </Link>
            ) : (
                <span className={`${arrow} opacity-30 pointer-events-none`} aria-hidden="true"><FiChevronRight size={16} /></span>
            )}
        </nav>
    );
};

export default LinkPagination;
