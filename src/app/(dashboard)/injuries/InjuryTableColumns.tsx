import { Badge } from '@/components/ui/Badge';
import type { Injury, ColumnDef } from '@/types';

export const injuryColumns: ColumnDef<Injury>[] = [
  {
    key: 'athleteName',
    header: 'Athlete',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Injury', value: 'injury' },
      { label: 'Illness', value: 'illness' },
    ],
    render: (value) => (
      <Badge variant={value === 'injury' ? 'warning' : 'danger'}>
        {(value as string) === 'injury' ? 'Injury' : 'Illness'}
      </Badge>
    ),
  },
  {
    key: 'bodyRegion',
    header: 'Body Region',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    key: 'dateOccurred',
    header: 'Date Occurred',
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
    key: 'status',
    header: 'Status',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Resolved', value: 'resolved' },
    ],
    render: (value) => (
      <Badge variant={value === 'active' ? 'danger' : 'success'}>
        {(value as string) === 'active' ? 'Active' : 'Resolved'}
      </Badge>
    ),
  },
  {
    key: 'daysLost',
    header: 'Days Lost',
    sortable: true,
    render: (value, injury) => {
      if (injury.status === 'active') return 'Ongoing';
      return value != null ? String(value) : '—';
    },
  },
];
