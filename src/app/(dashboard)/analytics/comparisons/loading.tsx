import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function ComparisonsLoading() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="mb-6 rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <SkeletonCard />
    </>
  );
}
