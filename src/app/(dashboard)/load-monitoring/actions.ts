'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { dailyLoadSchema } from '@/lib/validations';
import { createDailyLoad, updateDailyLoad, deleteDailyLoad } from '@/lib/services/dailyLoadService';

export async function createDailyLoadAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    date: formData.get('date') as string,
    rpe: Number(formData.get('rpe')),
    durationMinutes: Number(formData.get('durationMinutes')),
    sessionType: formData.get('sessionType') as string,
  };

  const parsed = dailyLoadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createDailyLoad(parsed.data);
    revalidatePath('/load-monitoring');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create load entry' };
  }
}

export async function updateDailyLoadAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    date: formData.get('date') as string,
    rpe: Number(formData.get('rpe')),
    durationMinutes: Number(formData.get('durationMinutes')),
    sessionType: formData.get('sessionType') as string,
  };

  const parsed = dailyLoadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateDailyLoad(id, parsed.data);
    revalidatePath('/load-monitoring');
    revalidatePath(`/load-monitoring/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update load entry' };
  }
}

export async function deleteDailyLoadAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteDailyLoad(id);
    revalidatePath('/load-monitoring');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete load entry' };
  }
}
