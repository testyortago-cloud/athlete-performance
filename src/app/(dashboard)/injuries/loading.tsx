import { SkeletonCard } from '@/components/ui/Skeleton';
import { Skeleton } from '@/components/ui/Skeleton';

export default function InjuriesLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      <SkeletonCard />
    </div>
  );
}
