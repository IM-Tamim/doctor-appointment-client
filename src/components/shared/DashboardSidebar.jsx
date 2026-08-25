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
} from "react-icons/fa";
import { FiX, FiLogOut, FiSearch } from "react-icons/fi";
import { hardSignOut } from "@/lib/hardSignOut";

const NAV_ITEMS = {
    patient: [
        { href: "/dashboard/patient", label: "My Bookings", icon: FaCalendarCheck },
        { href: "/dashboard/patient/profile", label: "My Profile", icon: FaUserEdit },
        { href: "/dashboard/patient/become-doctor", label: "Become a Doctor", icon: FaStethoscope },
    ],
    doctor: [
        { href: "/dashboard/doctor/appointments", label: "Appointments", icon: FaCalendarCheck },
        { href: "/dashboard/doctor/availability", label: "Availability", icon: FaClock },
        { href: "/dashboard/doctor/profile", label: "My Profile", icon: FaUserEdit },
    ],
    admin: [
        { href: "/dashboard/admin/overview", label: "Overview", icon: FaChartBar },
        { href: "/dashboard/admin/doctors", label: "Doctor Approvals", icon: FaUserMd },
        { href: "/dashboard/admin/users", label: "Manage Users", icon: FaUsers },
    ],
};

const ROLE_LABEL = { patient: "Patient", doctor: "Doctor", admin: "Administrator" };

const SidebarContent = ({ role, user, onClose, variant = "desktop" }) => {
    const pathname = usePathname();
    const router = useRouter();
    const items = NAV_ITEMS[role] || [];

    const handleLogout = async () => {
        toast.success("Logged out successfully!");
        await hardSignOut("/home");
    };

    return (
        <>
            <div className="p-6 border-b border-base-300">
                <div className="flex items-center gap-3">
                    <Avatar src={user?.image} name={user?.name} size="lg" />
                    <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{user?.name || "User"}</p>
                        <p className="text-xs text-base-content/50">{ROLE_LABEL[role] || role}</p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="btn btn-ghost btn-xs btn-circle shrink-0"
                            aria-label="Close menu"
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="px-4 text-[10px] font-bold tracking-wider text-base-content/35 uppercase mb-2">
                    Menu
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
                            <span className="truncate">{label}</span>
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
                            Site
                        </p>
                        <Link
                            href="/home"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all"
                        >
                            <FaHome size={14} className="shrink-0" />
                            Home
                        </Link>
                        <Link
                            href="/all-appointments"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all"
                        >
                            <FiSearch size={14} className="shrink-0" />
                            All Appointment
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
                        Back to Site
                    </Link>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all"
                >
                    <FiLogOut size={14} className="shrink-0" />
                    Logout
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
