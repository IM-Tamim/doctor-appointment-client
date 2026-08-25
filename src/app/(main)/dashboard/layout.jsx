"use client";
import { authClient } from "@/lib/auth-client";
import DashboardSidebar from "@/components/shared/DashboardSidebar";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiMenu } from "react-icons/fi";

const ROLE_SEGMENT = {
    patient: "patient",
    doctor: "doctor",
    admin: "admin",
};

const ROLE_LABEL = {
    patient: "Patient Dashboard",
    doctor: "Doctor Dashboard",
    admin: "Admin Dashboard",
};

const DashboardLayout = ({ children }) => {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close the mobile drawer whenever the route changes. Adjusting state
    // during render (React's documented pattern) instead of in an effect —
    // it avoids the extra commit + cascading re-render an effect would cause.
    const [lastPath, setLastPath] = useState(pathname);
    if (lastPath !== pathname) {
        setLastPath(pathname);
        setDrawerOpen(false);
    }

    useEffect(() => {
        if (isPending) return;

        if (!session) {
            router.replace(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        if (session.user.status === "suspended") {
            authClient.signOut().then(() => {
                toast.error("Your account has been suspended. Contact support.");
                router.replace("/signin");
            });
            return;
        }

        const role = session.user.role;
        const segment = pathname.split("/")[2]; // dashboard/<segment>/...

        if (segment && ROLE_SEGMENT[role] && segment !== ROLE_SEGMENT[role]) {
            router.replace(`/dashboard/${ROLE_SEGMENT[role]}`);
        }
    }, [session, isPending, pathname, router]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (!session) return null;

    const role = session.user.role;
    const segment = pathname.split("/")[2];
    if (segment && ROLE_SEGMENT[role] && segment !== ROLE_SEGMENT[role]) return null;

    return (
        <div className="min-h-screen bg-base-200">
            {/* Mobile dashboard bar. Sticks *below* the navbar (top-16), not at
                top-0 — both pinned to 0 meant they overlapped as soon as you
                scrolled. The navbar hides its own hamburger on /dashboard, so
                this is the only menu button on small screens. */}
            <div className="lg:hidden sticky top-16 z-30 bg-base-100/95 backdrop-blur-sm border-b border-base-300 px-4 py-2.5 flex items-center gap-2">
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="btn btn-ghost btn-sm btn-circle"
                    aria-label="Open dashboard menu"
                    aria-expanded={drawerOpen}
                >
                    <FiMenu size={18} />
                </button>
                <p className="text-sm font-bold">{ROLE_LABEL[role]}</p>
            </div>

            <div className="flex">
                {/* Desktop sidebar */}
                <DashboardSidebar role={role} user={session.user} variant="desktop" />

                {/* Mobile drawer overlay + panel */}
                {drawerOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 flex">
                        <div
                            className="fixed inset-0 bg-black/50"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <div className="relative z-10">
                            <DashboardSidebar
                                role={role}
                                user={session.user}
                                variant="mobile"
                                onClose={() => setDrawerOpen(false)}
                            />
                        </div>
                    </div>
                )}

                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
};

export default DashboardLayout;
