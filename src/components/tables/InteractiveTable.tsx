'use client';

import { useState, useMemo, useCallback } from 'react';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TablePagination } from './TablePagination';
import { SearchInput } from '@/components/ui/SearchInput';
import type { ColumnDef, SortDirection } from '@/types';

interface InteractiveTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  totalItems?: number;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  serverSide?: boolean;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onStateChange?: (state: {
    page: number;
    pageSize: number;
    sortField: string | null;
    sortDirection: SortDirection;
    filters: Record<string, string>;
    search: string;
  }) => void;
}

export function InteractiveTable<T extends { id?: string }>({
  columns,
  data,
  totalItems: externalTotalItems,
  isLoading,
  onRowClick,
  enableSearch = true,
  searchPlaceholder = 'Search...',
  serverSide = false,
  enableSelection = false,
  selectedIds,
  onSelectionChange,
  onStateChange,
}: InteractiveTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const notify = useCallback(
    (updates: Partial<{
      page: number;
      pageSize: number;
      sortField: string | null;
      sortDirection: SortDirection;
      filters: Record<string, string>;
      search: string;
    }>) => {
      if (serverSide && onStateChange) {
        onStateChange({
          page: updates.page ?? page,
          pageSize: updates.pageSize ?? pageSize,
          sortField: updates.sortField !== undefined ? updates.sortField : sortField,
          sortDirection: updates.sortDirection !== undefined ? updates.sortDirection : sortDirection,
          filters: updates.filters ?? filters,
          search: updates.search ?? search,
        });
      }
    },
    [serverSide, onStateChange, page, pageSize, sortField, sortDirection, filters, search]
  );

  function handleSort(field: string) {
    let newDirection: SortDirection;
    if (sortField === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc';
    } else {
      newDirection = 'asc';
    }
    const newField = newDirection ? field : null;
    setSortField(newField);
    setSortDirection(newDirection);
    setPage(1);
    notify({ sortField: newField, sortDirection: newDirection, page: 1 });
  }

  function handleFilter(field: string, value: string) {
    const newFilters = { ...filters, [field]: value };
    if (!value) delete newFilters[field];
    setFilters(newFilters);
    setPage(1);
    notify({ filters: newFilters, page: 1 });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    notify({ search: value, page: 1 });
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    notify({ page: newPage });
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPage(1);
    notify({ pageSize: newSize, page: 1 });
  }

  // Client-side processing
  const processedData = useMemo(() => {
    if (serverSide) return data;

    let result = [...data];

    // Search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = (row as Record<string, unknown>)[String(col.key)];
          return val != null && String(val).toLowerCase().includes(lowerSearch);
        })
      );
    }

    // Filters
    for (const [field, value] of Object.entries(filters)) {
      if (!value) continue;
      result = result.filter((row) => {
        const val = (row as Record<string, unknown>)[field];
        return val != null && String(val).toLowerCase().includes(value.toLowerCase());
      });
    }

    // Sort
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortField];
        const bVal = (b as Record<string, unknown>)[sortField];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, filters, sortField, sortDirection, serverSide, columns]);

  const totalItems = serverSide
    ? (externalTotalItems ?? data.length)
    : processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedData = serverSide
    ? processedData
    : processedData.slice((page - 1) * pageSize, page * pageSize);

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  // Selection helpers
  const pageIds = paginatedData.map((r) => r.id).filter(Boolean) as string[];
  const allPageSelected = enableSelection && pageIds.length > 0 && pageIds.every((id) => selectedIds?.has(id));
  const somePageSelected = enableSelection && pageIds.some((id) => selectedIds?.has(id));

  function handleToggleAll() {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (allPageSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    onSelectionChange(next);
  }

  function handleToggleRow(id: string) {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      {enableSearch && (
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <SearchInput
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder={searchPlaceholder}
            className="max-w-sm flex-1"
          />
          <span className="text-sm text-gray-400">
            {totalItems > 0 ? `${start}\u2013${end} of ${totalItems}` : '0 results'}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            filters={filters}
            onFilter={handleFilter}
            showCheckbox={enableSelection}
            allSelected={allPageSelected}
            someSelected={somePageSelected}
            onToggleAll={handleToggleAll}
          />
          <TableBody
            columns={columns}
            data={paginatedData}
            onRowClick={onRowClick}
            isLoading={isLoading}
            showCheckbox={enableSelection}
            selectedIds={selectedIds}
            onToggleRow={handleToggleRow}
          />
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
