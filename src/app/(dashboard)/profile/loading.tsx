import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
