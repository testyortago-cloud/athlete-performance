export interface ThresholdSettings {
  acwrModerate: number;
  acwrHigh: number;
  loadSpikePercent: number;
  defaultDays: number;
}

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  acwrModerate: 1.3,
  acwrHigh: 1.5,
  loadSpikePercent: 50,
  defaultDays: 30,
};
