export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails?: {
    small: { url: string; width: number; height: number };
    large: { url: string; width: number; height: number };
    full: { url: string; width: number; height: number };
  };
}

export interface Athlete {
  id: string;
  name: string;
  dateOfBirth: string;
  sportId: string;
  sportName?: string;
  programId?: string;
  programName?: string;
  position: string;
  status: 'active' | 'inactive';
  notes?: string;
  photo?: AirtableAttachment;
  createdAt: string;
}

export interface AthleteFormData {
  name: string;
  dateOfBirth: string;
  sportId: string;
  programId?: string;
  position: string;
  status: 'active' | 'inactive';
  photoUrl?: string;
}

export interface AthleteListFilters {
  search?: string;
  sportId?: string;
  status?: 'active' | 'inactive';
  page?: number;
  pageSize?: number;
  sortField?: keyof Athlete;
  sortDirection?: 'asc' | 'desc';
}
