'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { sportSchema } from '@/lib/validations';
import { createSport, updateSport, deleteSport } from '@/lib/services/sportService';

export async function createSportAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || '',
  };

  const parsed = sportSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createSport(parsed.data);
    revalidatePath('/sports');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create sport' };
  }
}

export async function updateSportAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || '',
  };

  const parsed = sportSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateSport(id, parsed.data);
    revalidatePath('/sports');
    revalidatePath(`/sports/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update sport' };
  }
}

export async function deleteSportAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteSport(id);
    revalidatePath('/sports');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete sport' };
  }
}
