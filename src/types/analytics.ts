export interface KpiCardData {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label: string;
  };
  icon?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: unknown;
}

export interface PerformanceTrend {
  date: string;
  metricName: string;
  bestScore: number;
  averageScore: number;
  athleteName?: string;
}

export interface InjurySummary {
  bodyRegion: string;
  count: number;
  daysLost: number;
}

export interface InjuryTypeSummary {
  type: string;
  count: number;
}

export interface LoadTrend {
  date: string;
  trainingLoad: number;
  rpe: number;
  athleteName?: string;
}

export interface RiskIndicator {
  athleteId: string;
  athleteName: string;
  acuteLoad: number;
  chronicLoad: number;
  acwr: number;
  riskLevel: 'low' | 'moderate' | 'high';
  activeInjuries: number;
}

export interface AthleteRanking {
  athleteId: string;
  athleteName: string;
  metricName: string;
  bestScore: number;
  rank: number;
}

export interface RiskAlert {
  athleteName: string;
  message: string;
  severity: 'warning' | 'danger';
  date: string;
}
