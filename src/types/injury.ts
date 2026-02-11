export type InjuryType = 'injury' | 'illness';
export type InjuryStatus = 'active' | 'resolved';

export interface Injury {
  id: string;
  athleteId: string;
  athleteName?: string;
  type: InjuryType;
  description: string;
  mechanism: string;
  bodyRegion: string;
  dateOccurred: string;
  dateResolved: string | null;
  daysLost: number | null;
  status: InjuryStatus;
  createdAt: string;
}

export interface InjuryFormData {
  athleteId: string;
  type: InjuryType;
  description: string;
  mechanism: string;
  bodyRegion: string;
  dateOccurred: string;
  dateResolved: string | null;
  status: InjuryStatus;
}
