import type { TestingSession, ColumnDef } from '@/types';

export const testingColumns: ColumnDef<TestingSession>[] = [
  {
    key: 'athleteName',
    header: 'Athlete',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    key: 'date',
    header: 'Date',
    sortable: true,
    render: (value) => {
      if (!value) return '—';
      return new Date(value as string).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    },
  },
  {
    key: 'notes',
    header: 'Notes',
    render: (value) => {
      const text = (value as string) || '';
      return text.length > 50 ? text.slice(0, 50) + '...' : text || '—';
    },
  },
  {
    key: 'createdBy',
    header: 'Created By',
    sortable: true,
  },
];
