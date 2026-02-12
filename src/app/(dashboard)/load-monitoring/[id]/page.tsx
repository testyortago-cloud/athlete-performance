import { notFound } from 'next/navigation';
import { getDailyLoadById, getDailyLoads } from '@/lib/services/dailyLoadService';
import { getAthletes } from '@/lib/services/athleteService';
import { getInjuries } from '@/lib/services/injuryService';
import { getThresholdSettings } from '@/lib/services/settingsService';
import { computeAthleteRiskIndicators } from '@/lib/services/analyticsService';
import { LoadDetailClient } from './LoadDetailClient';

interface LoadPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function LoadDetailPage({ params }: LoadPageProps) {
  const { id } = await params;
  const [load, athletes] = await Promise.all([
    getDailyLoadById(id),
    getAthletes(),
  ]);

  if (!load) notFound();

  const athlete = athletes.find((a) => a.id === load.athleteId);

  // Compute ACWR for this athlete
  let acwr: number | null = null;
  if (athlete) {
    const [allLoads, injuries, thresholds] = await Promise.all([
      getDailyLoads({ athleteId: athlete.id }).catch(() => []),
      getInjuries({ athleteId: athlete.id }).catch(() => []),
      getThresholdSettings(),
    ]);
    const riskIndicators = computeAthleteRiskIndicators([athlete], allLoads, injuries, thresholds);
    acwr = riskIndicators[0]?.acwr ?? null;
  }

  return (
    <LoadDetailClient
      load={{ ...load, athleteName: athlete?.name || 'Unknown' }}
      athletes={athletes}
      acwr={acwr}
    />
  );
}
