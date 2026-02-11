'use client';

import { cn } from '@/utils/cn';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ColumnFilter } from './ColumnFilter';
import type { ColumnDef, SortDirection } from '@/types';

interface TableHeaderProps<T> {
  columns: ColumnDef<T>[];
  sortField: string | null;
  sortDirection: SortDirection;
  onSort: (field: string) => void;
  filters: Record<string, string>;
  onFilter: (field: string, value: string) => void;
}

export function TableHeader<T>({
  columns,
  sortField,
  sortDirection,
  onSort,
  filters,
  onFilter,
}: TableHeaderProps<T>) {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/60">
        {columns.map((col) => {
          const key = String(col.key);
          const isCurrentSort = sortField === key;

          return (
            <th
              key={key}
              className={cn(
                'px-4 py-3 text-left text-sm font-medium text-gray-500',
                col.sortable && 'cursor-pointer select-none hover:text-black'
              )}
              style={col.width ? { width: col.width } : undefined}
              onClick={() => col.sortable && onSort(key)}
            >
              <div className="flex items-center gap-1">
                <span>{col.header}</span>
                {col.sortable && (
                  <span className="inline-flex">
                    {isCurrentSort ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                    )}
                  </span>
                )}
                {col.filterable && (
                  <ColumnFilter
                    type={col.filterType || 'text'}
                    value={filters[key] || ''}
                    onChange={(val) => onFilter(key, val)}
                    options={col.filterOptions}
                    columnName={col.header}
                  />
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
