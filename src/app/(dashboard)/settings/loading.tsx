import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
      </div>
      <SkeletonCard />
    </>
  );
}
