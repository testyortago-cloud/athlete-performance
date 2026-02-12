import { getPrograms } from '@/lib/services/programService';
import { getAthletes } from '@/lib/services/athleteService';
import { getInjuries } from '@/lib/services/injuryService';
import { ProgramsClient } from './ProgramsClient';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const [programs, athletes, injuries] = await Promise.all([
    getPrograms(),
    getAthletes().catch(() => []),
    getInjuries().catch(() => []),
  ]);

  // Build athlete count per program
  const athleteCountByProgram = new Map<string, number>();
  for (const a of athletes) {
    if (a.programId) {
      athleteCountByProgram.set(a.programId, (athleteCountByProgram.get(a.programId) || 0) + 1);
    }
  }

  // Build active injury count per program (via athlete's programId)
  const athleteProgramMap = new Map(athletes.filter((a) => a.programId).map((a) => [a.id, a.programId!]));
  const injuryCountByProgram = new Map<string, number>();
  for (const i of injuries.filter((i) => i.status !== 'resolved')) {
    const programId = athleteProgramMap.get(i.athleteId);
    if (programId) {
      injuryCountByProgram.set(programId, (injuryCountByProgram.get(programId) || 0) + 1);
    }
  }

  const enrichedPrograms = programs.map((p) => ({
    ...p,
    athleteCount: athleteCountByProgram.get(p.id) || 0,
    injuryCount: injuryCountByProgram.get(p.id) || 0,
  }));

  const totalEnrolled = athletes.filter((a) => a.programId).length;

  return (
    <ProgramsClient
      programs={enrichedPrograms}
      totalEnrolled={totalEnrolled}
      totalAthletes={athletes.length}
    />
  );
}
