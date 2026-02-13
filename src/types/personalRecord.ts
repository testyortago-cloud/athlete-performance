import type { BestScoreMethod } from './metric';

export interface PersonalRecord {
  metricId: string;
  metricName: string;
  metricUnit: string;
  prValue: number;
  dateAchieved: string;
  isRecent: boolean;
  bestScoreMethod: BestScoreMethod;
}
