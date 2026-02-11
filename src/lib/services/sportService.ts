import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { Sport, SportFormData } from '@/types';

function mapRecord(record: { id: string; fields: Record<string, unknown> }): Sport {
  return {
    id: record.id,
    name: (record.fields.Name as string) || '',
    description: (record.fields.Description as string) || '',
    createdAt: (record.fields.Created as string) || new Date().toISOString(),
  };
}

export async function getSports(): Promise<Sport[]> {
  const records = await getRecords(TABLES.SPORTS, {
    sort: [{ field: 'Name', direction: 'asc' }],
  });
  return records.map(mapRecord);
}

export async function getSportById(id: string): Promise<Sport | null> {
  const record = await getRecordById(TABLES.SPORTS, id);
  if (!record) return null;
  return mapRecord(record);
}

export async function createSport(data: SportFormData): Promise<Sport> {
  const record = await createRecord(TABLES.SPORTS, {
    Name: data.name,
    Description: data.description || '',
  });
  return mapRecord(record);
}

export async function updateSport(id: string, data: Partial<SportFormData>): Promise<Sport> {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields.Name = data.name;
  if (data.description !== undefined) fields.Description = data.description;

  const record = await updateRecord(TABLES.SPORTS, id, fields);
  return mapRecord(record);
}

export async function deleteSport(id: string): Promise<void> {
  await deleteRecord(TABLES.SPORTS, id);
}
