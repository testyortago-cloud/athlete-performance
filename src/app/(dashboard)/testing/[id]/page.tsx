import { notFound } from 'next/navigation';
import { getTestingSessionById, getTrialDataBySession } from '@/lib/services/testingSessionService';
import { getAthleteById } from '@/lib/services/athleteService';
import { getAthletes } from '@/lib/services/athleteService';
import { getCategoriesBySport, getMetricsBySport } from '@/lib/services/metricService';
import { SessionDetailClient } from './SessionDetailClient';
import type { CategoryWithMetrics } from '@/types';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({ params }: SessionPageProps) {
  const { id } = await params;

  const session = await getTestingSessionById(id);
  if (!session) notFound();

  const [athlete, athletes, trialData] = await Promise.all([
    getAthleteById(session.athleteId),
    getAthletes(),
    getTrialDataBySession(id),
  ]);

  if (!athlete) notFound();

  const [categories, metrics] = await Promise.all([
    getCategoriesBySport(athlete.sportId),
    getMetricsBySport(athlete.sportId),
  ]);

  // Build trial data map: metricId → TrialData
  const trialMap = new Map(trialData.map((t) => [t.metricId, t]));

  // Build categories with metrics and pre-filled trial data
  const categoriesWithMetrics: CategoryWithMetrics[] = categories
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const categoryMetrics = metrics
        .filter((m) => m.categoryId === category.id)
        .map((metric) => {
          const existing = trialMap.get(metric.id);
          return {
            metric,
            trial1: existing?.trial1 ?? null,
            trial2: existing?.trial2 ?? null,
            trial3: existing?.trial3 ?? null,
            bestScore: existing?.bestScore ?? null,
            averageScore: existing?.averageScore ?? null,
            existingTrialDataId: existing?.id,
          };
        });

      return { category, metrics: categoryMetrics };
    })
    .filter((c) => c.metrics.length > 0);

  return (
    <SessionDetailClient
      session={{ ...session, athleteName: athlete.name }}
      athlete={athlete}
      athletes={athletes}
      categoriesWithMetrics={categoriesWithMetrics}
    />
  );
}
