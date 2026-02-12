import { Badge } from '@/components/ui/Badge';
import type { Injury, ColumnDef } from '@/types';

function getDaysLostVariant(days: number): 'default' | 'warning' | 'danger' {
  if (days >= 28) return 'danger';
  if (days >= 7) return 'warning';
  return 'default';
}

export const injuryColumns: ColumnDef<Injury>[] = [
  {
    key: 'athleteName',
    header: 'Athlete',
    sortable: true,
    filterable: true,
    filterType: 'text',
    render: (_value, injury) => (
      <span className="font-medium">{injury.athleteName}</span>
    ),
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
      { label: 'Rehab', value: 'rehab' },
      { label: 'Monitoring', value: 'monitoring' },
      { label: 'Resolved', value: 'resolved' },
    ],
    render: (value) => {
      const statusMap: Record<string, { variant: 'danger' | 'warning' | 'default' | 'success'; label: string }> = {
        active: { variant: 'danger', label: 'Active' },
        rehab: { variant: 'warning', label: 'Rehab' },
        monitoring: { variant: 'default', label: 'Monitoring' },
        resolved: { variant: 'success', label: 'Resolved' },
      };
      const config = statusMap[value as string] || statusMap.active;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    key: 'daysLost',
    header: 'Days Lost',
    sortable: true,
    render: (value, injury) => {
      if (injury.status !== 'resolved') {
        const daysSince = Math.ceil(
          (Date.now() - new Date(injury.dateOccurred).getTime()) / 86400000
        );
        return (
          <Badge variant="danger">
            {daysSince}d (ongoing)
          </Badge>
        );
      }
      if (value != null) {
        return (
          <Badge variant={getDaysLostVariant(value as number)}>
            {String(value)}d
          </Badge>
        );
      }
      return '—';
    },
  },
];
