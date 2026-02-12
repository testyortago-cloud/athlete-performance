import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function NewSessionLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
      <SkeletonCard />
    </div>
  );
}
