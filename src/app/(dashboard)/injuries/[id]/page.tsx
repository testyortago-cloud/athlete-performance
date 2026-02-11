import { notFound } from 'next/navigation';
import { getInjuryById } from '@/lib/services/injuryService';
import { getAthletes } from '@/lib/services/athleteService';
import { InjuryDetailClient } from './InjuryDetailClient';

interface InjuryPageProps {
  params: Promise<{ id: string }>;
}

export default async function InjuryDetailPage({ params }: InjuryPageProps) {
  const { id } = await params;
  const [injury, athletes] = await Promise.all([
    getInjuryById(id),
    getAthletes(),
  ]);

  if (!injury) notFound();

  const athlete = athletes.find((a) => a.id === injury.athleteId);

  return (
    <InjuryDetailClient
      injury={{ ...injury, athleteName: athlete?.name || 'Unknown' }}
      athletes={athletes}
    />
  );
}
