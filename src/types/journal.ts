export interface JournalEntry {
  id: string;
  athleteId: string;
  date: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export type JournalTag = 'technique' | 'mindset' | 'nutrition' | 'recovery' | 'general';

export const JOURNAL_TAGS: { value: JournalTag; label: string }[] = [
  { value: 'technique', label: 'Technique' },
  { value: 'mindset', label: 'Mindset' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'general', label: 'General' },
];

export interface JournalEntryFormData {
  athleteId: string;
  date: string;
  content: string;
  tags: string[];
}
