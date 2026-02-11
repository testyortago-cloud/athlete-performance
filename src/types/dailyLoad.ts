export interface DailyLoad {
  id: string;
  athleteId: string;
  athleteName?: string;
  date: string;
  rpe: number;
  durationMinutes: number;
  trainingLoad: number;
  sessionType: string;
  createdAt: string;
}

export interface DailyLoadFormData {
  athleteId: string;
  date: string;
  rpe: number;
  durationMinutes: number;
  sessionType: string;
}
