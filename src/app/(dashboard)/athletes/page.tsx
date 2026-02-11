import { getAthletes } from '@/lib/services/athleteService';
import { getSports } from '@/lib/services/sportService';
import { getPrograms } from '@/lib/services/programService';
import { AthletesClient } from './AthletesClient';

export const dynamic = 'force-dynamic';

export default async function AthletesPage() {
  const [athletes, sports, programs] = await Promise.all([
    getAthletes().catch(() => []),
    getSports().catch(() => []),
    getPrograms().catch(() => []),
  ]);

  const sportMap = new Map(sports.map((s) => [s.id, s.name]));
  const programMap = new Map(programs.map((p) => [p.id, p.name]));
  const enrichedAthletes = athletes.map((a) => ({
    ...a,
    sportName: sportMap.get(a.sportId) || 'Unknown',
    programName: a.programId ? programMap.get(a.programId) || undefined : undefined,
  }));

  return <AthletesClient athletes={enrichedAthletes} sports={sports} programs={programs} />;
}
