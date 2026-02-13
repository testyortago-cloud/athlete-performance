export interface WeeklyVolumeSummary {
  currentWeek: {
    sessions: number;
    totalLoad: number;
    avgRpe: number;
  };
  previousWeek: {
    sessions: number;
    totalLoad: number;
    avgRpe: number;
  };
  changes: {
    sessionsPercent: number | null;
    loadPercent: number | null;
    rpePercent: number | null;
  };
}
