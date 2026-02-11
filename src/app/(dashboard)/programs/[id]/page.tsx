import { notFound } from 'next/navigation';
import { getProgramById } from '@/lib/services/programService';
import { getAthletes } from '@/lib/services/athleteService';
import { ProgramDetailClient } from './ProgramDetailClient';

export const dynamic = 'force-dynamic';

interface ProgramDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id } = await params;
  const program = await getProgramById(id);
  if (!program) notFound();

  const allAthletes = await getAthletes();
  const athletes = allAthletes.filter((a) => a.programId === id);

  return <ProgramDetailClient program={program} athletes={athletes} />;
}
