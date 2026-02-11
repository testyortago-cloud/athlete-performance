import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function SportsLoading() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <SkeletonCard />
    </>
  );
}
