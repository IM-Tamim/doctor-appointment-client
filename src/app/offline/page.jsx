import Link from "next/link";
import { FiWifiOff, FiRefreshCw } from "react-icons/fi";

export const metadata = {
    title: "Offline | DocAppoint",
    description: "You're offline. Reconnect to continue booking appointments.",
};

// Served by the service worker when a navigation fails. Kept dependency-free
// and outside the (main) group on purpose: the navbar and footer both need the
// session and the API, neither of which is reachable offline.
const OfflinePage = () => (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-base-200/50 brand-glow">
        <div className="w-full max-w-md text-center animate-fade-up">
            <div className="w-20 h-20 mx-auto rounded-full bg-base-100 ring-1 ring-base-300 flex items-center justify-center mb-6 shadow-sm">
                <FiWifiOff className="text-primary" size={32} />
            </div>

            <h1 className="text-2xl font-black text-base-content mb-2">You&apos;re offline</h1>
            <p className="text-sm text-base-content/60 leading-relaxed mb-8">
                DocAppoint needs a connection to load doctors and appointments.
                Check your network and try again — pages you&apos;ve already
                visited will still open.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/home" className="btn btn-primary rounded-xl font-bold gap-2">
                    <FiRefreshCw size={15} /> Try again
                </Link>
            </div>

            <p className="text-xs text-base-content/40 mt-8">
                Your bookings are safe — nothing is lost while you&apos;re offline.
            </p>
        </div>
    </div>
);

export default OfflinePage;
