import { Suspense } from 'react';
import { getAthletes } from '@/lib/services/athleteService';
import { getSports } from '@/lib/services/sportService';
import { getMetricsBySport } from '@/lib/services/metricService';
import { getTestingSessions, getTrialDataBySession } from '@/lib/services/testingSessionService';
import { ComparisonsClient } from './ComparisonsClient';
import type { Metric, AthleteRanking, Athlete } from '@/types';

export const dynamic = 'force-dynamic';

interface TrialWithSession {
  metricId: string;
  bestScore: number;
  athleteId: string;
}

export default async function ComparisonsPage() {
  const [athletes, sports] = await Promise.all([
    getAthletes(),
    getSports(),
  ]);

  // Get metrics for all sports
  const allMetrics: Metric[] = [];
  const sportMetricsMap: Record<string, Metric[]> = {};
  for (const sport of sports) {
    const metrics = await getMetricsBySport(sport.id);
    sportMetricsMap[sport.id] = metrics;
    allMetrics.push(...metrics);
  }

  // Gather all trial data
  const sessions = await getTestingSessions();
  const trialResults: TrialWithSession[] = [];

  for (const session of sessions) {
    const trialData = await getTrialDataBySession(session.id);
    for (const trial of trialData) {
      if (trial.bestScore != null) {
        trialResults.push({
          metricId: trial.metricId,
          bestScore: trial.bestScore,
          athleteId: session.athleteId,
        });
      }
    }
  }

  // Build rankings per metric (best score per athlete)
  const rankingsMap: Record<string, AthleteRanking[]> = {};

  for (const metric of allMetrics) {
    const bestScores = new Map<string, number>();

    for (const trial of trialResults) {
      if (trial.metricId !== metric.id) continue;
      const current = bestScores.get(trial.athleteId);
      if (current === undefined || trial.bestScore > current) {
        bestScores.set(trial.athleteId, trial.bestScore);
      }
    }

    const rankings = Array.from(bestScores.entries())
      .map(([athleteId, bestScore]) => {
        const athlete = athletes.find((a) => a.id === athleteId);
        return {
          athleteId,
          athleteName: athlete?.name || 'Unknown',
          metricName: metric.name,
          bestScore,
          rank: 0,
        };
      })
      .sort((a, b) => b.bestScore - a.bestScore);

    rankings.forEach((r, i) => { r.rank = i + 1; });
    rankingsMap[metric.id] = rankings;
  }

  // Build heatmap data: for each athlete, latest bestScore per metric
  const heatmapData: Record<string, Record<string, number | null>> = {};
  for (const athlete of athletes) {
    heatmapData[athlete.id] = {};
    for (const metric of allMetrics) {
      const ranking = rankingsMap[metric.id]?.find((r) => r.athleteId === athlete.id);
      heatmapData[athlete.id][metric.id] = ranking?.bestScore ?? null;
    }
  }

  return (
    <Suspense>
      <ComparisonsClient
        athletes={athletes}
        sports={sports}
        sportMetricsMap={sportMetricsMap}
        rankingsMap={rankingsMap}
        heatmapData={heatmapData}
      />
    </Suspense>
  );
}
