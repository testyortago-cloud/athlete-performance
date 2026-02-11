import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function RiskLoading() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-white p-6 shadow-sm">
            <Skeleton className="mb-2 h-4 w-8" />
            <Skeleton className="mb-2 h-9 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <SkeletonCard className="mb-6" />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
