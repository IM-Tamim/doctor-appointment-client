"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { getMyNotifications, markAllNotificationsRead } from "@/lib/notifications";
import { FaBell, FaCheckDouble } from "react-icons/fa";

const NotificationBell = () => {
    const { data: session } = authClient.useSession();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const load = useCallback(async () => {
        if (!session) return;
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            const result = await getMyNotifications(token);
            if (Array.isArray(result)) setNotifications(result);
        } catch {
            // silent — notifications are a non-critical enhancement
        }
    }, [session]);

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, [load]);

    // Close on outside click — fully controlled, doesn't rely on CSS :focus
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    if (!session) return null;

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || loading) return;
        setLoading(true);
        try {
            const { data: tokenData } = await authClient.token();
            const token = tokenData?.token;
            await markAllNotificationsRead(token);
            // Re-sync from the server rather than trusting local optimistic
            // state — guarantees the badge reflects what's actually in the
            // database instead of drifting out of sync.
            await load();
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => setIsOpen((prev) => !prev);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={handleToggle}
                className="btn btn-ghost btn-circle relative"
            >
                <FaBell className="text-base-content/70" size={16} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-content text-[10px] flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-box bg-base-100 border border-base-300 shadow-xl z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-base-300 sticky top-0 bg-base-100">
                        <span className="text-sm font-bold">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={loading}
                                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    <FaCheckDouble size={10} />
                                )}
                                Mark all read
                            </button>
                        )}
                    </div>
                    <ul className="p-2">
                        {notifications.length === 0 ? (
                            <li className="p-4 text-center text-sm text-base-content/50">
                                No notifications yet.
                            </li>
                        ) : (
                            notifications.map((n) => (
                                <li key={n._id}>
                                    <div className={`flex flex-col items-start gap-0.5 py-2 px-2 rounded-lg ${!n.read ? "bg-primary/5" : ""}`}>
                                        <span className="text-sm">{n.message}</span>
                                        <span className="text-xs text-base-content/40">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
