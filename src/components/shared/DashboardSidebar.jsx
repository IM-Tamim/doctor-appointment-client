"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Avatar from "./Avatar";
import toast from "react-hot-toast";
import {
    FaUserMd,
    FaCalendarCheck,
    FaClock,
    FaUserEdit,
    FaUsers,
    FaChartBar,
    FaStethoscope,
    FaHome,
    FaHospital,
    FaHeart,
    FaUsers as FaFamily,
    FaMoneyBillWave,
} from "react-icons/fa";
import { FiX, FiLogOut, FiSearch } from "react-icons/fi";
import { hardSignOut } from "@/lib/hardSignOut";
import { useTranslations } from "next-intl";

const NAV_ITEMS = {
    patient: [
        { href: "/dashboard/patient", label: "myBookings", icon: FaCalendarCheck },
        { href: "/dashboard/patient/saved", label: "savedDoctors", icon: FaHeart },
        { href: "/dashboard/patient/family", label: "family", icon: FaFamily },
        { href: "/dashboard/patient/profile", label: "myProfile", icon: FaUserEdit },
        { href: "/dashboard/patient/become-doctor", label: "becomeDoctor", icon: FaStethoscope },
    ],
    doctor: [
        { href: "/dashboard/doctor/appointments", label: "appointments", icon: FaCalendarCheck },
        { href: "/dashboard/doctor/availability", label: "schedule", icon: FaClock },
        { href: "/dashboard/doctor/profile", label: "myProfile", icon: FaUserEdit },
    ],
    admin: [
        { href: "/dashboard/admin/overview", label: "overview", icon: FaChartBar },
        { href: "/dashboard/admin/doctors", label: "approvals", icon: FaUserMd },
        { href: "/dashboard/admin/hospitals", label: "hospitals", icon: FaHospital },
        { href: "/dashboard/admin/payments", label: "payments", icon: FaMoneyBillWave },
        { href: "/dashboard/admin/users", label: "users", icon: FaUsers },
    ],
    hospital_admin: [
        { href: "/dashboard/hospital", label: "myHospital", icon: FaHospital },
    ],
};


const SidebarContent = ({ role, user, onClose, variant = "desktop" }) => {
    const pathname = usePathname();
    const router = useRouter();
    const items = NAV_ITEMS[role] || [];
    const t = useTranslations("sidebar");
    const tn = useTranslations("nav");

    const handleLogout = async () => {
        toast.success(tn("loggedOut"));
        await hardSignOut("/home");
    };

    return (
        <>
            <div className="p-6 border-b border-base-300">
                <div className="flex items-center gap-3">
                    <Avatar src={user?.image} name={user?.name} size="lg" />
                    <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{user?.name || "User"}</p>
                        <p className="text-xs text-base-content/50">{t.has(`roles.${role}`) ? t(`roles.${role}`) : role}</p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="btn btn-ghost btn-xs btn-circle shrink-0"
                            aria-label={t("closeMenu")}
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="px-4 text-[10px] font-bold tracking-wider text-base-content/35 uppercase mb-2">
                    {t("menu")}
                </p>
                {items.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                active
                                    ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                                    : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                            }`}
                        >
                            <Icon size={15} className="shrink-0" />
                            <span className="truncate">{t(label)}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-base-300 space-y-1">
                {/* On mobile the navbar hides its own menu inside the dashboard
                    (two hamburgers looked broken), so the site links live here
                    instead — nothing is lost by hiding that dropdown. */}
                {variant === "mobile" && (
                    <>
                        <p className="px-4 text-[10px] font-bold tracking-wider text-base-content/35 uppercase mb-2">
                            {t("site")}
                        </p>
                        <Link
                            href="/home"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all"
                        >
                            <FaHome size={14} className="shrink-0" />
                            {tn("home")}
                        </Link>
                        <Link
                            href="/all-appointments"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all"
                        >
                            <FiSearch size={14} className="shrink-0" />
                            {tn("doctors")}
                        </Link>
                        <Link
                            href="/hospitals"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all"
                        >
                            <FaHospital size={14} className="shrink-0" />
                            {tn("hospitals")}
                        </Link>
                        <div className="h-px bg-base-300 my-2" />
                    </>
                )}

                {variant !== "mobile" && (
                    <Link
                        href="/home"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-base-content/60 hover:bg-base-200 hover:text-base-content transition-all"
                    >
                        <FaHome size={14} className="shrink-0" />
                        {t("backToSite")}
                    </Link>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all"
                >
                    <FiLogOut size={14} className="shrink-0" />
                    {tn("logout")}
                </button>
            </div>
        </>
    );
};

const DashboardSidebar = ({ role, user, variant = "desktop", onClose }) => {
    if (variant === "mobile") {
        return (
            <aside className="w-72 h-full bg-base-100 flex flex-col shadow-2xl">
                <SidebarContent role={role} user={user} onClose={onClose} variant="mobile" />
            </aside>
        );
    }

    return (
        <aside className="w-64 hidden lg:flex flex-col bg-base-100 border-r border-base-300 sticky top-0 h-screen">
            <SidebarContent role={role} user={user} />
        </aside>
    );
};

export default DashboardSidebar;
