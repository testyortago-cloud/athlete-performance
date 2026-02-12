import { notFound } from 'next/navigation';
import { getTestingSessionById, getTrialDataBySession, getTestingSessions } from '@/lib/services/testingSessionService';
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

  // Fetch all previous sessions for the athlete to compute personal bests
  const allSessions = await getTestingSessions({ athleteId: athlete.id });
  const previousSessionIds = allSessions
    .filter((s) => s.id !== id && s.date <= session.date)
    .map((s) => s.id);

  // Get trial data from previous sessions
  const prevTrialDataArrays = await Promise.all(
    previousSessionIds.slice(0, 20).map((sid) => getTrialDataBySession(sid))
  );
  const allPrevTrialData = prevTrialDataArrays.flat();

  // Build personal bests map: metricId → best score
  const personalBests: Record<string, number> = {};
  for (const td of allPrevTrialData) {
    if (td.bestScore != null) {
      const metric = metrics.find((m) => m.id === td.metricId);
      if (!metric) continue;
      const current = personalBests[td.metricId];
      if (current === undefined) {
        personalBests[td.metricId] = td.bestScore;
      } else {
        personalBests[td.metricId] = metric.bestScoreMethod === 'highest'
          ? Math.max(current, td.bestScore)
          : Math.min(current, td.bestScore);
      }
    }
  }

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

  // Build previous session comparison data
  const prevSessions = allSessions
    .filter((s) => s.id !== id && s.date <= session.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let previousSessionComparison: { date: string; scores: Record<string, number> } | undefined;
  if (prevSessions.length > 0) {
    const prevSession = prevSessions[0];
    const prevTrials = await getTrialDataBySession(prevSession.id);
    const scores: Record<string, number> = {};
    for (const td of prevTrials) {
      if (td.bestScore != null) {
        scores[td.metricId] = td.bestScore;
      }
    }
    previousSessionComparison = { date: prevSession.date, scores };
  }

  return (
    <SessionDetailClient
      session={{ ...session, athleteName: athlete.name }}
      athlete={athlete}
      athletes={athletes}
      categoriesWithMetrics={categoriesWithMetrics}
      personalBests={personalBests}
      previousSession={previousSessionComparison}
    />
  );
}
