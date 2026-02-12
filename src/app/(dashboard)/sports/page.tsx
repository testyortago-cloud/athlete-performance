import { getSports } from '@/lib/services/sportService';
import { getAthletes } from '@/lib/services/athleteService';
import { getInjuries } from '@/lib/services/injuryService';
import { SportsClient } from './SportsClient';

export const dynamic = 'force-dynamic';

export default async function SportsPage() {
  const [sports, athletes, injuries] = await Promise.all([
    getSports(),
    getAthletes().catch(() => []),
    getInjuries().catch(() => []),
  ]);

  // Build athlete count per sport
  const athleteCountBySport = new Map<string, number>();
  for (const a of athletes) {
    athleteCountBySport.set(a.sportId, (athleteCountBySport.get(a.sportId) || 0) + 1);
  }

  // Build active injury count per sport (via athlete's sportId)
  const athleteSportMap = new Map(athletes.map((a) => [a.id, a.sportId]));
  const injuryCountBySport = new Map<string, number>();
  for (const i of injuries.filter((i) => i.status !== 'resolved')) {
    const sportId = athleteSportMap.get(i.athleteId);
    if (sportId) {
      injuryCountBySport.set(sportId, (injuryCountBySport.get(sportId) || 0) + 1);
    }
  }

  const enrichedSports = sports.map((s) => ({
    ...s,
    athleteCount: athleteCountBySport.get(s.id) || 0,
    injuryCount: injuryCountBySport.get(s.id) || 0,
  }));

  return (
    <SportsClient
      sports={enrichedSports}
      totalAthletes={athletes.length}
      totalInjuries={injuries.filter((i) => i.status !== 'resolved').length}
    />
  );
}
