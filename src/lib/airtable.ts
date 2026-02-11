import Airtable, { FieldSet } from 'airtable';

function getBase() {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY is not configured');
  }
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID!
  );
}

export const TABLES = {
  USERS: 'Users',
  ATHLETES: 'Athletes',
  SPORTS: 'Sports',
  TRAINING_PROGRAMS: 'Training_Programs',
  METRIC_CATEGORIES: 'Metric_Categories',
  METRICS: 'Metrics',
  TESTING_SESSIONS: 'Testing_Sessions',
  TRIAL_DATA: 'Trial_Data',
  INJURIES: 'Injuries',
  DAILY_LOAD: 'Daily_Load',
  SETTINGS: 'Settings',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

export async function getRecords(
  tableName: TableName,
  options?: {
    filterByFormula?: string;
    sort?: { field: string; direction?: 'asc' | 'desc' }[];
    maxRecords?: number;
    pageSize?: number;
  }
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  const query: Record<string, unknown> = {};

  if (options?.filterByFormula) query.filterByFormula = options.filterByFormula;
  if (options?.sort) query.sort = options.sort;
  if (options?.maxRecords) query.maxRecords = options.maxRecords;
  if (options?.pageSize) query.pageSize = options.pageSize;

  await getBase()(tableName)
    .select(query)
    .eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push({ id: record.id, fields: record.fields as Record<string, unknown> });
      });
      fetchNextPage();
    });

  return records;
}

export async function getRecordById(
  tableName: TableName,
  id: string
): Promise<AirtableRecord | null> {
  try {
    const record = await getBase()(tableName).find(id);
    return { id: record.id, fields: record.fields as Record<string, unknown> };
  } catch {
    return null;
  }
}

export async function createRecord(
  tableName: TableName,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  const record = await getBase()(tableName).create(fields as Partial<FieldSet>);
  return { id: record.id, fields: record.fields as Record<string, unknown> };
}

export async function updateRecord(
  tableName: TableName,
  id: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  const record = await getBase()(tableName).update(id, fields as Partial<FieldSet>);
  return { id: record.id, fields: record.fields as Record<string, unknown> };
}

export async function deleteRecord(
  tableName: TableName,
  id: string
): Promise<void> {
  await getBase()(tableName).destroy(id);
}

export async function getUserByEmail(email: string) {
  const records = await getRecords(TABLES.USERS, {
    filterByFormula: `{Email} = '${email}'`,
    maxRecords: 1,
  });
  if (records.length === 0) return null;
  const r = records[0];
  return {
    id: r.id,
    name: r.fields.Name as string,
    email: r.fields.Email as string,
    passwordHash: r.fields.PasswordHash as string,
    role: (r.fields.Role as string) || 'admin',
  };
}
