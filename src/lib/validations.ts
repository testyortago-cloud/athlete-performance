import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const athleteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  sportId: z.string().min(1, 'Sport is required'),
  programId: z.string().optional(),
  position: z.string().min(1, 'Position is required').max(50),
  status: z.enum(['active', 'inactive']),
});

export const sportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().default(''),
});

export const trainingProgramSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().default(''),
  startDate: z.string().nullable().optional().default(null),
  durationWeeks: z.coerce.number().int().min(1).max(104).nullable().optional().default(null),
});

export const metricCategorySchema = z.object({
  sportId: z.string().min(1, 'Sport is required'),
  name: z.string().min(1, 'Name is required').max(100),
  sortOrder: z.number().int().min(0),
});

export const metricSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  sportId: z.string().min(1, 'Sport is required'),
  name: z.string().min(1, 'Name is required').max(100),
  unit: z.string().min(1, 'Unit is required').max(20),
  isDerived: z.boolean().default(false),
  hasReps: z.boolean().default(false),
  formula: z.string().optional(),
  bestScoreMethod: z.enum(['highest', 'lowest']),
  trialCount: z.number().int().min(1).max(10).default(3),
});

export const testingSessionSchema = z.object({
  athleteId: z.string().min(1, 'Athlete is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(500).optional().default(''),
});

export const trialDataSchema = z.object({
  sessionId: z.string().min(1, 'Session is required'),
  metricId: z.string().min(1, 'Metric is required'),
  trial1: z.number().nullable().default(null),
  trial2: z.number().nullable().default(null),
  trial3: z.number().nullable().default(null),
  reps1: z.number().int().nullable().default(null),
  reps2: z.number().int().nullable().default(null),
  reps3: z.number().int().nullable().default(null),
  bestScore: z.number().nullable().default(null),
  averageScore: z.number().nullable().default(null),
});

export const injurySchema = z.object({
  athleteId: z.string().min(1, 'Athlete is required'),
  type: z.enum(['injury', 'illness']),
  description: z.string().min(1, 'Description is required').max(500),
  mechanism: z.string().max(200).optional().default(''),
  bodyRegion: z.string().min(1, 'Body region is required').max(100),
  dateOccurred: z.string().min(1, 'Date occurred is required'),
  dateResolved: z.string().nullable().default(null),
  status: z.enum(['active', 'rehab', 'monitoring', 'resolved']),
});

export const dailyLoadSchema = z.object({
  athleteId: z.string().min(1, 'Athlete is required'),
  date: z.string().min(1, 'Date is required'),
  rpe: z.number().int().min(1, 'RPE must be 1-10').max(10, 'RPE must be 1-10'),
  durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute'),
  sessionType: z.string().min(1, 'Session type is required'),
});

export const thresholdSettingsSchema = z.object({
  acwrModerate: z.number().min(0.1).max(5),
  acwrHigh: z.number().min(0.1).max(5),
  loadSpikePercent: z.number().min(1).max(500),
  defaultDays: z.number().int().min(7).max(365),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type AthleteInput = z.infer<typeof athleteSchema>;
export type SportInput = z.infer<typeof sportSchema>;
export type TrainingProgramInput = z.infer<typeof trainingProgramSchema>;
export type MetricCategoryInput = z.infer<typeof metricCategorySchema>;
export type MetricInput = z.infer<typeof metricSchema>;
export type TestingSessionInput = z.infer<typeof testingSessionSchema>;
export type TrialDataInput = z.infer<typeof trialDataSchema>;
export type InjuryInput = z.infer<typeof injurySchema>;
export type DailyLoadInput = z.infer<typeof dailyLoadSchema>;
export const wellnessCheckinSchema = z.object({
  athleteId: z.string().min(1, 'Athlete is required'),
  date: z.string().min(1, 'Date is required'),
  sleepHours: z.coerce.number().min(0).max(12, 'Sleep hours must be 0-12'),
  sleepQuality: z.coerce.number().int().min(1).max(5),
  soreness: z.coerce.number().int().min(1).max(5),
  fatigue: z.coerce.number().int().min(1).max(5),
  mood: z.coerce.number().int().min(1).max(5),
  hydration: z.coerce.number().int().min(1).max(5),
});

export const goalSchema = z.object({
  athleteId: z.string().min(1, 'Athlete is required'),
  metricId: z.string().min(1, 'Metric is required'),
  metricName: z.string().min(1, 'Metric name is required'),
  targetValue: z.coerce.number({ message: 'Target value is required' }),
  direction: z.enum(['higher', 'lower']),
  deadline: z.string().nullable().default(null),
});

export const journalEntrySchema = z.object({
  athleteId: z.string().min(1, 'Athlete is required'),
  date: z.string().min(1, 'Date is required'),
  content: z.string().min(1, 'Content is required').max(2000),
  tags: z.string().default(''),
});

export const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'coach', 'athlete']),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'coach', 'athlete']),
});

export const passwordResetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ThresholdSettingsInput = z.infer<typeof thresholdSettingsSchema>;
export type WellnessCheckinInput = z.infer<typeof wellnessCheckinSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
