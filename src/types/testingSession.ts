import type { BestScoreMethod, Metric, MetricCategory } from './metric';

export interface TestingSession {
  id: string;
  athleteId: string;
  athleteName?: string;
  date: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface TestingSessionFormData {
  athleteId: string;
  date: string;
  notes: string;
}

export interface TrialData {
  id: string;
  sessionId: string;
  metricId: string;
  trial1: number | null;
  trial2: number | null;
  trial3: number | null;
  reps1: number | null;
  reps2: number | null;
  reps3: number | null;
  bestScore: number | null;
  averageScore: number | null;
}

export interface TrialDataFormData {
  sessionId: string;
  metricId: string;
  trial1: number | null;
  trial2: number | null;
  trial3: number | null;
  reps1: number | null;
  reps2: number | null;
  reps3: number | null;
  bestScore: number | null;
  averageScore: number | null;
}

export interface MetricWithTrials {
  metric: Metric;
  trial1: number | null;
  trial2: number | null;
  trial3: number | null;
  reps1: number | null;
  reps2: number | null;
  reps3: number | null;
  bestScore: number | null;
  averageScore: number | null;
  existingTrialDataId?: string;
}

export interface CategoryWithMetrics {
  category: MetricCategory;
  metrics: MetricWithTrials[];
}
