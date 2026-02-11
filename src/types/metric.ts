export type BestScoreMethod = 'highest' | 'lowest';

export interface MetricCategory {
  id: string;
  sportId: string;
  name: string;
  sortOrder: number;
}

export interface MetricCategoryFormData {
  sportId: string;
  name: string;
  sortOrder: number;
}

export interface Metric {
  id: string;
  categoryId: string;
  sportId: string;
  name: string;
  unit: string;
  isDerived: boolean;
  formula: string | null;
  bestScoreMethod: BestScoreMethod;
  trialCount: number;
  createdAt: string;
}

export interface MetricFormData {
  categoryId: string;
  sportId: string;
  name: string;
  unit: string;
  isDerived: boolean;
  formula?: string;
  bestScoreMethod: BestScoreMethod;
  trialCount: number;
}
