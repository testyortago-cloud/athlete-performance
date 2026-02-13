import { notFound } from 'next/navigation';
import { getAthleteById } from '@/lib/services/athleteService';
import { getSports } from '@/lib/services/sportService';
import { getPrograms } from '@/lib/services/programService';
import { getInjuries } from '@/lib/services/injuryService';
import { getDailyLoads } from '@/lib/services/dailyLoadService';
import { getTestingSessions, getTrialDataBySession } from '@/lib/services/testingSessionService';
import { getMetricsBySport } from '@/lib/services/metricService';
import { getThresholdSettings } from '@/lib/services/settingsService';
import {
  computeAthleteLoadTrends,
  computeAthleteRiskIndicators,
  computePersonalRecords,
  computeWeeklyVolumeSummary,
  computeRadarData,
  computeTrainingStreaks,
  computeComplianceRate,
  computeAchievementBadges,
} from '@/lib/services/analyticsService';
import { getWellnessCheckins } from '@/lib/services/wellnessService';
import { getGoals } from '@/lib/services/goalService';
import { PublicProfileClient } from './PublicProfileClient';
import type { PerformanceTrend } from '@/types';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PublicProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const athlete = await getAthleteById(id).catch(() => null);
  if (!athlete) return { title: 'Athlete Not Found' };
  return {
    title: `${athlete.name} — DJP Athlete Profile`,
    description: `Performance profile for ${athlete.name}`,
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id } = await params;

  const athlete = await getAthleteById(id);
  if (!athlete) notFound();

  const [sports, programs, injuries, dailyLoads, testingSessions, wellnessCheckins] = await Promise.all([
    getSports().catch(() => []),
    getPrograms().catch(() => []),
    getInjuries({ athleteId: id }).catch(() => []),
    getDailyLoads({ athleteId: id }).catch(() => []),
    getTestingSessions({ athleteId: id }).catch(() => []),
    getWellnessCheckins({ athleteId: id }).catch(() => []),
  ]);

  const sport = sports.find((s) => s.id === athlete.sportId);
  const program = programs.find((p) => p.id === athlete.programId);

  const metrics = athlete.sportId
    ? await getMetricsBySport(athlete.sportId).catch(() => [])
    : [];

  const performanceTrends: PerformanceTrend[] = [];
  for (const session of testingSessions) {
    const trialData = await getTrialDataBySession(session.id).catch(() => []);
    for (const trial of trialData) {
      if (trial.bestScore == null) continue;
      performanceTrends.push({
        date: session.date,
        metricName: trial.metricId,
        bestScore: trial.bestScore,
        averageScore: trial.averageScore ?? trial.bestScore,
        athleteName: athlete.name,
      });
    }
  }
  performanceTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const loadTrends = computeAthleteLoadTrends(dailyLoads, { days: 30 });

  const thresholds = await getThresholdSettings();
  const riskIndicators = computeAthleteRiskIndicators([athlete], dailyLoads, injuries, thresholds);
  const riskIndicator = riskIndicators[0] || null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const recentLoads = dailyLoads.filter((l) => new Date(l.date) >= sevenDaysAgo);
  const avgRpeWeek =
    recentLoads.length > 0
      ? Math.round((recentLoads.reduce((sum, l) => sum + l.rpe, 0) / recentLoads.length) * 10) / 10
      : 0;

  const totalDaysLost = injuries.reduce((sum, i) => sum + (i.daysLost ?? 0), 0);

  // Wellness data
  const latestWellness = wellnessCheckins.length > 0 ? wellnessCheckins[0] : null;
  const wellnessTrend = wellnessCheckins
    .slice(0, 7)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Personal records
  const personalRecords = computePersonalRecords(performanceTrends, metrics);

  // Weekly volume
  const weeklyVolume = computeWeeklyVolumeSummary(dailyLoads);

  // Radar data
  const radarData = computeRadarData(performanceTrends, metrics);

  // Training streaks
  const trainingStreaks = computeTrainingStreaks(dailyLoads);

  // Compliance
  const compliance = computeComplianceRate(dailyLoads);

  // Achievement badges
  const badges = computeAchievementBadges(dailyLoads, personalRecords, wellnessCheckins, compliance, trainingStreaks);

  // Goals
  const goals = await getGoals({ athleteId: id }).catch(() => []);

  return (
    <PublicProfileClient
      athlete={{
        ...athlete,
        sportName: sport?.name || athlete.sportName || undefined,
        programName: program?.name || athlete.programName || undefined,
      }}
      injuries={injuries}
      dailyLoads={dailyLoads}
      testingSessions={testingSessions}
      metrics={metrics}
      performanceTrends={performanceTrends}
      loadTrends={loadTrends}
      riskIndicator={riskIndicator}
      avgRpeWeek={avgRpeWeek}
      totalDaysLost={totalDaysLost}
      latestWellness={latestWellness}
      wellnessTrend={wellnessTrend}
      personalRecords={personalRecords}
      weeklyVolume={weeklyVolume}
      radarData={radarData}
      trainingStreaks={trainingStreaks}
      compliance={compliance}
      badges={badges}
      goals={goals}
      wellnessCheckins={wellnessCheckins}
    />
  );
}
