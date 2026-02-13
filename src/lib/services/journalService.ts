import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { JournalEntry, JournalEntryFormData } from '@/types';

function mapRecord(r: { id: string; fields: Record<string, unknown> }): JournalEntry {
  const rawTags = r.fields.Tags;
  let tags: string[] = [];
  if (typeof rawTags === 'string') {
    tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
  } else if (Array.isArray(rawTags)) {
    tags = rawTags as string[];
  }

  return {
    id: r.id,
    athleteId: (r.fields.AthleteId as string[] | undefined)?.[0] || (r.fields.AthleteId as string) || '',
    date: (r.fields.Date as string) || '',
    content: (r.fields.Content as string) || '',
    tags,
    createdAt: (r.fields.CreatedAt as string) || new Date().toISOString(),
  };
}

export async function getJournalEntries(filters?: { athleteId?: string; tag?: string }): Promise<JournalEntry[]> {
  const records = await getRecords(TABLES.JOURNAL_ENTRIES, {
    sort: [{ field: 'Date', direction: 'desc' }],
  });
  let entries = records.map(mapRecord);
  if (filters?.athleteId) {
    entries = entries.filter((e) => e.athleteId === filters.athleteId);
  }
  if (filters?.tag) {
    entries = entries.filter((e) => e.tags.includes(filters.tag!));
  }
  return entries;
}

export async function getJournalEntryById(id: string): Promise<JournalEntry | null> {
  const r = await getRecordById(TABLES.JOURNAL_ENTRIES, id);
  return r ? mapRecord(r) : null;
}

export async function createJournalEntry(data: JournalEntryFormData): Promise<JournalEntry> {
  const r = await createRecord(TABLES.JOURNAL_ENTRIES, {
    AthleteId: [data.athleteId],
    Date: data.date,
    Content: data.content,
    Tags: data.tags.join(','),
    CreatedAt: new Date().toISOString(),
  });
  return mapRecord(r);
}

export async function updateJournalEntry(id: string, data: Partial<JournalEntryFormData>): Promise<JournalEntry> {
  const fields: Record<string, unknown> = {};
  if (data.date !== undefined) fields.Date = data.date;
  if (data.content !== undefined) fields.Content = data.content;
  if (data.tags !== undefined) fields.Tags = data.tags.join(',');
  const r = await updateRecord(TABLES.JOURNAL_ENTRIES, id, fields);
  return mapRecord(r);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await deleteRecord(TABLES.JOURNAL_ENTRIES, id);
}
