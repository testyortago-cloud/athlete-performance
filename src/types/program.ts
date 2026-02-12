export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  startDate: string | null;
  durationWeeks: number | null;
  createdAt: string;
}

export interface TrainingProgramFormData {
  name: string;
  description: string;
  startDate: string | null;
  durationWeeks: number | null;
}
