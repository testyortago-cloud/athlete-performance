export interface WellnessCheckin {
  id: string;
  athleteId: string;
  athleteName?: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  soreness: number;
  fatigue: number;
  mood: number;
  hydration: number;
  readinessScore: number;
  createdAt: string;
}

export interface WellnessCheckinFormData {
  athleteId: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  soreness: number;
  fatigue: number;
  mood: number;
  hydration: number;
}
