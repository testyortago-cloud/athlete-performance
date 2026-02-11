import { describe, it, expect } from 'vitest';

// ==========================================
// Pure computation logic tests
// These test the business logic functions used
// in the UI and services without any mocking.
// ==========================================

// Replicate the computeBestScore and computeAverage
// functions from SessionDetailClient.tsx
function computeBestScore(
  trials: (number | null)[],
  method: 'highest' | 'lowest',
): number | null {
  const valid = trials.filter((t): t is number => t != null);
  if (valid.length === 0) return null;
  return method === 'highest' ? Math.max(...valid) : Math.min(...valid);
}

function computeAverage(trials: (number | null)[]): number | null {
  const valid = trials.filter((t): t is number => t != null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
}

// Replicate daysLost computation from injuryService
function computeDaysLost(dateOccurred: string, dateResolved: string | null): number | null {
  if (!dateResolved) return null;
  const occurred = new Date(dateOccurred).getTime();
  const resolved = new Date(dateResolved).getTime();
  return Math.ceil((resolved - occurred) / 86400000);
}

// Replicate trainingLoad computation from dailyLoadService
function computeTrainingLoad(rpe: number, durationMinutes: number): number {
  return rpe * durationMinutes;
}

// ==========================================
// Best Score Computation
// ==========================================
describe('computeBestScore', () => {
  it('returns highest value when method is highest', () => {
    expect(computeBestScore([1.52, 1.48, 1.55], 'highest')).toBe(1.55);
  });

  it('returns lowest value when method is lowest', () => {
    expect(computeBestScore([1.52, 1.48, 1.55], 'lowest')).toBe(1.48);
  });

  it('ignores null values', () => {
    expect(computeBestScore([1.52, null, 1.55], 'highest')).toBe(1.55);
    expect(computeBestScore([1.52, null, 1.55], 'lowest')).toBe(1.52);
  });

  it('returns null when all values are null', () => {
    expect(computeBestScore([null, null, null], 'highest')).toBeNull();
    expect(computeBestScore([null, null, null], 'lowest')).toBeNull();
  });

  it('works with single non-null value', () => {
    expect(computeBestScore([null, 2.5, null], 'highest')).toBe(2.5);
    expect(computeBestScore([null, 2.5, null], 'lowest')).toBe(2.5);
  });

  it('handles negative values', () => {
    expect(computeBestScore([-1, -2, -3], 'highest')).toBe(-1);
    expect(computeBestScore([-1, -2, -3], 'lowest')).toBe(-3);
  });

  it('handles empty array', () => {
    expect(computeBestScore([], 'highest')).toBeNull();
  });

  it('handles zero values', () => {
    expect(computeBestScore([0, 1, 2], 'highest')).toBe(2);
    expect(computeBestScore([0, 1, 2], 'lowest')).toBe(0);
  });
});

// ==========================================
// Average Computation
// ==========================================
describe('computeAverage', () => {
  it('computes average of all values', () => {
    expect(computeAverage([1.52, 1.48, 1.55])).toBe(1.52);
  });

  it('ignores null values in average', () => {
    expect(computeAverage([10, null, 20])).toBe(15);
  });

  it('returns null when all values are null', () => {
    expect(computeAverage([null, null, null])).toBeNull();
  });

  it('returns the value itself for single non-null', () => {
    expect(computeAverage([null, 5, null])).toBe(5);
  });

  it('rounds to 2 decimal places', () => {
    expect(computeAverage([1, 2, 3])).toBe(2);
    expect(computeAverage([1.111, 2.222, 3.333])).toBe(2.22);
  });

  it('handles empty array', () => {
    expect(computeAverage([])).toBeNull();
  });

  it('handles zero values', () => {
    expect(computeAverage([0, 0, 0])).toBe(0);
  });
});

// ==========================================
// Days Lost Computation
// ==========================================
describe('computeDaysLost', () => {
  it('computes days between two dates', () => {
    expect(computeDaysLost('2025-01-01', '2025-01-11')).toBe(10);
  });

  it('returns null when dateResolved is null', () => {
    expect(computeDaysLost('2025-01-01', null)).toBeNull();
  });

  it('returns 0 for same day', () => {
    expect(computeDaysLost('2025-01-01', '2025-01-01')).toBe(0);
  });

  it('returns 1 for next day', () => {
    expect(computeDaysLost('2025-01-01', '2025-01-02')).toBe(1);
  });

  it('handles month boundaries', () => {
    expect(computeDaysLost('2025-01-30', '2025-02-01')).toBe(2);
  });

  it('handles year boundaries', () => {
    expect(computeDaysLost('2024-12-31', '2025-01-01')).toBe(1);
  });

  it('handles long periods', () => {
    expect(computeDaysLost('2025-01-01', '2025-12-31')).toBe(364);
  });

  it('returns null for empty dateResolved string', () => {
    expect(computeDaysLost('2025-01-01', '')).toBeNull();
  });
});

// ==========================================
// Training Load Computation
// ==========================================
describe('computeTrainingLoad', () => {
  it('computes RPE x Duration', () => {
    expect(computeTrainingLoad(7, 90)).toBe(630);
  });

  it('handles minimum values', () => {
    expect(computeTrainingLoad(1, 1)).toBe(1);
  });

  it('handles maximum typical values', () => {
    expect(computeTrainingLoad(10, 120)).toBe(1200);
  });

  it('handles zero duration', () => {
    expect(computeTrainingLoad(5, 0)).toBe(0);
  });

  it('handles various RPE levels', () => {
    expect(computeTrainingLoad(1, 60)).toBe(60);
    expect(computeTrainingLoad(5, 60)).toBe(300);
    expect(computeTrainingLoad(10, 60)).toBe(600);
  });
});

// ==========================================
// RPE Badge Variant Logic
// ==========================================
describe('RPE badge variant', () => {
  function getRpeBadgeVariant(rpe: number): 'success' | 'warning' | 'danger' {
    if (rpe <= 3) return 'success';
    if (rpe <= 6) return 'warning';
    return 'danger';
  }

  it('returns success for RPE 1-3', () => {
    expect(getRpeBadgeVariant(1)).toBe('success');
    expect(getRpeBadgeVariant(2)).toBe('success');
    expect(getRpeBadgeVariant(3)).toBe('success');
  });

  it('returns warning for RPE 4-6', () => {
    expect(getRpeBadgeVariant(4)).toBe('warning');
    expect(getRpeBadgeVariant(5)).toBe('warning');
    expect(getRpeBadgeVariant(6)).toBe('warning');
  });

  it('returns danger for RPE 7-10', () => {
    expect(getRpeBadgeVariant(7)).toBe('danger');
    expect(getRpeBadgeVariant(8)).toBe('danger');
    expect(getRpeBadgeVariant(9)).toBe('danger');
    expect(getRpeBadgeVariant(10)).toBe('danger');
  });
});
