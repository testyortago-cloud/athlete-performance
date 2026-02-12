import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { DailyLoad, DailyLoadFormData } from '@/types';

function mapRecord(record: { id: string; fields: Record<string, unknown> }): DailyLoad {
  return {
    id: record.id,
    athleteId: Array.isArray(record.fields.Athlete) ? record.fields.Athlete[0] : (record.fields.Athlete as string) || '',
    athleteName: (record.fields.AthleteName as string) || undefined,
    date: (record.fields.Date as string) || '',
    rpe: (record.fields.RPE as number) || 0,
    durationMinutes: (record.fields.DurationMinutes as number) || 0,
    trainingLoad: (record.fields.TrainingLoad as number) || 0,
    sessionType: (record.fields.SessionType as string) || '',
    createdAt: (record.fields.Created as string) || new Date().toISOString(),
  };
}

export async function getDailyLoads(options?: {
  athleteId?: string;
}): Promise<DailyLoad[]> {
  const records = await getRecords(TABLES.DAILY_LOAD, {
    sort: [{ field: 'Date', direction: 'desc' }],
  });

  let results = records.map(mapRecord);
  if (options?.athleteId) {
    results = results.filter((d) => d.athleteId === options.athleteId);
  }
  return results;
}

export async function getDailyLoadById(id: string): Promise<DailyLoad | null> {
  const record = await getRecordById(TABLES.DAILY_LOAD, id);
  if (!record) return null;
  return mapRecord(record);
}

export async function createDailyLoad(data: DailyLoadFormData): Promise<DailyLoad> {
  const trainingLoad = data.rpe * data.durationMinutes;

  const record = await createRecord(TABLES.DAILY_LOAD, {
    Athlete: [data.athleteId],
    Date: data.date,
    RPE: data.rpe,
    DurationMinutes: data.durationMinutes,
    TrainingLoad: trainingLoad,
    SessionType: data.sessionType,
  });
  return mapRecord(record);
}

export async function updateDailyLoad(id: string, data: Partial<DailyLoadFormData>): Promise<DailyLoad> {
  const fields: Record<string, unknown> = {};
  if (data.athleteId !== undefined) fields.Athlete = [data.athleteId];
  if (data.date !== undefined) fields.Date = data.date;
  if (data.rpe !== undefined) fields.RPE = data.rpe;
  if (data.durationMinutes !== undefined) fields.DurationMinutes = data.durationMinutes;
  if (data.sessionType !== undefined) fields.SessionType = data.sessionType;

  // Recompute trainingLoad if rpe or duration changed
  if (data.rpe !== undefined || data.durationMinutes !== undefined) {
    const existing = await getDailyLoadById(id);
    const rpe = data.rpe ?? existing?.rpe ?? 0;
    const duration = data.durationMinutes ?? existing?.durationMinutes ?? 0;
    fields.TrainingLoad = rpe * duration;
  }

  const record = await updateRecord(TABLES.DAILY_LOAD, id, fields);
  return mapRecord(record);
}

export async function deleteDailyLoad(id: string): Promise<void> {
  await deleteRecord(TABLES.DAILY_LOAD, id);
}
