import { notFound } from 'next/navigation';
import { getSportById } from '@/lib/services/sportService';
import { getCategoriesBySport, getMetricsBySport } from '@/lib/services/metricService';
import { SportDetailClient } from './SportDetailClient';

export const dynamic = 'force-dynamic';

interface SportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SportDetailPage({ params }: SportDetailPageProps) {
  const { id } = await params;
  const sport = await getSportById(id);
  if (!sport) notFound();

  const [categories, metrics] = await Promise.all([
    getCategoriesBySport(id),
    getMetricsBySport(id),
  ]);

  return <SportDetailClient sport={sport} categories={categories} metrics={metrics} />;
}
