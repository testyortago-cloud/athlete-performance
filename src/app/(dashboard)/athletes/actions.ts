'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { athleteSchema } from '@/lib/validations';
import { createAthlete, updateAthlete, deleteAthlete } from '@/lib/services/athleteService';

export async function createAthleteAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    name: formData.get('name') as string,
    dateOfBirth: formData.get('dateOfBirth') as string,
    sportId: formData.get('sportId') as string,
    programId: (formData.get('programId') as string) || undefined,
    position: formData.get('position') as string,
    status: (formData.get('status') as string) || 'active',
  };

  const parsed = athleteSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createAthlete(parsed.data);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create athlete' };
  }
}

export async function updateAthleteAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const programIdRaw = formData.get('programId') as string;

  const raw = {
    name: formData.get('name') as string,
    dateOfBirth: formData.get('dateOfBirth') as string,
    sportId: formData.get('sportId') as string,
    programId: programIdRaw || undefined,
    position: formData.get('position') as string,
    status: (formData.get('status') as string) || 'active',
  };

  const parsed = athleteSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // Pass programId explicitly (empty string clears it, undefined skips it)
    await updateAthlete(id, { ...parsed.data, programId: programIdRaw || '' });
    revalidatePath('/athletes');
    revalidatePath(`/athletes/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update athlete' };
  }
}

export async function deleteAthleteAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteAthlete(id);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete athlete' };
  }
}
