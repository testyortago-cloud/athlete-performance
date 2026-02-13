import { notFound } from 'next/navigation';
import { getAthleteById } from '@/lib/services/athleteService';
import { getSports } from '@/lib/services/sportService';
import { getPrograms } from '@/lib/services/programService';
import { getInjuries } from '@/lib/services/injuryService';
import { getDailyLoads } from '@/lib/services/dailyLoadService';
import { getTestingSessions, getTrialDataBySession } from '@/lib/services/testingSessionService';
import { getMetricsBySport } from '@/lib/services/metricService';
import { getThresholdSettings } from '@/lib/services/settingsService';
import { getWellnessCheckins } from '@/lib/services/wellnessService';
import { getGoals } from '@/lib/services/goalService';
import { getJournalEntries } from '@/lib/services/journalService';
import {
  computeAthleteLoadTrends,
  computeAthleteRiskIndicators,
  computePersonalRecords,
  computeWeeklyVolumeSummary,
  computeRadarData,
  computeTrainingStreaks,
  computeLoadZones,
  computeWeekOverWeek,
  computeComplianceRate,
  computeRiskFlags,
  computeAchievementBadges,
} from '@/lib/services/analyticsService';
import { AthleteDetailClient } from './AthleteDetailClient';
import type { PerformanceTrend } from '@/types';

export const dynamic = 'force-dynamic';

interface AthletePageProps {
  params: Promise<{ id: string }>;
}

export default async function AthleteDetailPage({ params }: AthletePageProps) {
  const { id } = await params;

  // Critical fetch — if this fails, show 404
  const athlete = await getAthleteById(id);
  if (!athlete) notFound();

  // Non-critical fetches — gracefully fall back to empty arrays on failure
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

  // Fetch metrics for the athlete's sport (non-critical)
  const metrics = athlete.sportId
    ? await getMetricsBySport(athlete.sportId).catch(() => [])
    : [];

  // Build performance trends from trial data
  const performanceTrends: PerformanceTrend[] = [];
  for (const session of testingSessions) {
    const trialData = await getTrialDataBySession(session.id).catch(() => []);
    for (const trial of trialData) {
      if (trial.bestScore == null) continue;
      performanceTrends.push({
        date: session.date,
        metricName: trial.metricId, // Using metricId as key, resolved in client
        bestScore: trial.bestScore,
        averageScore: trial.averageScore ?? trial.bestScore,
        athleteName: athlete.name,
      });
    }
  }
  performanceTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Fetch threshold settings
  const thresholds = await getThresholdSettings();

  // Compute load trends for this athlete
  const loadTrends = computeAthleteLoadTrends(dailyLoads, { days: thresholds.defaultDays });
  const riskIndicators = computeAthleteRiskIndicators([athlete], dailyLoads, injuries, thresholds);
  const riskIndicator = riskIndicators[0] || null;

  // Compute avg RPE last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const recentLoads = dailyLoads.filter((l) => new Date(l.date) >= sevenDaysAgo);
  const avgRpeWeek = recentLoads.length > 0
    ? Math.round((recentLoads.reduce((sum, l) => sum + l.rpe, 0) / recentLoads.length) * 10) / 10
    : 0;

  // Total days lost from injuries
  const totalDaysLost = injuries.reduce((sum, i) => sum + (i.daysLost ?? 0), 0);

  // Compute personal records and weekly volume
  const personalRecords = computePersonalRecords(performanceTrends, metrics);
  const weeklyVolume = computeWeeklyVolumeSummary(dailyLoads);

  // Compute radar chart data and training streaks
  const radarData = computeRadarData(performanceTrends, metrics);
  const trainingStreaks = computeTrainingStreaks(dailyLoads);

  // Phase 3: Coach Intelligence
  const loadZones = computeLoadZones(dailyLoads, { days: thresholds.defaultDays });
  const weekOverWeek = computeWeekOverWeek(dailyLoads, wellnessCheckins, thresholds);
  const compliance = computeComplianceRate(dailyLoads);
  const riskFlags = computeRiskFlags(riskIndicator, wellnessCheckins, dailyLoads, thresholds);

  // Phase 5: Goals, Journal, Badges
  const [goals, journalEntries] = await Promise.all([
    getGoals({ athleteId: id }).catch(() => []),
    getJournalEntries({ athleteId: id }).catch(() => []),
  ]);
  const badges = computeAchievementBadges(dailyLoads, personalRecords, wellnessCheckins, compliance, trainingStreaks);

  return (
    <AthleteDetailClient
      athlete={{ ...athlete, sportName: sport?.name || athlete.sportName || 'Unknown', programName: program?.name || athlete.programName || undefined }}
      sports={sports}
      programs={programs}
      injuries={injuries}
      dailyLoads={dailyLoads}
      testingSessions={testingSessions}
      metrics={metrics}
      performanceTrends={performanceTrends}
      loadTrends={loadTrends}
      riskIndicator={riskIndicator}
      avgRpeWeek={avgRpeWeek}
      totalDaysLost={totalDaysLost}
      wellnessCheckins={wellnessCheckins}
      personalRecords={personalRecords}
      weeklyVolume={weeklyVolume}
      radarData={radarData}
      trainingStreaks={trainingStreaks}
      loadZones={loadZones}
      weekOverWeek={weekOverWeek}
      compliance={compliance}
      riskFlags={riskFlags}
      goals={goals}
      journalEntries={journalEntries}
      badges={badges}
    />
  );
}
