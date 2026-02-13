import { Suspense } from 'react';
import { getAthletes } from '@/lib/services/athleteService';
import { getSports } from '@/lib/services/sportService';
import { getInjuries } from '@/lib/services/injuryService';
import { getDailyLoads } from '@/lib/services/dailyLoadService';
import { getTestingSessions } from '@/lib/services/testingSessionService';
import { getThresholdSettings } from '@/lib/services/settingsService';
import {
  computeInjurySummaryByBodyRegion,
  computeInjurySummaryByType,
  computeLoadTrends,
  computeAthleteRiskIndicators,
  computeRiskAlerts,
  computeWeekOverWeek,
} from '@/lib/services/analyticsService';
import { getWellnessCheckins } from '@/lib/services/wellnessService';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const [allAthletes, sports, allInjuries, allDailyLoads, allSessions, thresholds] = await Promise.all([
    getAthletes().catch(() => []),
    getSports().catch(() => []),
    getInjuries().catch(() => []),
    getDailyLoads().catch(() => []),
    getTestingSessions().catch(() => []),
    getThresholdSettings(),
  ]);

  // Parse filter params
  const filterSportIds = params.sports ? params.sports.split(',') : [];
  const filterAthleteIds = params.athletes ? params.athletes.split(',') : [];
  const preset = params.preset;

  // Date range from preset
  const now = new Date();
  let dateStart: Date | null = null;
  let dateEnd: Date = now;
  if (preset) {
    switch (preset) {
      case 'last7': dateStart = new Date(now.getTime() - 7 * 86400000); break;
      case 'last30': dateStart = new Date(now.getTime() - 30 * 86400000); break;
      case 'last90': dateStart = new Date(now.getTime() - 90 * 86400000); break;
      case 'season': dateStart = new Date(now.getFullYear(), 0, 1); break;
    }
  }
  const dateStartStr = dateStart ? dateStart.toISOString().split('T')[0] : null;
  const dateEndStr = dateEnd.toISOString().split('T')[0];

  // Filter athletes by sport and athlete selection
  let athletes = allAthletes;
  if (filterSportIds.length > 0) {
    athletes = athletes.filter((a) => filterSportIds.includes(a.sportId));
  }
  if (filterAthleteIds.length > 0) {
    athletes = athletes.filter((a) => filterAthleteIds.includes(a.id));
  }
  const filteredAthleteIds = new Set(athletes.map((a) => a.id));

  // Filter injuries, loads, sessions by filtered athletes and date range
  let injuries = allInjuries.filter((i) => filteredAthleteIds.has(i.athleteId));
  let dailyLoads = allDailyLoads.filter((l) => filteredAthleteIds.has(l.athleteId));
  let sessions = allSessions.filter((s) => filteredAthleteIds.has(s.athleteId));

  if (dateStartStr) {
    injuries = injuries.filter((i) => i.dateOccurred >= dateStartStr && i.dateOccurred <= dateEndStr);
    dailyLoads = dailyLoads.filter((l) => l.date >= dateStartStr && l.date <= dateEndStr);
    sessions = sessions.filter((s) => s.date >= dateStartStr && s.date <= dateEndStr);
  }

  // KPIs
  const activeAthletes = athletes.filter((a) => a.status === 'active').length;
  const activeInjuries = injuries.filter((i) => i.status !== 'resolved').length;

  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const recentLoads = dailyLoads.filter((l) => new Date(l.date) >= sevenDaysAgo);
  const avgLoad = recentLoads.length > 0
    ? Math.round(recentLoads.reduce((sum, l) => sum + l.trainingLoad, 0) / recentLoads.length)
    : 0;

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sessionsThisMonth = sessions.filter((s) => new Date(s.date) >= startOfMonth).length;

  // Chart data — use unfiltered athletes for risk indicators (need full load history for ACWR)
  const injuryByRegion = computeInjurySummaryByBodyRegion(injuries).slice(0, 5);
  const injuryByType = computeInjurySummaryByType(injuries);
  const loadTrends = computeLoadTrends(dailyLoads, { days: dateStartStr ? Math.ceil((dateEnd.getTime() - (dateStart?.getTime() || 0)) / 86400000) : thresholds.defaultDays });
  const riskIndicators = computeAthleteRiskIndicators(athletes, allDailyLoads.filter((l) => filteredAthleteIds.has(l.athleteId)), allInjuries.filter((i) => filteredAthleteIds.has(i.athleteId)), thresholds);
  const alerts = computeRiskAlerts(riskIndicators, thresholds);

  // Compute per-athlete load spikes for notification bell
  const allWellnessCheckins = await getWellnessCheckins().catch(() => []);
  const loadSpikeAthletes: string[] = [];
  for (const athlete of athletes) {
    const athleteLoads = allDailyLoads.filter((l) => l.athleteId === athlete.id);
    const athleteWellness = allWellnessCheckins.filter((w) => w.athleteId === athlete.id);
    const wow = computeWeekOverWeek(athleteLoads, athleteWellness, thresholds);
    if (wow.loadSpikeAlert) {
      loadSpikeAthletes.push(athlete.name);
    }
  }

  // Sparkline data — 7-day snapshots for KPI cards
  const sparklineAthletes: number[] = [];
  const sparklineInjuries: number[] = [];
  const sparklineLoad: number[] = [];
  const sparklineSessions: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const dayStr = day.toISOString().split('T')[0];

    sparklineAthletes.push(activeAthletes);

    const injCount = injuries.filter((inj) => {
      const occurred = inj.dateOccurred <= dayStr;
      const resolved = inj.dateResolved ? inj.dateResolved <= dayStr : false;
      return occurred && inj.status !== 'resolved' && !resolved;
    }).length;
    sparklineInjuries.push(injCount);

    const dayLoads = dailyLoads.filter((l) => l.date === dayStr);
    const dayAvg = dayLoads.length > 0
      ? Math.round(dayLoads.reduce((s, l) => s + l.trainingLoad, 0) / dayLoads.length)
      : 0;
    sparklineLoad.push(dayAvg);

    const dayDate = new Date(dayStr);
    const monthStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), 1);
    const sessCount = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= monthStart && d <= dayDate;
    }).length;
    sparklineSessions.push(sessCount);
  }

  return (
    <Suspense>
      <DashboardClient
        kpis={{
          activeAthletes,
          activeInjuries,
          avgLoad,
          sessionsThisMonth,
        }}
        sparklines={{
          athletes: sparklineAthletes,
          injuries: sparklineInjuries,
          load: sparklineLoad,
          sessions: sparklineSessions,
        }}
        injuryByRegion={injuryByRegion}
        injuryByType={injuryByType}
        loadTrends={loadTrends}
        riskIndicators={riskIndicators}
        alerts={alerts}
        athletes={allAthletes}
        sports={sports}
        injuries={allInjuries}
        loadSpikeAthletes={loadSpikeAthletes}
        lastUpdated={new Date().toISOString()}
      />
    </Suspense>
  );
}
