import { getRecords, TABLES, type TableName } from '@/lib/airtable';
import { createServerSupabaseClient } from '@/lib/supabase';

interface SyncOptions {
  tableName: TableName;
  supabaseTable: string;
  mapFields: (record: { id: string; fields: Record<string, unknown> }) => Record<string, unknown>;
}

async function syncTable({ tableName, supabaseTable, mapFields }: SyncOptions): Promise<number> {
  const supabase = createServerSupabaseClient();
  const records = await getRecords(tableName);

  const mapped = records.map((record) => ({
    id: record.id,
    ...mapFields(record),
    synced_at: new Date().toISOString(),
  }));

  if (mapped.length === 0) return 0;

  const { error } = await supabase
    .from(supabaseTable)
    .upsert(mapped, { onConflict: 'id' });

  if (error) throw new Error(`Sync ${supabaseTable} failed: ${error.message}`);

  // Log sync
  await supabase.from('sync_log').insert({
    table_name: supabaseTable,
    records_synced: mapped.length,
    synced_at: new Date().toISOString(),
  });

  return mapped.length;
}

export async function syncAllTables(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  // Sync in FK order
  results.sports = await syncTable({
    tableName: TABLES.SPORTS,
    supabaseTable: 'sports',
    mapFields: (r) => ({
      name: r.fields.Name,
      description: r.fields.Description || '',
    }),
  });

  results.training_programs = await syncTable({
    tableName: TABLES.TRAINING_PROGRAMS,
    supabaseTable: 'training_programs',
    mapFields: (r) => ({
      name: r.fields.Name,
      description: r.fields.Description || '',
    }),
  });

  results.metric_categories = await syncTable({
    tableName: TABLES.METRIC_CATEGORIES,
    supabaseTable: 'metric_categories',
    mapFields: (r) => ({
      sport_id: Array.isArray(r.fields.Sport) ? r.fields.Sport[0] : r.fields.Sport,
      name: r.fields.Name,
      sort_order: r.fields.SortOrder || 0,
    }),
  });

  results.metrics = await syncTable({
    tableName: TABLES.METRICS,
    supabaseTable: 'metrics',
    mapFields: (r) => ({
      category_id: Array.isArray(r.fields.Category) ? r.fields.Category[0] : r.fields.Category,
      sport_id: Array.isArray(r.fields.Sport) ? r.fields.Sport[0] : r.fields.Sport,
      name: r.fields.Name,
      unit: r.fields.Unit,
      is_derived: r.fields.IsDerived || false,
      formula: r.fields.Formula || null,
      best_score_method: r.fields.BestScoreMethod || 'highest',
      trial_count: r.fields.TrialCount || 3,
    }),
  });

  results.athletes = await syncTable({
    tableName: TABLES.ATHLETES,
    supabaseTable: 'athletes',
    mapFields: (r) => ({
      name: r.fields.Name,
      date_of_birth: r.fields.DateOfBirth,
      sport_id: Array.isArray(r.fields.Sport) ? r.fields.Sport[0] : r.fields.Sport,
      program_id: Array.isArray(r.fields.Program) ? r.fields.Program[0] : r.fields.Program || null,
      position: r.fields.Position,
      status: r.fields.Status || 'active',
    }),
  });

  results.testing_sessions = await syncTable({
    tableName: TABLES.TESTING_SESSIONS,
    supabaseTable: 'testing_sessions',
    mapFields: (r) => ({
      athlete_id: Array.isArray(r.fields.Athlete) ? r.fields.Athlete[0] : r.fields.Athlete,
      date: r.fields.Date,
      notes: r.fields.Notes || '',
      created_by: r.fields.CreatedBy || '',
    }),
  });

  results.trial_data = await syncTable({
    tableName: TABLES.TRIAL_DATA,
    supabaseTable: 'trial_data',
    mapFields: (r) => ({
      session_id: Array.isArray(r.fields.Session) ? r.fields.Session[0] : r.fields.Session,
      metric_id: Array.isArray(r.fields.Metric) ? r.fields.Metric[0] : r.fields.Metric,
      trial_1: r.fields.Trial_1 ?? null,
      trial_2: r.fields.Trial_2 ?? null,
      trial_3: r.fields.Trial_3 ?? null,
      best_score: r.fields.BestScore ?? null,
      average_score: r.fields.AverageScore ?? null,
    }),
  });

  results.injuries = await syncTable({
    tableName: TABLES.INJURIES,
    supabaseTable: 'injuries',
    mapFields: (r) => ({
      athlete_id: Array.isArray(r.fields.Athlete) ? r.fields.Athlete[0] : r.fields.Athlete,
      type: r.fields.Type || 'injury',
      description: r.fields.Description || '',
      mechanism: r.fields.Mechanism || '',
      body_region: r.fields.BodyRegion || '',
      date_occurred: r.fields.DateOccurred,
      date_resolved: r.fields.DateResolved || null,
      days_lost: r.fields.DaysLost ?? null,
      status: r.fields.Status || 'active',
    }),
  });

  results.daily_load = await syncTable({
    tableName: TABLES.DAILY_LOAD,
    supabaseTable: 'daily_load',
    mapFields: (r) => ({
      athlete_id: Array.isArray(r.fields.Athlete) ? r.fields.Athlete[0] : r.fields.Athlete,
      date: r.fields.Date,
      rpe: r.fields.RPE || 0,
      duration_minutes: r.fields.DurationMinutes || 0,
      training_load: r.fields.TrainingLoad || 0,
      session_type: r.fields.SessionType || '',
    }),
  });

  return results;
}
