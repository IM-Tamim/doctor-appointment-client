'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavLink = ({ href, children, matchPaths = [] }) => {
    const pathname = usePathname();
    const allMatches = [href, ...matchPaths];
    const isActive = allMatches.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );

    return (
        <Link
            href={href}
            className={`${isActive ? "font-semibold border-b-2 border-primary text-primary" : "text-base-content hover:text-primary transition-colors"}`}
        >
            {children}
        </Link>
    );
};

export default NavLink;