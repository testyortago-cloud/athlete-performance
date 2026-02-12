import { notFound } from 'next/navigation';
import { getInjuryById, getInjuries } from '@/lib/services/injuryService';
import { getAthletes } from '@/lib/services/athleteService';
import { InjuryDetailClient } from './InjuryDetailClient';

interface InjuryPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function InjuryDetailPage({ params }: InjuryPageProps) {
  const { id } = await params;
  const [injury, athletes] = await Promise.all([
    getInjuryById(id),
    getAthletes(),
  ]);

  if (!injury) notFound();

  const athlete = athletes.find((a) => a.id === injury.athleteId);

  // Fetch all injuries for this athlete (for history + body map)
  const athleteInjuries = await getInjuries({ athleteId: injury.athleteId });

  return (
    <InjuryDetailClient
      injury={{ ...injury, athleteName: athlete?.name || 'Unknown' }}
      athletes={athletes}
      athleteInjuries={athleteInjuries.map((i) => ({
        ...i,
        athleteName: athlete?.name || 'Unknown',
      }))}
    />
  );
}
