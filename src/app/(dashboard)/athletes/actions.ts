'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { athleteSchema } from '@/lib/validations';
import { createAthlete, updateAthlete, deleteAthlete, updateAthleteNotes } from '@/lib/services/athleteService';
import { uploadAthletePhoto } from '@/lib/storage';

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
    const photo = formData.get('photo') as File | null;
    let photoUrl: string | undefined;
    if (photo && photo.size > 0) {
      photoUrl = await uploadAthletePhoto(photo, parsed.data.name);
    }

    await createAthlete({ ...parsed.data, photoUrl });
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('createAthlete error:', e);
    return { error: msg || 'Failed to create athlete' };
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
    const photo = formData.get('photo') as File | null;
    let photoUrl: string | undefined;
    if (photo && photo.size > 0) {
      photoUrl = await uploadAthletePhoto(photo, parsed.data.name);
    }

    // Pass programId explicitly (empty string clears it, undefined skips it)
    await updateAthlete(id, { ...parsed.data, programId: programIdRaw || '', photoUrl });
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

export async function bulkUpdateStatusAction(ids: string[], status: 'active' | 'inactive') {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await Promise.all(ids.map((id) => updateAthlete(id, { status })));
    revalidatePath('/athletes');
    return { success: true, count: ids.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update athletes' };
  }
}

export async function bulkAssignProgramAction(ids: string[], programId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await Promise.all(ids.map((id) => updateAthlete(id, { programId: programId || '' })));
    revalidatePath('/athletes');
    return { success: true, count: ids.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to assign program' };
  }
}

export async function updateAthleteNotesAction(id: string, notes: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await updateAthleteNotes(id, notes);
    revalidatePath(`/athletes/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update notes' };
  }
}
