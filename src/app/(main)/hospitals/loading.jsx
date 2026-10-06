import { HospitalCardSkeleton, PageHeaderSkeleton } from "@/components/shared/Skeletons";

export default function Loading() {
    return (
        <div className="min-h-screen bg-base-200/40">
            <PageHeaderSkeleton />
            <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <HospitalCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
