import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { Athlete, ColumnDef } from '@/types';

export const athleteColumns: ColumnDef<Athlete>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    render: (_value, athlete) => (
      <div className="flex items-center gap-3">
        <Avatar
          src={athlete.photo?.thumbnails?.small?.url ?? athlete.photo?.url}
          name={athlete.name}
          size="sm"
        />
        <span>{athlete.name}</span>
      </div>
    ),
  },
  {
    key: 'sportName',
    header: 'Sport',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    key: 'programName',
    header: 'Program',
    sortable: true,
    filterable: true,
    filterType: 'text',
    render: (value) => (
      <span className="text-gray-700">{(value as string) || '—'}</span>
    ),
  },
  {
    key: 'position',
    header: 'Position',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
    render: (value) => (
      <Badge variant={value === 'active' ? 'success' : 'default'}>
        {(value as string) === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'dateOfBirth',
    header: 'Date of Birth',
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
];
