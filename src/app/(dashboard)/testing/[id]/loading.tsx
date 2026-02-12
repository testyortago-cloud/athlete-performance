import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function SessionDetailLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      <SkeletonCard />
      <div className="mt-6 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
