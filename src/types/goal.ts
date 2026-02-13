export interface Goal {
  id: string;
  athleteId: string;
  metricId: string;
  metricName: string;
  targetValue: number;
  currentBest: number | null;
  direction: 'higher' | 'lower';
  deadline: string | null;
  status: GoalStatus;
  achievedDate: string | null;
  createdAt: string;
}

export type GoalStatus = 'active' | 'achieved' | 'expired';

export interface GoalFormData {
  athleteId: string;
  metricId: string;
  metricName: string;
  targetValue: number;
  direction: 'higher' | 'lower';
  deadline: string | null;
}
