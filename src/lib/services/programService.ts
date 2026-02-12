import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { TrainingProgram, TrainingProgramFormData } from '@/types';

function mapRecord(record: { id: string; fields: Record<string, unknown> }): TrainingProgram {
  return {
    id: record.id,
    name: (record.fields.Name as string) || '',
    description: (record.fields.Description as string) || '',
    startDate: (record.fields.StartDate as string) || null,
    durationWeeks: (record.fields.DurationWeeks as number) ?? null,
    createdAt: (record.fields.Created as string) || new Date().toISOString(),
  };
}

export async function getPrograms(): Promise<TrainingProgram[]> {
  const records = await getRecords(TABLES.TRAINING_PROGRAMS, {
    sort: [{ field: 'Name', direction: 'asc' }],
  });
  return records.map(mapRecord);
}

export async function getProgramById(id: string): Promise<TrainingProgram | null> {
  const record = await getRecordById(TABLES.TRAINING_PROGRAMS, id);
  if (!record) return null;
  return mapRecord(record);
}

export async function createProgram(data: TrainingProgramFormData): Promise<TrainingProgram> {
  const fields: Record<string, unknown> = {
    Name: data.name,
    Description: data.description || '',
  };
  if (data.startDate) fields.StartDate = data.startDate;
  if (data.durationWeeks) fields.DurationWeeks = data.durationWeeks;

  const record = await createRecord(TABLES.TRAINING_PROGRAMS, fields);
  return mapRecord(record);
}

export async function updateProgram(id: string, data: Partial<TrainingProgramFormData>): Promise<TrainingProgram> {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields.Name = data.name;
  if (data.description !== undefined) fields.Description = data.description;
  if (data.startDate !== undefined) fields.StartDate = data.startDate;
  if (data.durationWeeks !== undefined) fields.DurationWeeks = data.durationWeeks;

  const record = await updateRecord(TABLES.TRAINING_PROGRAMS, id, fields);
  return mapRecord(record);
}

export async function deleteProgram(id: string): Promise<void> {
  await deleteRecord(TABLES.TRAINING_PROGRAMS, id);
}
