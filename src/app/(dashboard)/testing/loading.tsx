import { SkeletonCard } from '@/components/ui/Skeleton';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TestingLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      <SkeletonCard />
    </div>
  );
}
