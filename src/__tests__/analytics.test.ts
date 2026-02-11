import { describe, it, expect } from 'vitest';
import {
  computeRiskLevel,
  computeAthleteRiskIndicators,
  computeInjurySummaryByBodyRegion,
  computeInjurySummaryByType,
  computeLoadTrends,
  computeAthleteLoadTrends,
  computeRiskAlerts,
} from '@/lib/services/analyticsService';
import type { Athlete, DailyLoad, Injury } from '@/types';

// --- Helpers for creating test data ---

function makeAthlete(overrides: Partial<Athlete> = {}): Athlete {
  return {
    id: 'ath-1',
    name: 'Test Athlete',
    dateOfBirth: '2000-01-01',
    sportId: 'sport-1',
    position: 'Forward',
    status: 'active',
    createdAt: '2024-01-01',
    ...overrides,
  };
}

function makeDailyLoad(overrides: Partial<DailyLoad> = {}): DailyLoad {
  return {
    id: 'dl-1',
    athleteId: 'ath-1',
    date: new Date().toISOString().split('T')[0],
    rpe: 5,
    durationMinutes: 60,
    trainingLoad: 300,
    sessionType: 'training',
    createdAt: '2024-01-01',
    ...overrides,
  };
}

function makeInjury(overrides: Partial<Injury> = {}): Injury {
  return {
    id: 'inj-1',
    athleteId: 'ath-1',
    type: 'injury',
    description: 'Test injury',
    mechanism: 'contact',
    bodyRegion: 'Knee',
    dateOccurred: '2024-06-01',
    dateResolved: null,
    daysLost: null,
    status: 'active',
    createdAt: '2024-01-01',
    ...overrides,
  };
}

// --- ACWR / Risk Level Tests ---

describe('computeRiskLevel', () => {
  it('returns low for ACWR <= 1.3', () => {
    expect(computeRiskLevel(0)).toBe('low');
    expect(computeRiskLevel(0.5)).toBe('low');
    expect(computeRiskLevel(0.8)).toBe('low');
    expect(computeRiskLevel(1.0)).toBe('low');
    expect(computeRiskLevel(1.3)).toBe('low');
  });

  it('returns moderate for ACWR > 1.3 and <= 1.5', () => {
    expect(computeRiskLevel(1.31)).toBe('moderate');
    expect(computeRiskLevel(1.4)).toBe('moderate');
    expect(computeRiskLevel(1.5)).toBe('moderate');
  });

  it('returns high for ACWR > 1.5', () => {
    expect(computeRiskLevel(1.51)).toBe('high');
    expect(computeRiskLevel(2.0)).toBe('high');
    expect(computeRiskLevel(3.0)).toBe('high');
  });

  it('respects custom thresholds', () => {
    const custom = { acwrModerate: 1.2, acwrHigh: 1.4 };
    expect(computeRiskLevel(1.15, custom)).toBe('low');
    expect(computeRiskLevel(1.25, custom)).toBe('moderate');
    expect(computeRiskLevel(1.45, custom)).toBe('high');
  });
});

describe('computeAthleteRiskIndicators', () => {
  it('returns risk indicators for athletes with load data', () => {
    const athletes = [makeAthlete()];
    const now = new Date();

    // Create loads for the last 7 days (acute)
    const loads: DailyLoad[] = [];
    for (let i = 0; i < 28; i++) {
      const date = new Date(now.getTime() - i * 86400000);
      loads.push(
        makeDailyLoad({
          id: `dl-${i}`,
          date: date.toISOString().split('T')[0],
          trainingLoad: i < 7 ? 500 : 200, // Higher load last 7 days
        })
      );
    }

    const injuries: Injury[] = [makeInjury()];
    const result = computeAthleteRiskIndicators(athletes, loads, injuries);

    expect(result).toHaveLength(1);
    expect(result[0].athleteId).toBe('ath-1');
    expect(result[0].athleteName).toBe('Test Athlete');
    expect(result[0].acuteLoad).toBeGreaterThan(0);
    expect(result[0].chronicLoad).toBeGreaterThan(0);
    expect(result[0].acwr).toBeGreaterThan(0);
    expect(['low', 'moderate', 'high']).toContain(result[0].riskLevel);
    expect(result[0].activeInjuries).toBe(1);
  });

  it('returns 0 ACWR when no chronic load data', () => {
    const athletes = [makeAthlete()];
    const result = computeAthleteRiskIndicators(athletes, [], []);

    expect(result[0].acwr).toBe(0);
    expect(result[0].riskLevel).toBe('low');
  });

  it('counts active injuries only', () => {
    const athletes = [makeAthlete()];
    const injuries = [
      makeInjury({ id: 'inj-1', status: 'active' }),
      makeInjury({ id: 'inj-2', status: 'resolved' }),
      makeInjury({ id: 'inj-3', status: 'active' }),
    ];
    const result = computeAthleteRiskIndicators(athletes, [], injuries);
    expect(result[0].activeInjuries).toBe(2);
  });
});

// --- Injury Summary Tests ---

describe('computeInjurySummaryByBodyRegion', () => {
  it('groups injuries by body region', () => {
    const injuries = [
      makeInjury({ id: 'i1', bodyRegion: 'Knee', daysLost: 10 }),
      makeInjury({ id: 'i2', bodyRegion: 'Knee', daysLost: 5 }),
      makeInjury({ id: 'i3', bodyRegion: 'Ankle', daysLost: 3 }),
    ];

    const result = computeInjurySummaryByBodyRegion(injuries);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ bodyRegion: 'Knee', count: 2, daysLost: 15 });
    expect(result[1]).toEqual({ bodyRegion: 'Ankle', count: 1, daysLost: 3 });
  });

  it('returns empty array for no injuries', () => {
    expect(computeInjurySummaryByBodyRegion([])).toEqual([]);
  });

  it('sorts by count descending', () => {
    const injuries = [
      makeInjury({ id: 'i1', bodyRegion: 'Ankle' }),
      makeInjury({ id: 'i2', bodyRegion: 'Knee' }),
      makeInjury({ id: 'i3', bodyRegion: 'Knee' }),
      makeInjury({ id: 'i4', bodyRegion: 'Knee' }),
    ];

    const result = computeInjurySummaryByBodyRegion(injuries);
    expect(result[0].bodyRegion).toBe('Knee');
    expect(result[0].count).toBe(3);
  });

  it('handles null daysLost', () => {
    const injuries = [
      makeInjury({ id: 'i1', bodyRegion: 'Knee', daysLost: null }),
      makeInjury({ id: 'i2', bodyRegion: 'Knee', daysLost: 5 }),
    ];

    const result = computeInjurySummaryByBodyRegion(injuries);
    expect(result[0].daysLost).toBe(5);
  });
});

describe('computeInjurySummaryByType', () => {
  it('groups injuries by type', () => {
    const injuries = [
      makeInjury({ id: 'i1', type: 'injury' }),
      makeInjury({ id: 'i2', type: 'injury' }),
      makeInjury({ id: 'i3', type: 'illness' }),
    ];

    const result = computeInjurySummaryByType(injuries);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'injury', count: 2 });
    expect(result[1]).toEqual({ type: 'illness', count: 1 });
  });
});

// --- Load Trends Tests ---

describe('computeLoadTrends', () => {
  it('aggregates loads by date', () => {
    const today = new Date().toISOString().split('T')[0];
    const loads = [
      makeDailyLoad({ id: 'dl-1', athleteId: 'ath-1', date: today, trainingLoad: 300, rpe: 5 }),
      makeDailyLoad({ id: 'dl-2', athleteId: 'ath-2', date: today, trainingLoad: 500, rpe: 7 }),
    ];

    const result = computeLoadTrends(loads, { days: 30 });

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(today);
    expect(result[0].trainingLoad).toBe(400); // avg of 300 and 500
    expect(result[0].rpe).toBe(6); // avg of 5 and 7
  });

  it('respects days filter', () => {
    const now = new Date();
    const loads = [
      makeDailyLoad({ id: 'dl-1', date: now.toISOString().split('T')[0], trainingLoad: 300 }),
      makeDailyLoad({
        id: 'dl-2',
        date: new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0],
        trainingLoad: 200,
      }),
    ];

    const result = computeLoadTrends(loads, { days: 30 });
    expect(result).toHaveLength(1); // only recent load
  });

  it('returns empty for no loads', () => {
    expect(computeLoadTrends([], { days: 30 })).toEqual([]);
  });
});

describe('computeAthleteLoadTrends', () => {
  it('returns individual load entries sorted by date', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);

    const loads = [
      makeDailyLoad({ id: 'dl-1', date: now.toISOString().split('T')[0], trainingLoad: 300 }),
      makeDailyLoad({ id: 'dl-2', date: yesterday.toISOString().split('T')[0], trainingLoad: 200 }),
    ];

    const result = computeAthleteLoadTrends(loads, { days: 30 });
    expect(result).toHaveLength(2);
    expect(result[0].trainingLoad).toBe(200); // yesterday first (ascending)
    expect(result[1].trainingLoad).toBe(300); // today second
  });
});

// --- Risk Alerts Tests ---

describe('computeRiskAlerts', () => {
  it('generates danger alert for ACWR > 1.5', () => {
    const indicators = [
      {
        athleteId: 'ath-1',
        athleteName: 'Test',
        acuteLoad: 3000,
        chronicLoad: 1500,
        acwr: 2.0,
        riskLevel: 'high' as const,
        activeInjuries: 0,
      },
    ];

    const alerts = computeRiskAlerts(indicators);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('danger');
    expect(alerts[0].athleteName).toBe('Test');
  });

  it('generates warning alert for ACWR > 1.3', () => {
    const indicators = [
      {
        athleteId: 'ath-1',
        athleteName: 'Test',
        acuteLoad: 2000,
        chronicLoad: 1500,
        acwr: 1.4,
        riskLevel: 'moderate' as const,
        activeInjuries: 0,
      },
    ];

    const alerts = computeRiskAlerts(indicators);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('warning');
  });

  it('returns no alerts for low risk', () => {
    const indicators = [
      {
        athleteId: 'ath-1',
        athleteName: 'Test',
        acuteLoad: 1000,
        chronicLoad: 1000,
        acwr: 1.0,
        riskLevel: 'low' as const,
        activeInjuries: 0,
      },
    ];

    expect(computeRiskAlerts(indicators)).toHaveLength(0);
  });
});
