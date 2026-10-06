// Server-safe loading placeholders built on daisyUI's `skeleton` class, used
// by the route-level loading.jsx files.

export const DoctorCardSkeleton = () => (
    <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
        <div className="skeleton h-56 w-full rounded-none" />
        <div className="p-5 space-y-3">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-8 w-full mt-4" />
        </div>
    </div>
);

export const DoctorGridSkeleton = ({ count = 8 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <DoctorCardSkeleton key={i} />
        ))}
    </div>
);

export const PageHeaderSkeleton = () => (
    <div className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-14 flex flex-col items-center gap-3">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-9 w-72 max-w-full" />
            <div className="skeleton h-3 w-80 max-w-full" />
        </div>
    </div>
);

export const HospitalCardSkeleton = () => (
    <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
        <div className="skeleton aspect-16/10 rounded-none" />
        <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/3" />
            </div>
        </div>
        <div className="skeleton h-3 w-full" />
        <div className="flex gap-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
        </div>
        </div>
    </div>
);

export const DashboardSkeleton = () => (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="skeleton h-9 w-64 max-w-full" />
        <div className="grid sm:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
    </div>
);
