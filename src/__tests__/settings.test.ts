import { describe, it, expect } from 'vitest';
import { DEFAULT_THRESHOLDS } from '@/types/settings';
import { computeRiskLevel, computeRiskAlerts } from '@/lib/services/analyticsService';

describe('ThresholdSettings defaults', () => {
  it('has correct default values', () => {
    expect(DEFAULT_THRESHOLDS.acwrModerate).toBe(1.3);
    expect(DEFAULT_THRESHOLDS.acwrHigh).toBe(1.5);
    expect(DEFAULT_THRESHOLDS.loadSpikePercent).toBe(50);
    expect(DEFAULT_THRESHOLDS.defaultDays).toBe(30);
  });
});

describe('computeRiskLevel with custom thresholds', () => {
  it('uses default thresholds when none provided', () => {
    expect(computeRiskLevel(1.0)).toBe('low');
    expect(computeRiskLevel(1.4)).toBe('moderate');
    expect(computeRiskLevel(1.6)).toBe('high');
  });

  it('uses custom thresholds when provided', () => {
    const thresholds = { acwrModerate: 1.1, acwrHigh: 1.3 };

    expect(computeRiskLevel(1.0, thresholds)).toBe('low');
    expect(computeRiskLevel(1.1, thresholds)).toBe('low');
    expect(computeRiskLevel(1.2, thresholds)).toBe('moderate');
    expect(computeRiskLevel(1.3, thresholds)).toBe('moderate');
    expect(computeRiskLevel(1.4, thresholds)).toBe('high');
  });

  it('uses relaxed thresholds', () => {
    const thresholds = { acwrModerate: 1.5, acwrHigh: 2.0 };

    expect(computeRiskLevel(1.4, thresholds)).toBe('low');
    expect(computeRiskLevel(1.6, thresholds)).toBe('moderate');
    expect(computeRiskLevel(2.1, thresholds)).toBe('high');
  });
});

describe('computeRiskAlerts with custom thresholds', () => {
  const makeIndicator = (acwr: number) => ({
    athleteId: 'ath-1',
    athleteName: 'Test Athlete',
    acuteLoad: 1000,
    chronicLoad: 1000,
    acwr,
    riskLevel: 'low' as const,
    activeInjuries: 0,
  });

  it('uses default thresholds when none provided', () => {
    const alerts = computeRiskAlerts([makeIndicator(1.4)]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('warning');
  });

  it('uses custom thresholds for alert generation', () => {
    const thresholds = { acwrModerate: 1.1, acwrHigh: 1.3 };

    // 1.2 is between custom moderate (1.1) and custom high (1.3)
    const warningAlerts = computeRiskAlerts([makeIndicator(1.2)], thresholds);
    expect(warningAlerts).toHaveLength(1);
    expect(warningAlerts[0].severity).toBe('warning');

    // 1.4 is above custom high (1.3)
    const dangerAlerts = computeRiskAlerts([makeIndicator(1.4)], thresholds);
    expect(dangerAlerts).toHaveLength(1);
    expect(dangerAlerts[0].severity).toBe('danger');

    // 1.0 is below custom moderate (1.1)
    const noAlerts = computeRiskAlerts([makeIndicator(1.0)], thresholds);
    expect(noAlerts).toHaveLength(0);
  });
});
