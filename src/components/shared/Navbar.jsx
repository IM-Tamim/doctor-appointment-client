'use client'
import { useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavLink from "./NavLink";
import Avatar from "./Avatar";
import toast from "react-hot-toast";
import Logo from "./Logo";
import ThemeController from "./ThemeController";
import NotificationBell from "./NotificationBell";
import { hardSignOut } from "@/lib/hardSignOut";

const DASHBOARD_PATH = {
    patient: "/dashboard/patient",
    doctor: "/dashboard/doctor/appointments",
    admin: "/dashboard/admin/overview",
};

const PROFILE_PATH = {
    patient: "/dashboard/patient/profile",
    doctor: "/dashboard/doctor/profile",
    admin: "/dashboard/admin/overview",
};

// false on the server AND on the hydration render, true from the next paint on.
// Without this, the server renders the pending spinner while the client already
// knows the session, and React throws a hydration mismatch on every page load.
const subscribeNoop = () => () => {};
const useMounted = () =>
    useSyncExternalStore(subscribeNoop, () => true, () => false);

const Navbar = () => {
    const { data: session, isPending } = authClient.useSession();
    const mounted = useMounted();
    const pathname = usePathname();
    const user = session?.user;
    const isDashboard = (pathname || "").startsWith("/dashboard");
    const dashboardHref = DASHBOARD_PATH[user?.role] || "/dashboard/patient";
    const profileHref = PROFILE_PATH[user?.role] || "/dashboard/patient/profile";

    const links = <>
        <li><NavLink href="/home">Home</NavLink></li>
        <li><NavLink href="/all-appointments">All Appointment</NavLink></li>
        {user && <li><NavLink href={dashboardHref}>Dashboard</NavLink></li>}
    </>

    const handleLogout = async () => {
        toast.success("Logged out successfully!");
        await hardSignOut("/home");
    };

    return (
        <div className="sticky top-0 z-50 backdrop-blur-md bg-base-100/85 border-b border-base-300 shadow-lg">
            <div className="navbar max-w-7xl mx-auto">
                <div className="navbar-start gap-1">
                    {/* Inside /dashboard the layout renders its own drawer toggle,
                        so showing this one too stacked two hamburgers on mobile. */}
                    <div className={`dropdown ${isDashboard ? "hidden" : ""}`}>
                        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden text-base-content/70">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                            </svg>
                        </div>
                        <ul
                            tabIndex="-1"
                            className="menu menu-sm dropdown-content rounded-box z-50 mt-3 w-52 p-2 shadow-xl bg-base-200 border border-primary/15"
                        >
                            {links}
                        </ul>
                    </div>
                    <div className="text-lg lg:text-xl font-black tracking-tight flex items-center gap-1.5">
                        <Logo size={32} className="shrink-0 lg:w-9 lg:h-9" />
                        <Link href={'/home'} className="font-bold">
                            <span className="text-base-content">Doc</span><span className="text-primary">Appoint</span>
                        </Link>
                    </div>
                </div>

                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1">
                        {links}
                    </ul>
                </div>

                <div className="navbar-end gap-3">
                    <ThemeController />
                    {mounted && user && <NotificationBell />}

                    {!mounted || isPending ? (
                        <span className="loading loading-spinner loading-sm text-primary"></span>
                    ) : user ? (
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle p-0">
                                <Avatar src={user.image} name={user.name} size="md" />
                            </div>
                            <ul
                                tabIndex={-1}
                                className="dropdown-content menu z-50 mt-3 w-60 rounded-box bg-base-100 border border-base-300 shadow-xl p-2"
                            >
                                <li className="px-3 py-2 pointer-events-none">
                                    <div className="flex flex-col items-start gap-0 !bg-transparent !p-0">
                                        <span className="text-sm font-bold text-base-content truncate w-full">{user.name}</span>
                                        <span className="text-xs text-base-content/50 truncate w-full">{user.email}</span>
                                    </div>
                                </li>
                                <div className="divider my-0.5" />
                                <li>
                                    <Link href={profileHref} className="text-sm font-medium">
                                        My Profile
                                    </Link>
                                </li>
                                <li>
                                    <Link href={dashboardHref} className="text-sm font-medium">
                                        Dashboard
                                    </Link>
                                </li>
                                <div className="divider my-0.5" />
                                <li>
                                    <button onClick={handleLogout} className="text-sm font-medium text-error">
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/signin"
                                className="btn btn-sm btn-primary rounded-lg text-sm font-medium"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="btn btn-sm btn-primary btn-soft rounded-lg text-sm font-bold"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
