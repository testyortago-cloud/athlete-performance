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
} from '@/lib/services/analyticsService';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [athletes, sports, injuries, dailyLoads, sessions, thresholds] = await Promise.all([
    getAthletes().catch(() => []),
    getSports().catch(() => []),
    getInjuries().catch(() => []),
    getDailyLoads().catch(() => []),
    getTestingSessions().catch(() => []),
    getThresholdSettings(),
  ]);

  // KPIs
  const activeAthletes = athletes.filter((a) => a.status === 'active').length;
  const activeInjuries = injuries.filter((i) => i.status !== 'resolved').length;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const recentLoads = dailyLoads.filter((l) => new Date(l.date) >= sevenDaysAgo);
  const avgLoad = recentLoads.length > 0
    ? Math.round(recentLoads.reduce((sum, l) => sum + l.trainingLoad, 0) / recentLoads.length)
    : 0;

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sessionsThisMonth = sessions.filter((s) => new Date(s.date) >= startOfMonth).length;

  // Chart data
  const injuryByRegion = computeInjurySummaryByBodyRegion(injuries).slice(0, 5);
  const injuryByType = computeInjurySummaryByType(injuries);
  const loadTrends = computeLoadTrends(dailyLoads, { days: 30 });
  const riskIndicators = computeAthleteRiskIndicators(athletes, dailyLoads, injuries, thresholds);
  const alerts = computeRiskAlerts(riskIndicators, thresholds);

  // Sparkline data — 7-day snapshots for KPI cards
  const sparklineAthletes: number[] = [];
  const sparklineInjuries: number[] = [];
  const sparklineLoad: number[] = [];
  const sparklineSessions: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const dayStr = day.toISOString().split('T')[0];

    // Count active athletes on that day (approximate — use total active)
    sparklineAthletes.push(activeAthletes);

    // Count active injuries on that day
    const injCount = injuries.filter((inj) => {
      const occurred = inj.dateOccurred <= dayStr;
      const resolved = inj.dateResolved ? inj.dateResolved <= dayStr : false;
      return occurred && inj.status !== 'resolved' && !resolved;
    }).length;
    sparklineInjuries.push(injCount);

    // Average load on that day
    const dayLoads = dailyLoads.filter((l) => l.date === dayStr);
    const dayAvg = dayLoads.length > 0
      ? Math.round(dayLoads.reduce((s, l) => s + l.trainingLoad, 0) / dayLoads.length)
      : 0;
    sparklineLoad.push(dayAvg);

    // Sessions count up to that day in the month
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
        athletes={athletes}
        sports={sports}
        lastUpdated={new Date().toISOString()}
      />
    </Suspense>
  );
}
