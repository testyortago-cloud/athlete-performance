import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { Injury, InjuryFormData } from '@/types';

function mapRecord(record: { id: string; fields: Record<string, unknown> }): Injury {
  return {
    id: record.id,
    athleteId: Array.isArray(record.fields.Athlete) ? record.fields.Athlete[0] : (record.fields.Athlete as string) || '',
    athleteName: (record.fields.AthleteName as string) || undefined,
    type: (((record.fields.Type as string) || 'Injury').toLowerCase()) as 'injury' | 'illness',
    description: (record.fields.Description as string) || '',
    mechanism: (record.fields.Mechanism as string) || '',
    bodyRegion: (record.fields.BodyRegion as string) || '',
    dateOccurred: (record.fields.DateOccurred as string) || '',
    dateResolved: (record.fields.DateResolved as string) || null,
    daysLost: (record.fields.DaysLost as number) ?? null,
    status: (((record.fields.Status as string) || 'Active').toLowerCase()) as Injury['status'],
    createdAt: (record.fields.Created as string) || new Date().toISOString(),
  };
}

export async function getInjuries(options?: {
  athleteId?: string;
  status?: string;
  search?: string;
}): Promise<Injury[]> {
  const filterParts: string[] = [];

  if (options?.athleteId) {
    filterParts.push(`FIND("${options.athleteId}", ARRAYJOIN({Athlete}))`);
  }
  if (options?.status) {
    const s = options.status.charAt(0).toUpperCase() + options.status.slice(1);
    filterParts.push(`{Status} = "${s}"`);
  }
  if (options?.search) {
    filterParts.push(`OR(FIND(LOWER("${options.search}"), LOWER({Description})), FIND(LOWER("${options.search}"), LOWER({BodyRegion})))`);
  }

  const filterByFormula = filterParts.length > 1
    ? `AND(${filterParts.join(', ')})`
    : filterParts[0] || '';

  const records = await getRecords(TABLES.INJURIES, {
    filterByFormula: filterByFormula || undefined,
    sort: [{ field: 'DateOccurred', direction: 'desc' }],
  });

  return records.map(mapRecord);
}

export async function getInjuryById(id: string): Promise<Injury | null> {
  const record = await getRecordById(TABLES.INJURIES, id);
  if (!record) return null;
  return mapRecord(record);
}

function computeDaysLost(dateOccurred: string, dateResolved: string | null): number | null {
  if (!dateResolved) return null;
  const occurred = new Date(dateOccurred).getTime();
  const resolved = new Date(dateResolved).getTime();
  return Math.ceil((resolved - occurred) / 86400000);
}

export async function createInjury(data: InjuryFormData): Promise<Injury> {
  const daysLost = computeDaysLost(data.dateOccurred, data.dateResolved);

  const record = await createRecord(TABLES.INJURIES, {
    Athlete: [data.athleteId],
    Type: data.type.charAt(0).toUpperCase() + data.type.slice(1),
    Description: data.description,
    Mechanism: data.mechanism,
    BodyRegion: data.bodyRegion,
    DateOccurred: data.dateOccurred,
    DateResolved: data.dateResolved,
    DaysLost: daysLost,
    Status: data.status.charAt(0).toUpperCase() + data.status.slice(1),
  });
  return mapRecord(record);
}

export async function updateInjury(id: string, data: Partial<InjuryFormData>): Promise<Injury> {
  const fields: Record<string, unknown> = {};
  if (data.athleteId !== undefined) fields.Athlete = [data.athleteId];
  if (data.type !== undefined) fields.Type = data.type.charAt(0).toUpperCase() + data.type.slice(1);
  if (data.description !== undefined) fields.Description = data.description;
  if (data.mechanism !== undefined) fields.Mechanism = data.mechanism;
  if (data.bodyRegion !== undefined) fields.BodyRegion = data.bodyRegion;
  if (data.dateOccurred !== undefined) fields.DateOccurred = data.dateOccurred;
  if (data.dateResolved !== undefined) fields.DateResolved = data.dateResolved;
  if (data.status !== undefined) fields.Status = data.status.charAt(0).toUpperCase() + data.status.slice(1);

  // Recompute daysLost if dates changed
  if (data.dateOccurred !== undefined || data.dateResolved !== undefined) {
    const existing = await getInjuryById(id);
    const occurred = data.dateOccurred ?? existing?.dateOccurred ?? '';
    const resolved = data.dateResolved !== undefined ? data.dateResolved : (existing?.dateResolved ?? null);
    fields.DaysLost = computeDaysLost(occurred, resolved);
  }

  const record = await updateRecord(TABLES.INJURIES, id, fields);
  return mapRecord(record);
}

export async function deleteInjury(id: string): Promise<void> {
  await deleteRecord(TABLES.INJURIES, id);
}
