import { getAthletes } from '@/lib/services/athleteService';
import { getSports } from '@/lib/services/sportService';
import { getPrograms } from '@/lib/services/programService';
import { getInjuries } from '@/lib/services/injuryService';
import { getDailyLoads } from '@/lib/services/dailyLoadService';
import { computeAthleteRiskIndicators } from '@/lib/services/analyticsService';
import { getThresholdSettings } from '@/lib/services/settingsService';
import { AthletesClient } from './AthletesClient';

export const dynamic = 'force-dynamic';

export default async function AthletesPage() {
  const [athletes, sports, programs, injuries, dailyLoads, thresholds] = await Promise.all([
    getAthletes().catch(() => []),
    getSports().catch(() => []),
    getPrograms().catch(() => []),
    getInjuries().catch(() => []),
    getDailyLoads().catch(() => []),
    getThresholdSettings(),
  ]);

  const sportMap = new Map(sports.map((s) => [s.id, s.name]));
  const programMap = new Map(programs.map((p) => [p.id, p.name]));
  const enrichedAthletes = athletes.map((a) => ({
    ...a,
    sportName: sportMap.get(a.sportId) || 'Unknown',
    programName: a.programId ? programMap.get(a.programId) || undefined : undefined,
  }));

  const activeInjuries = injuries.filter((i) => i.status !== 'resolved');
  const riskIndicators = computeAthleteRiskIndicators(athletes, dailyLoads, injuries, thresholds);

  return (
    <AthletesClient
      athletes={enrichedAthletes}
      sports={sports}
      programs={programs}
      injuries={activeInjuries}
      riskIndicators={riskIndicators}
    />
  );
}
