'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { testingSessionSchema } from '@/lib/validations';
import {
  createTestingSession,
  updateTestingSession,
  deleteTestingSession,
  createTrialData,
  updateTrialData,
} from '@/lib/services/testingSessionService';

export async function createSessionAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    date: formData.get('date') as string,
    notes: (formData.get('notes') as string) || '',
  };

  const parsed = testingSessionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const createdBy = session.user?.name || session.user?.email || 'Unknown';
    const testingSession = await createTestingSession(parsed.data, createdBy);
    revalidatePath('/testing');
    return { success: true, sessionId: testingSession.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create session' };
  }
}

export async function updateSessionAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    date: formData.get('date') as string,
    notes: (formData.get('notes') as string) || '',
  };

  const parsed = testingSessionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateTestingSession(id, parsed.data);
    revalidatePath('/testing');
    revalidatePath(`/testing/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update session' };
  }
}

export async function deleteSessionAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteTestingSession(id);
    revalidatePath('/testing');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete session' };
  }
}

interface TrialEntry {
  metricId: string;
  trial1: number | null;
  trial2: number | null;
  trial3: number | null;
  bestScore: number | null;
  averageScore: number | null;
  existingId?: string;
}

export async function saveTrialDataAction(sessionId: string, trialsJson: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    const trials: TrialEntry[] = JSON.parse(trialsJson);

    for (const trial of trials) {
      // Skip metrics with all-null trials
      if (trial.trial1 == null && trial.trial2 == null && trial.trial3 == null) {
        continue;
      }

      const data = {
        sessionId,
        metricId: trial.metricId,
        trial1: trial.trial1,
        trial2: trial.trial2,
        trial3: trial.trial3,
        bestScore: trial.bestScore,
        averageScore: trial.averageScore,
      };

      if (trial.existingId) {
        await updateTrialData(trial.existingId, data);
      } else {
        await createTrialData(data);
      }
    }

    revalidatePath(`/testing/${sessionId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to save trial data' };
  }
}
