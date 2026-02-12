import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { TestingSession, TestingSessionFormData, TrialData, TrialDataFormData } from '@/types';

function mapSession(record: { id: string; fields: Record<string, unknown> }): TestingSession {
  return {
    id: record.id,
    athleteId: Array.isArray(record.fields.Athlete) ? record.fields.Athlete[0] : (record.fields.Athlete as string) || '',
    athleteName: (record.fields.AthleteName as string) || undefined,
    date: (record.fields.Date as string) || '',
    notes: (record.fields.Notes as string) || '',
    createdBy: (record.fields.CreatedBy as string) || '',
    createdAt: (record.fields.Created as string) || new Date().toISOString(),
  };
}

function mapTrialData(record: { id: string; fields: Record<string, unknown> }): TrialData {
  return {
    id: record.id,
    sessionId: Array.isArray(record.fields.Session) ? record.fields.Session[0] : (record.fields.Session as string) || '',
    metricId: Array.isArray(record.fields.Metric) ? record.fields.Metric[0] : (record.fields.Metric as string) || '',
    trial1: (record.fields.Trial_1 as number) ?? null,
    trial2: (record.fields.Trial_2 as number) ?? null,
    trial3: (record.fields.Trial_3 as number) ?? null,
    reps1: (record.fields.Reps_1 as number) ?? null,
    reps2: (record.fields.Reps_2 as number) ?? null,
    reps3: (record.fields.Reps_3 as number) ?? null,
    bestScore: (record.fields.BestScore as number) ?? null,
    averageScore: (record.fields.AverageScore as number) ?? null,
  };
}

export async function getTestingSessions(options?: {
  athleteId?: string;
}): Promise<TestingSession[]> {
  const records = await getRecords(TABLES.TESTING_SESSIONS, {
    sort: [{ field: 'Date', direction: 'desc' }],
  });

  let results = records.map(mapSession);
  if (options?.athleteId) {
    results = results.filter((s) => s.athleteId === options.athleteId);
  }
  return results;
}

export async function getTestingSessionById(id: string): Promise<TestingSession | null> {
  const record = await getRecordById(TABLES.TESTING_SESSIONS, id);
  if (!record) return null;
  return mapSession(record);
}

export async function createTestingSession(data: TestingSessionFormData, createdBy: string): Promise<TestingSession> {
  const record = await createRecord(TABLES.TESTING_SESSIONS, {
    Athlete: [data.athleteId],
    Date: data.date,
    Notes: data.notes,
    CreatedBy: createdBy,
  });
  return mapSession(record);
}

export async function updateTestingSession(id: string, data: Partial<TestingSessionFormData>): Promise<TestingSession> {
  const fields: Record<string, unknown> = {};
  if (data.athleteId !== undefined) fields.Athlete = [data.athleteId];
  if (data.date !== undefined) fields.Date = data.date;
  if (data.notes !== undefined) fields.Notes = data.notes;

  const record = await updateRecord(TABLES.TESTING_SESSIONS, id, fields);
  return mapSession(record);
}

export async function deleteTestingSession(id: string): Promise<void> {
  await deleteRecord(TABLES.TESTING_SESSIONS, id);
}

export async function getTrialDataBySession(sessionId: string): Promise<TrialData[]> {
  const records = await getRecords(TABLES.TRIAL_DATA);
  return records.map(mapTrialData).filter((t) => t.sessionId === sessionId);
}

export async function createTrialData(data: TrialDataFormData): Promise<TrialData> {
  const record = await createRecord(TABLES.TRIAL_DATA, {
    Session: [data.sessionId],
    Metric: [data.metricId],
    Trial_1: data.trial1,
    Trial_2: data.trial2,
    Trial_3: data.trial3,
    Reps_1: data.reps1,
    Reps_2: data.reps2,
    Reps_3: data.reps3,
    BestScore: data.bestScore,
    AverageScore: data.averageScore,
  });
  return mapTrialData(record);
}

export async function updateTrialData(id: string, data: Partial<TrialDataFormData>): Promise<TrialData> {
  const fields: Record<string, unknown> = {};
  if (data.trial1 !== undefined) fields.Trial_1 = data.trial1;
  if (data.trial2 !== undefined) fields.Trial_2 = data.trial2;
  if (data.trial3 !== undefined) fields.Trial_3 = data.trial3;
  if (data.reps1 !== undefined) fields.Reps_1 = data.reps1;
  if (data.reps2 !== undefined) fields.Reps_2 = data.reps2;
  if (data.reps3 !== undefined) fields.Reps_3 = data.reps3;
  if (data.bestScore !== undefined) fields.BestScore = data.bestScore;
  if (data.averageScore !== undefined) fields.AverageScore = data.averageScore;

  const record = await updateRecord(TABLES.TRIAL_DATA, id, fields);
  return mapTrialData(record);
}
