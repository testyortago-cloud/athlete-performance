import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function LoadDetailLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="mb-2 h-4 w-40" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
