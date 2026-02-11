import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-6 rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* KPI row skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-white p-6 shadow-sm">
            <Skeleton className="mb-2 h-4 w-8" />
            <Skeleton className="mb-2 h-9 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Charts grid skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
