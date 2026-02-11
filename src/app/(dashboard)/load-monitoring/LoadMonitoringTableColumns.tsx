import { Badge } from '@/components/ui/Badge';
import type { DailyLoad, ColumnDef } from '@/types';

function getRpeBadgeVariant(rpe: number): 'success' | 'warning' | 'danger' {
  if (rpe <= 3) return 'success';
  if (rpe <= 6) return 'warning';
  return 'danger';
}

export const loadMonitoringColumns: ColumnDef<DailyLoad>[] = [
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
    key: 'rpe',
    header: 'RPE',
    sortable: true,
    render: (value) => {
      const rpe = value as number;
      return (
        <Badge variant={getRpeBadgeVariant(rpe)}>
          {rpe}
        </Badge>
      );
    },
  },
  {
    key: 'durationMinutes',
    header: 'Duration',
    sortable: true,
    render: (value) => `${value} min`,
  },
  {
    key: 'trainingLoad',
    header: 'Training Load',
    sortable: true,
  },
  {
    key: 'sessionType',
    header: 'Session Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Training', value: 'Training' },
      { label: 'Match', value: 'Match' },
      { label: 'Gym', value: 'Gym' },
      { label: 'Conditioning', value: 'Conditioning' },
      { label: 'Recovery', value: 'Recovery' },
      { label: 'Other', value: 'Other' },
    ],
  },
];
