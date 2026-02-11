import { describe, it, expect } from 'vitest';
import {
  injurySchema,
  dailyLoadSchema,
  testingSessionSchema,
  trialDataSchema,
  athleteSchema,
  sportSchema,
  metricSchema,
  metricCategorySchema,
} from '@/lib/validations';

// ==========================================
// Phase 1 Schemas
// ==========================================

describe('athleteSchema', () => {
  it('accepts valid athlete data', () => {
    const result = athleteSchema.safeParse({
      name: 'John Doe',
      dateOfBirth: '2000-01-15',
      sportId: 'rec123',
      position: 'Point Guard',
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = athleteSchema.safeParse({
      name: '',
      dateOfBirth: '2000-01-15',
      sportId: 'rec123',
      position: 'PG',
      status: 'active',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('rejects invalid status', () => {
    const result = athleteSchema.safeParse({
      name: 'John',
      dateOfBirth: '2000-01-15',
      sportId: 'rec123',
      position: 'PG',
      status: 'retired',
    });
    expect(result.success).toBe(false);
  });
});

describe('sportSchema', () => {
  it('accepts valid sport', () => {
    const result = sportSchema.safeParse({ name: 'Basketball', description: 'Team sport' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = sportSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('defaults description to empty string', () => {
    const result = sportSchema.safeParse({ name: 'Tennis' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
    }
  });
});

describe('metricCategorySchema', () => {
  it('accepts valid category', () => {
    const result = metricCategorySchema.safeParse({
      sportId: 'rec123',
      name: 'Speed',
      sortOrder: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative sortOrder', () => {
    const result = metricCategorySchema.safeParse({
      sportId: 'rec123',
      name: 'Speed',
      sortOrder: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('metricSchema', () => {
  it('accepts valid metric', () => {
    const result = metricSchema.safeParse({
      categoryId: 'rec123',
      sportId: 'rec456',
      name: '10m Sprint',
      unit: 'sec',
      isDerived: false,
      bestScoreMethod: 'lowest',
      trialCount: 3,
    });
    expect(result.success).toBe(true);
  });

  it('defaults trialCount to 3', () => {
    const result = metricSchema.safeParse({
      categoryId: 'rec123',
      sportId: 'rec456',
      name: '10m Sprint',
      unit: 'sec',
      bestScoreMethod: 'lowest',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trialCount).toBe(3);
    }
  });

  it('rejects trialCount > 10', () => {
    const result = metricSchema.safeParse({
      categoryId: 'rec123',
      sportId: 'rec456',
      name: '10m Sprint',
      unit: 'sec',
      bestScoreMethod: 'lowest',
      trialCount: 11,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid bestScoreMethod', () => {
    const result = metricSchema.safeParse({
      categoryId: 'rec123',
      sportId: 'rec456',
      name: '10m Sprint',
      unit: 'sec',
      bestScoreMethod: 'average',
      trialCount: 3,
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// Phase 2 Schemas
// ==========================================

describe('testingSessionSchema', () => {
  it('accepts valid session data', () => {
    const result = testingSessionSchema.safeParse({
      athleteId: 'rec123',
      date: '2025-01-15',
      notes: 'Pre-season testing',
    });
    expect(result.success).toBe(true);
  });

  it('accepts session without notes', () => {
    const result = testingSessionSchema.safeParse({
      athleteId: 'rec123',
      date: '2025-01-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('');
    }
  });

  it('rejects missing athleteId', () => {
    const result = testingSessionSchema.safeParse({
      athleteId: '',
      date: '2025-01-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Athlete is required');
    }
  });

  it('rejects missing date', () => {
    const result = testingSessionSchema.safeParse({
      athleteId: 'rec123',
      date: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date is required');
    }
  });
});

describe('trialDataSchema', () => {
  it('accepts valid trial data with all trials', () => {
    const result = trialDataSchema.safeParse({
      sessionId: 'rec123',
      metricId: 'rec456',
      trial1: 1.52,
      trial2: 1.48,
      trial3: 1.55,
      bestScore: 1.48,
      averageScore: 1.52,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null trials', () => {
    const result = trialDataSchema.safeParse({
      sessionId: 'rec123',
      metricId: 'rec456',
      trial1: 1.52,
      trial2: null,
      trial3: null,
      bestScore: 1.52,
      averageScore: 1.52,
    });
    expect(result.success).toBe(true);
  });

  it('defaults trials to null', () => {
    const result = trialDataSchema.safeParse({
      sessionId: 'rec123',
      metricId: 'rec456',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trial1).toBeNull();
      expect(result.data.trial2).toBeNull();
      expect(result.data.trial3).toBeNull();
      expect(result.data.bestScore).toBeNull();
      expect(result.data.averageScore).toBeNull();
    }
  });

  it('rejects missing sessionId', () => {
    const result = trialDataSchema.safeParse({
      sessionId: '',
      metricId: 'rec456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing metricId', () => {
    const result = trialDataSchema.safeParse({
      sessionId: 'rec123',
      metricId: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('injurySchema', () => {
  const validInjury = {
    athleteId: 'rec123',
    type: 'injury' as const,
    description: 'ACL tear',
    mechanism: 'Non-contact landing',
    bodyRegion: 'Knee',
    dateOccurred: '2025-01-15',
    dateResolved: null,
    status: 'active' as const,
  };

  it('accepts valid injury data', () => {
    const result = injurySchema.safeParse(validInjury);
    expect(result.success).toBe(true);
  });

  it('accepts illness type', () => {
    const result = injurySchema.safeParse({ ...validInjury, type: 'illness' });
    expect(result.success).toBe(true);
  });

  it('accepts resolved injury with dateResolved', () => {
    const result = injurySchema.safeParse({
      ...validInjury,
      dateResolved: '2025-03-15',
      status: 'resolved',
    });
    expect(result.success).toBe(true);
  });

  it('defaults mechanism to empty string', () => {
    const { mechanism, ...noMechanism } = validInjury;
    const result = injurySchema.safeParse(noMechanism);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mechanism).toBe('');
    }
  });

  it('rejects missing athleteId', () => {
    const result = injurySchema.safeParse({ ...validInjury, athleteId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Athlete is required');
    }
  });

  it('rejects missing description', () => {
    const result = injurySchema.safeParse({ ...validInjury, description: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description is required');
    }
  });

  it('rejects missing bodyRegion', () => {
    const result = injurySchema.safeParse({ ...validInjury, bodyRegion: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Body region is required');
    }
  });

  it('rejects invalid type', () => {
    const result = injurySchema.safeParse({ ...validInjury, type: 'fracture' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = injurySchema.safeParse({ ...validInjury, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects description over 500 chars', () => {
    const result = injurySchema.safeParse({ ...validInjury, description: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('dailyLoadSchema', () => {
  const validLoad = {
    athleteId: 'rec123',
    date: '2025-01-15',
    rpe: 7,
    durationMinutes: 90,
    sessionType: 'Training',
  };

  it('accepts valid load data', () => {
    const result = dailyLoadSchema.safeParse(validLoad);
    expect(result.success).toBe(true);
  });

  it('accepts RPE of 1 (min)', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, rpe: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts RPE of 10 (max)', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, rpe: 10 });
    expect(result.success).toBe(true);
  });

  it('rejects RPE of 0', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, rpe: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('RPE must be 1-10');
    }
  });

  it('rejects RPE of 11', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, rpe: 11 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('RPE must be 1-10');
    }
  });

  it('rejects negative RPE', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, rpe: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects decimal RPE', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, rpe: 5.5 });
    expect(result.success).toBe(false);
  });

  it('rejects duration of 0', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, durationMinutes: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Duration must be at least 1 minute');
    }
  });

  it('rejects negative duration', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, durationMinutes: -10 });
    expect(result.success).toBe(false);
  });

  it('rejects missing athleteId', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, athleteId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, date: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing sessionType', () => {
    const result = dailyLoadSchema.safeParse({ ...validLoad, sessionType: '' });
    expect(result.success).toBe(false);
  });
});
