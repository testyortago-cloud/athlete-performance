import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { WellnessCheckin, WellnessCheckinFormData } from '@/types';

/**
 * Compute readiness score (0-100) from wellness dimensions.
 * Each dimension is on a 1-5 scale except sleepHours (0-12) which is mapped to 1-5.
 * Higher = better for sleep quality, mood, hydration.
 * Lower = better for soreness, fatigue (inverted).
 */
export function computeReadinessScore(data: {
  sleepHours: number;
  sleepQuality: number;
  soreness: number;
  fatigue: number;
  mood: number;
  hydration: number;
}): number {
  // Map sleep hours (4-10h) to 1-5 scale, clamped
  const sleepClamped = Math.max(4, Math.min(10, data.sleepHours));
  const sleepScore = 1 + ((sleepClamped - 4) / 6) * 4;

  // Invert soreness and fatigue (5 = worst → 1, 1 = best → 5)
  const sorenessInv = 6 - data.soreness;
  const fatigueInv = 6 - data.fatigue;

  const avg = (sleepScore + data.sleepQuality + sorenessInv + fatigueInv + data.mood + data.hydration) / 6;

  // Scale 1-5 average to 0-100
  return Math.round(((avg - 1) / 4) * 100);
}

function mapRecord(record: { id: string; fields: Record<string, unknown> }): WellnessCheckin {
  return {
    id: record.id,
    athleteId: Array.isArray(record.fields.Athletes) ? record.fields.Athletes[0] : (record.fields.Athletes as string) || '',
    athleteName: (record.fields.AthleteName as string) || undefined,
    date: (record.fields.Date as string) || '',
    sleepHours: (record.fields.SleepHours as number) || 0,
    sleepQuality: (record.fields.SleepQuality as number) || 1,
    soreness: (record.fields.Soreness as number) || 1,
    fatigue: (record.fields.Fatigue as number) || 1,
    mood: (record.fields.Mood as number) || 1,
    hydration: (record.fields.Hydration as number) || 1,
    readinessScore: (record.fields.ReadinessScore as number) || 0,
    createdAt: (record.fields.Created as string) || new Date().toISOString(),
  };
}

export async function getWellnessCheckins(options?: {
  athleteId?: string;
}): Promise<WellnessCheckin[]> {
  const records = await getRecords(TABLES.WELLNESS_CHECKINS, {
    sort: [{ field: 'Date', direction: 'desc' }],
  });

  let results = records.map(mapRecord);
  if (options?.athleteId) {
    results = results.filter((w) => w.athleteId === options.athleteId);
  }
  return results;
}

export async function getWellnessCheckinById(id: string): Promise<WellnessCheckin | null> {
  const record = await getRecordById(TABLES.WELLNESS_CHECKINS, id);
  if (!record) return null;
  return mapRecord(record);
}

export async function createWellnessCheckin(data: WellnessCheckinFormData): Promise<WellnessCheckin> {
  const readinessScore = computeReadinessScore(data);

  const record = await createRecord(TABLES.WELLNESS_CHECKINS, {
    Athletes: [data.athleteId],
    Date: data.date,
    SleepHours: data.sleepHours,
    SleepQuality: data.sleepQuality,
    Soreness: data.soreness,
    Fatigue: data.fatigue,
    Mood: data.mood,
    Hydration: data.hydration,
    ReadinessScore: readinessScore,
  });
  return mapRecord(record);
}

export async function updateWellnessCheckin(
  id: string,
  data: Partial<WellnessCheckinFormData>
): Promise<WellnessCheckin> {
  const fields: Record<string, unknown> = {};
  if (data.athleteId !== undefined) fields.Athlete = [data.athleteId];
  if (data.date !== undefined) fields.Date = data.date;
  if (data.sleepHours !== undefined) fields.SleepHours = data.sleepHours;
  if (data.sleepQuality !== undefined) fields.SleepQuality = data.sleepQuality;
  if (data.soreness !== undefined) fields.Soreness = data.soreness;
  if (data.fatigue !== undefined) fields.Fatigue = data.fatigue;
  if (data.mood !== undefined) fields.Mood = data.mood;
  if (data.hydration !== undefined) fields.Hydration = data.hydration;

  // Recompute readiness if any wellness field changed
  const wellnessFieldChanged = data.sleepHours !== undefined || data.sleepQuality !== undefined ||
    data.soreness !== undefined || data.fatigue !== undefined ||
    data.mood !== undefined || data.hydration !== undefined;

  if (wellnessFieldChanged) {
    const existing = await getWellnessCheckinById(id);
    const merged = {
      sleepHours: data.sleepHours ?? existing?.sleepHours ?? 0,
      sleepQuality: data.sleepQuality ?? existing?.sleepQuality ?? 1,
      soreness: data.soreness ?? existing?.soreness ?? 1,
      fatigue: data.fatigue ?? existing?.fatigue ?? 1,
      mood: data.mood ?? existing?.mood ?? 1,
      hydration: data.hydration ?? existing?.hydration ?? 1,
    };
    fields.ReadinessScore = computeReadinessScore(merged);
  }

  const record = await updateRecord(TABLES.WELLNESS_CHECKINS, id, fields);
  return mapRecord(record);
}

export async function deleteWellnessCheckin(id: string): Promise<void> {
  await deleteRecord(TABLES.WELLNESS_CHECKINS, id);
}
