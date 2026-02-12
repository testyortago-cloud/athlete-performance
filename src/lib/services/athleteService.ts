import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { Athlete, AthleteFormData, AirtableAttachment } from '@/types';

function mapRecord(record: { id: string; fields: Record<string, unknown> }): Athlete {
  const photos = record.fields.Photo as AirtableAttachment[] | undefined;
  return {
    id: record.id,
    name: (record.fields.Name as string) || '',
    dateOfBirth: (record.fields.DateOfBirth as string) || '',
    sportId: Array.isArray(record.fields.Sport) ? record.fields.Sport[0] : (record.fields.Sport as string) || '',
    sportName: (record.fields.SportName as string) || undefined,
    programId: Array.isArray(record.fields.Program) ? record.fields.Program[0] : (record.fields.Program as string) || undefined,
    programName: (record.fields.ProgramName as string) || undefined,
    position: (record.fields.Position as string) || '',
    status: (((record.fields.Status as string) || 'Active').toLowerCase()) as 'active' | 'inactive',
    notes: (record.fields.Notes as string) || undefined,
    photo: photos?.[0] || undefined,
    createdAt: (record.fields.Created as string) || new Date().toISOString(),
  };
}

export async function getAthletes(options?: {
  search?: string;
  sportId?: string;
  status?: string;
}): Promise<Athlete[]> {
  const filterParts: string[] = [];

  if (options?.search) {
    filterParts.push(`FIND(LOWER("${options.search}"), LOWER({Name}))`);
  }
  if (options?.status) {
    const s = options.status.charAt(0).toUpperCase() + options.status.slice(1);
    filterParts.push(`{Status} = "${s}"`);
  }

  const filterByFormula = filterParts.length > 1
    ? `AND(${filterParts.join(', ')})`
    : filterParts[0] || '';

  const records = await getRecords(TABLES.ATHLETES, {
    filterByFormula: filterByFormula || undefined,
    sort: [{ field: 'Name', direction: 'asc' }],
  });

  let results = records.map(mapRecord);
  if (options?.sportId) {
    results = results.filter((a) => a.sportId === options.sportId);
  }
  return results;
}

export async function getAthleteById(id: string): Promise<Athlete | null> {
  const record = await getRecordById(TABLES.ATHLETES, id);
  if (!record) return null;
  return mapRecord(record);
}

export async function createAthlete(data: AthleteFormData): Promise<Athlete> {
  const record = await createRecord(TABLES.ATHLETES, {
    Name: data.name,
    DateOfBirth: data.dateOfBirth,
    Sport: [data.sportId],
    ...(data.programId ? { Program: [data.programId] } : {}),
    Position: data.position,
    Status: data.status.charAt(0).toUpperCase() + data.status.slice(1),
    ...(data.photoUrl ? { Photo: [{ url: data.photoUrl }] } : {}),
  });
  return mapRecord(record);
}

export async function updateAthlete(id: string, data: Partial<AthleteFormData>): Promise<Athlete> {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields.Name = data.name;
  if (data.dateOfBirth !== undefined) fields.DateOfBirth = data.dateOfBirth;
  if (data.sportId !== undefined) fields.Sport = [data.sportId];
  if (data.programId !== undefined) fields.Program = data.programId ? [data.programId] : [];
  if (data.position !== undefined) fields.Position = data.position;
  if (data.status !== undefined) fields.Status = data.status.charAt(0).toUpperCase() + data.status.slice(1);
  if (data.photoUrl) fields.Photo = [{ url: data.photoUrl }];

  const record = await updateRecord(TABLES.ATHLETES, id, fields);
  return mapRecord(record);
}

export async function updateAthleteNotes(id: string, notes: string): Promise<Athlete> {
  const record = await updateRecord(TABLES.ATHLETES, id, { Notes: notes });
  return mapRecord(record);
}

export async function deleteAthlete(id: string): Promise<void> {
  await deleteRecord(TABLES.ATHLETES, id);
}
