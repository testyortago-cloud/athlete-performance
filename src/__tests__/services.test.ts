import { describe, it, expect, vi } from 'vitest';

// ==========================================
// Service mapRecord / compute logic tests
// We test the pure functions by importing the
// modules and mocking the Airtable client.
// ==========================================

// Mock Airtable module before any imports
vi.mock('@/lib/airtable', () => ({
  getRecords: vi.fn(),
  getRecordById: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
  TABLES: {
    USERS: 'Users',
    ATHLETES: 'Athletes',
    SPORTS: 'Sports',
    METRIC_CATEGORIES: 'Metric_Categories',
    METRICS: 'Metrics',
    TESTING_SESSIONS: 'Testing_Sessions',
    TRIAL_DATA: 'Trial_Data',
    INJURIES: 'Injuries',
    DAILY_LOAD: 'Daily_Load',
  },
}));

import { getRecords, getRecordById, createRecord } from '@/lib/airtable';

// ==========================================
// Injury Service
// ==========================================
describe('injuryService', () => {
  it('maps Airtable record to Injury correctly', async () => {
    const mockRecord = {
      id: 'rec123',
      fields: {
        Athlete: ['recAthlete1'],
        AthleteName: 'John Doe',
        Type: 'injury',
        Description: 'ACL tear',
        Mechanism: 'Non-contact',
        BodyRegion: 'Knee',
        DateOccurred: '2025-01-15',
        DateResolved: '2025-03-15',
        DaysLost: 59,
        Status: 'resolved',
        Created: '2025-01-15T10:00:00.000Z',
      },
    };

    vi.mocked(getRecordById).mockResolvedValueOnce(mockRecord);

    const { getInjuryById } = await import('@/lib/services/injuryService');
    const injury = await getInjuryById('rec123');

    expect(injury).not.toBeNull();
    expect(injury!.id).toBe('rec123');
    expect(injury!.athleteId).toBe('recAthlete1');
    expect(injury!.type).toBe('injury');
    expect(injury!.description).toBe('ACL tear');
    expect(injury!.mechanism).toBe('Non-contact');
    expect(injury!.bodyRegion).toBe('Knee');
    expect(injury!.dateOccurred).toBe('2025-01-15');
    expect(injury!.dateResolved).toBe('2025-03-15');
    expect(injury!.daysLost).toBe(59);
    expect(injury!.status).toBe('resolved');
  });

  it('handles linked Athlete field as array', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce({
      id: 'rec1',
      fields: { Athlete: ['recA'], Type: 'illness', Status: 'active' },
    });

    const { getInjuryById } = await import('@/lib/services/injuryService');
    const injury = await getInjuryById('rec1');
    expect(injury!.athleteId).toBe('recA');
  });

  it('handles missing Athlete field gracefully', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce({
      id: 'rec1',
      fields: { Type: 'injury', Status: 'active' },
    });

    const { getInjuryById } = await import('@/lib/services/injuryService');
    const injury = await getInjuryById('rec1');
    expect(injury!.athleteId).toBe('');
  });

  it('defaults status to active when missing', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce({
      id: 'rec1',
      fields: { Athlete: ['recA'], Type: 'injury' },
    });

    const { getInjuryById } = await import('@/lib/services/injuryService');
    const injury = await getInjuryById('rec1');
    expect(injury!.status).toBe('active');
  });

  it('computes daysLost when creating with both dates', async () => {
    vi.mocked(createRecord).mockResolvedValueOnce({
      id: 'recNew',
      fields: {
        Athlete: ['recA'],
        Type: 'injury',
        Description: 'Sprain',
        BodyRegion: 'Ankle',
        DateOccurred: '2025-01-01',
        DateResolved: '2025-01-11',
        DaysLost: 10,
        Status: 'resolved',
      },
    });

    const { createInjury } = await import('@/lib/services/injuryService');
    await createInjury({
      athleteId: 'recA',
      type: 'injury',
      description: 'Sprain',
      mechanism: '',
      bodyRegion: 'Ankle',
      dateOccurred: '2025-01-01',
      dateResolved: '2025-01-11',
      status: 'resolved',
    });

    // Verify createRecord was called with computed DaysLost = 10
    expect(createRecord).toHaveBeenCalledWith(
      'Injuries',
      expect.objectContaining({ DaysLost: 10 }),
    );
  });

  it('sets daysLost to null when no dateResolved', async () => {
    vi.mocked(createRecord).mockResolvedValueOnce({
      id: 'recNew',
      fields: {
        Athlete: ['recA'],
        Type: 'injury',
        Status: 'active',
      },
    });

    const { createInjury } = await import('@/lib/services/injuryService');
    await createInjury({
      athleteId: 'recA',
      type: 'injury',
      description: 'Strain',
      mechanism: '',
      bodyRegion: 'Hamstring',
      dateOccurred: '2025-01-01',
      dateResolved: null,
      status: 'active',
    });

    expect(createRecord).toHaveBeenCalledWith(
      'Injuries',
      expect.objectContaining({ DaysLost: null }),
    );
  });

  it('filters by athleteId', async () => {
    vi.mocked(getRecords).mockResolvedValueOnce([]);

    const { getInjuries } = await import('@/lib/services/injuryService');
    await getInjuries({ athleteId: 'recA' });

    expect(getRecords).toHaveBeenCalledWith(
      'Injuries',
      expect.objectContaining({
        filterByFormula: 'FIND("recA", ARRAYJOIN({Athlete}))',
      }),
    );
  });

  it('filters by status', async () => {
    vi.mocked(getRecords).mockResolvedValueOnce([]);

    const { getInjuries } = await import('@/lib/services/injuryService');
    await getInjuries({ status: 'active' });

    expect(getRecords).toHaveBeenCalledWith(
      'Injuries',
      expect.objectContaining({
        filterByFormula: '{Status} = "active"',
      }),
    );
  });

  it('combines multiple filters with AND', async () => {
    vi.mocked(getRecords).mockResolvedValueOnce([]);

    const { getInjuries } = await import('@/lib/services/injuryService');
    await getInjuries({ athleteId: 'recA', status: 'active' });

    expect(getRecords).toHaveBeenCalledWith(
      'Injuries',
      expect.objectContaining({
        filterByFormula: expect.stringContaining('AND('),
      }),
    );
  });
});

// ==========================================
// Daily Load Service
// ==========================================
describe('dailyLoadService', () => {
  it('maps Airtable record to DailyLoad correctly', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce({
      id: 'rec123',
      fields: {
        Athlete: ['recA'],
        AthleteName: 'Jane Doe',
        Date: '2025-01-15',
        RPE: 7,
        DurationMinutes: 90,
        TrainingLoad: 630,
        SessionType: 'Training',
        Created: '2025-01-15T10:00:00.000Z',
      },
    });

    const { getDailyLoadById } = await import('@/lib/services/dailyLoadService');
    const load = await getDailyLoadById('rec123');

    expect(load).not.toBeNull();
    expect(load!.athleteId).toBe('recA');
    expect(load!.rpe).toBe(7);
    expect(load!.durationMinutes).toBe(90);
    expect(load!.trainingLoad).toBe(630);
    expect(load!.sessionType).toBe('Training');
  });

  it('computes trainingLoad on create', async () => {
    vi.mocked(createRecord).mockResolvedValueOnce({
      id: 'recNew',
      fields: {
        Athlete: ['recA'],
        RPE: 8,
        DurationMinutes: 60,
        TrainingLoad: 480,
        SessionType: 'Match',
      },
    });

    const { createDailyLoad } = await import('@/lib/services/dailyLoadService');
    await createDailyLoad({
      athleteId: 'recA',
      date: '2025-01-15',
      rpe: 8,
      durationMinutes: 60,
      sessionType: 'Match',
    });

    // Verify TrainingLoad = 8 * 60 = 480
    expect(createRecord).toHaveBeenCalledWith(
      'Daily_Load',
      expect.objectContaining({ TrainingLoad: 480 }),
    );
  });

  it('defaults missing numeric fields to 0', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce({
      id: 'rec1',
      fields: { Athlete: ['recA'] },
    });

    const { getDailyLoadById } = await import('@/lib/services/dailyLoadService');
    const load = await getDailyLoadById('rec1');

    expect(load!.rpe).toBe(0);
    expect(load!.durationMinutes).toBe(0);
    expect(load!.trainingLoad).toBe(0);
  });
});

// ==========================================
// Testing Session Service
// ==========================================
describe('testingSessionService', () => {
  it('maps session record correctly', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce({
      id: 'recSess1',
      fields: {
        Athlete: ['recA'],
        AthleteName: 'John',
        Date: '2025-02-01',
        Notes: 'Pre-season',
        CreatedBy: 'Coach Smith',
        Created: '2025-02-01T08:00:00.000Z',
      },
    });

    const { getTestingSessionById } = await import('@/lib/services/testingSessionService');
    const session = await getTestingSessionById('recSess1');

    expect(session).not.toBeNull();
    expect(session!.athleteId).toBe('recA');
    expect(session!.date).toBe('2025-02-01');
    expect(session!.notes).toBe('Pre-season');
    expect(session!.createdBy).toBe('Coach Smith');
  });

  it('maps trial data record correctly', async () => {
    vi.mocked(getRecords).mockResolvedValueOnce([
      {
        id: 'recTrial1',
        fields: {
          Session: ['recSess1'],
          Metric: ['recMetric1'],
          Trial_1: 1.52,
          Trial_2: 1.48,
          Trial_3: 1.55,
          BestScore: 1.48,
          AverageScore: 1.52,
        },
      },
    ]);

    const { getTrialDataBySession } = await import('@/lib/services/testingSessionService');
    const trials = await getTrialDataBySession('recSess1');

    expect(trials).toHaveLength(1);
    expect(trials[0].sessionId).toBe('recSess1');
    expect(trials[0].metricId).toBe('recMetric1');
    expect(trials[0].trial1).toBe(1.52);
    expect(trials[0].trial2).toBe(1.48);
    expect(trials[0].trial3).toBe(1.55);
    expect(trials[0].bestScore).toBe(1.48);
    expect(trials[0].averageScore).toBe(1.52);
  });

  it('handles null trial values', async () => {
    vi.mocked(getRecords).mockResolvedValueOnce([
      {
        id: 'recTrial1',
        fields: {
          Session: ['recSess1'],
          Metric: ['recM1'],
          Trial_1: 2.5,
        },
      },
    ]);

    const { getTrialDataBySession } = await import('@/lib/services/testingSessionService');
    const trials = await getTrialDataBySession('recSess1');

    expect(trials[0].trial1).toBe(2.5);
    expect(trials[0].trial2).toBeNull();
    expect(trials[0].trial3).toBeNull();
    expect(trials[0].bestScore).toBeNull();
    expect(trials[0].averageScore).toBeNull();
  });

  it('creates session with Athlete as array', async () => {
    vi.mocked(createRecord).mockResolvedValueOnce({
      id: 'recNew',
      fields: { Athlete: ['recA'], Date: '2025-01-15', Notes: '', CreatedBy: 'Coach' },
    });

    const { createTestingSession } = await import('@/lib/services/testingSessionService');
    await createTestingSession(
      { athleteId: 'recA', date: '2025-01-15', notes: '' },
      'Coach',
    );

    expect(createRecord).toHaveBeenCalledWith(
      'Testing_Sessions',
      expect.objectContaining({
        Athlete: ['recA'],
        CreatedBy: 'Coach',
      }),
    );
  });

  it('returns null for non-existent session', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce(null);

    const { getTestingSessionById } = await import('@/lib/services/testingSessionService');
    const session = await getTestingSessionById('nonexistent');
    expect(session).toBeNull();
  });
});

// ==========================================
// Athlete Service (Phase 1 verification)
// ==========================================
describe('athleteService', () => {
  it('maps Airtable record with linked Sport array', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce({
      id: 'recA',
      fields: {
        Name: 'Jane Doe',
        DateOfBirth: '2000-05-20',
        Sport: ['recSport1'],
        SportName: 'Tennis',
        Position: 'Singles',
        Status: 'active',
        Created: '2024-01-01T00:00:00.000Z',
      },
    });

    const { getAthleteById } = await import('@/lib/services/athleteService');
    const athlete = await getAthleteById('recA');

    expect(athlete).not.toBeNull();
    expect(athlete!.sportId).toBe('recSport1');
    expect(athlete!.name).toBe('Jane Doe');
    expect(athlete!.status).toBe('active');
  });

  it('handles Sport as string (not array)', async () => {
    vi.mocked(getRecordById).mockResolvedValueOnce({
      id: 'recA',
      fields: {
        Name: 'Test',
        Sport: 'recSport1',
        Status: 'active',
      },
    });

    const { getAthleteById } = await import('@/lib/services/athleteService');
    const athlete = await getAthleteById('recA');
    expect(athlete!.sportId).toBe('recSport1');
  });
});
