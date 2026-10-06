import { DoctorGridSkeleton } from "@/components/shared/Skeletons";

export default function Loading() {
    return (
        <div className="min-h-screen bg-base-200/40">
            <div className="bg-base-100 border-b border-base-300">
                <div className="max-w-7xl mx-auto px-4 py-10 space-y-4">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-52 sm:h-64 md:h-80 rounded-2xl" />
                    <div className="flex items-center gap-4">
                        <div className="skeleton w-20 h-20 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="skeleton h-7 w-80 max-w-full" />
                            <div className="skeleton h-3 w-56" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="skeleton h-6 w-56 mb-6" />
                <DoctorGridSkeleton count={4} />
            </div>
        </div>
    );
}
