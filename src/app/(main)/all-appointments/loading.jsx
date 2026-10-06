import { DoctorGridSkeleton, PageHeaderSkeleton } from "@/components/shared/Skeletons";

export default function Loading() {
    return (
        <div className="min-h-screen bg-base-200/40">
            <PageHeaderSkeleton />
            <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
                <div className="skeleton h-12 w-full max-w-3xl mx-auto rounded-xl" />
                <div className="flex flex-wrap justify-center gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="skeleton h-7 w-20 rounded-full" />
                    ))}
                </div>
                <DoctorGridSkeleton />
            </div>
        </div>
    );
}
