import { notFound } from 'next/navigation';
import { getDailyLoadById } from '@/lib/services/dailyLoadService';
import { getAthletes } from '@/lib/services/athleteService';
import { LoadDetailClient } from './LoadDetailClient';

interface LoadPageProps {
  params: Promise<{ id: string }>;
}

export default async function LoadDetailPage({ params }: LoadPageProps) {
  const { id } = await params;
  const [load, athletes] = await Promise.all([
    getDailyLoadById(id),
    getAthletes(),
  ]);

  if (!load) notFound();

  const athlete = athletes.find((a) => a.id === load.athleteId);

  return (
    <LoadDetailClient
      load={{ ...load, athleteName: athlete?.name || 'Unknown' }}
      athletes={athletes}
    />
  );
}
