'use client'
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

const NotFoundPage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-linear-to-br from-base-200 via-base-300 to-base-200">
            <h1 className="text-9xl font-black tracking-tight text-primary/15">
                404
            </h1>

            <h2 className="text-2xl font-bold text-base-content mt-4">
                Page Not Found
            </h2>
            <p className="text-sm mt-2 mb-8 text-base-content/60">
                The page you are looking for does not exist or has been moved.
            </p>

            <button
                onClick={() => router.push("/home")}
                className="btn btn-primary gap-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-primary/20 transition-all"
            >
                <FiArrowLeft size={15} />
                Back to Home
            </button>
        </div>
    );
};

export default NotFoundPage;