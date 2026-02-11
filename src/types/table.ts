export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  filterType?: 'text' | 'select' | 'number';
  filterOptions?: { label: string; value: string }[];
}

export interface TableState {
  page: number;
  pageSize: number;
  sortField: string | null;
  sortDirection: SortDirection;
  filters: Record<string, string>;
  search: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
