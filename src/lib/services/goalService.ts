import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { Goal, GoalFormData } from '@/types';

function mapRecord(r: { id: string; fields: Record<string, unknown> }): Goal {
  return {
    id: r.id,
    athleteId: (r.fields.AthleteId as string[] | undefined)?.[0] || (r.fields.AthleteId as string) || '',
    metricId: r.fields.MetricNumber as string || '',
    metricName: r.fields.MetricTitle as string || '',
    targetValue: Number(r.fields.TargetValue) || 0,
    currentBest: r.fields.CurrentBest != null ? Number(r.fields.CurrentBest) : null,
    direction: (r.fields.GoalType as string) === 'lower' ? 'lower' : 'higher',
    deadline: (r.fields.Deadline as string) || null,
    status: (r.fields.Status as Goal['status']) || 'active',
    achievedDate: (r.fields.AchievedDate as string) || null,
    createdAt: (r.fields.CreatedAt as string) || new Date().toISOString(),
  };
}

export async function getGoals(filters?: { athleteId?: string }): Promise<Goal[]> {
  const records = await getRecords(TABLES.GOALS, {
    sort: [{ field: 'CreatedAt', direction: 'desc' }],
  });
  let goals = records.map(mapRecord);
  if (filters?.athleteId) {
    goals = goals.filter((g) => g.athleteId === filters.athleteId);
  }
  return goals;
}

export async function getGoalById(id: string): Promise<Goal | null> {
  const r = await getRecordById(TABLES.GOALS, id);
  return r ? mapRecord(r) : null;
}

export async function createGoal(data: GoalFormData): Promise<Goal> {
  const r = await createRecord(TABLES.GOALS, {
    AthleteId: [data.athleteId],
    MetricNumber: data.metricId,
    MetricTitle: data.metricName,
    TargetValue: data.targetValue,
    GoalType: data.direction,
    Deadline: data.deadline || null,
    Status: 'active',
    CreatedAt: new Date().toISOString(),
  });
  return mapRecord(r);
}

export async function updateGoal(id: string, data: Partial<GoalFormData & { status: Goal['status']; currentBest: number | null; achievedDate: string | null }>): Promise<Goal> {
  const fields: Record<string, unknown> = {};
  if (data.metricId !== undefined) fields.MetricId = data.metricId;
  if (data.metricName !== undefined) fields.MetricName = data.metricName;
  if (data.targetValue !== undefined) fields.TargetValue = data.targetValue;
  if (data.direction !== undefined) fields.Direction = data.direction;
  if (data.deadline !== undefined) fields.Deadline = data.deadline || null;
  if (data.status !== undefined) fields.Status = data.status;
  if (data.currentBest !== undefined) fields.CurrentBest = data.currentBest;
  if (data.achievedDate !== undefined) fields.AchievedDate = data.achievedDate;
  const r = await updateRecord(TABLES.GOALS, id, fields);
  return mapRecord(r);
}

export async function deleteGoal(id: string): Promise<void> {
  await deleteRecord(TABLES.GOALS, id);
}
