'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { athleteSchema, wellnessCheckinSchema, goalSchema, journalEntrySchema } from '@/lib/validations';
import { createAthlete, updateAthlete, deleteAthlete, updateAthleteNotes } from '@/lib/services/athleteService';
import { createWellnessCheckin, updateWellnessCheckin, deleteWellnessCheckin } from '@/lib/services/wellnessService';
import { createGoal, updateGoal, deleteGoal } from '@/lib/services/goalService';
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from '@/lib/services/journalService';
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

export async function createWellnessAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    date: formData.get('date') as string,
    sleepHours: Number(formData.get('sleepHours')),
    sleepQuality: Number(formData.get('sleepQuality')),
    soreness: Number(formData.get('soreness')),
    fatigue: Number(formData.get('fatigue')),
    mood: Number(formData.get('mood')),
    hydration: Number(formData.get('hydration')),
  };

  const parsed = wellnessCheckinSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createWellnessCheckin(parsed.data);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('createWellnessCheckin error:', e);
    return { error: msg || 'Failed to create wellness check-in' };
  }
}

export async function updateWellnessAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    date: formData.get('date') as string,
    sleepHours: Number(formData.get('sleepHours')),
    sleepQuality: Number(formData.get('sleepQuality')),
    soreness: Number(formData.get('soreness')),
    fatigue: Number(formData.get('fatigue')),
    mood: Number(formData.get('mood')),
    hydration: Number(formData.get('hydration')),
  };

  const parsed = wellnessCheckinSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateWellnessCheckin(id, parsed.data);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('updateWellnessCheckin error:', e);
    return { error: msg || 'Failed to update wellness check-in' };
  }
}

export async function deleteWellnessAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteWellnessCheckin(id);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('deleteWellnessCheckin error:', e);
    return { error: msg || 'Failed to delete wellness check-in' };
  }
}

// ── Goal Actions ────────────────────────────────────────────────────

export async function createGoalAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    metricId: formData.get('metricId') as string,
    metricName: formData.get('metricName') as string,
    targetValue: Number(formData.get('targetValue')),
    direction: formData.get('direction') as string,
    deadline: (formData.get('deadline') as string) || null,
  };

  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createGoal(parsed.data);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('createGoal error:', e);
    return { error: msg || 'Failed to create goal' };
  }
}

export async function updateGoalAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    metricId: formData.get('metricId') as string,
    metricName: formData.get('metricName') as string,
    targetValue: Number(formData.get('targetValue')),
    direction: formData.get('direction') as string,
    deadline: (formData.get('deadline') as string) || null,
  };

  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateGoal(id, parsed.data);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('updateGoal error:', e);
    return { error: msg || 'Failed to update goal' };
  }
}

export async function deleteGoalAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteGoal(id);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('deleteGoal error:', e);
    return { error: msg || 'Failed to delete goal' };
  }
}

export async function markGoalAchievedAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await updateGoal(id, {
      status: 'achieved',
      achievedDate: new Date().toISOString().split('T')[0],
    });
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('markGoalAchieved error:', e);
    return { error: msg || 'Failed to update goal' };
  }
}

// ── Journal Actions ─────────────────────────────────────────────────

export async function createJournalAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    date: formData.get('date') as string,
    content: formData.get('content') as string,
    tags: formData.get('tags') as string,
  };

  const parsed = journalEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const tags = parsed.data.tags
      ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    await createJournalEntry({ ...parsed.data, tags });
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('createJournalEntry error:', e);
    return { error: msg || 'Failed to create journal entry' };
  }
}

export async function updateJournalAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    athleteId: formData.get('athleteId') as string,
    date: formData.get('date') as string,
    content: formData.get('content') as string,
    tags: formData.get('tags') as string,
  };

  const parsed = journalEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const tags = parsed.data.tags
      ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    await updateJournalEntry(id, { ...parsed.data, tags });
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('updateJournalEntry error:', e);
    return { error: msg || 'Failed to update journal entry' };
  }
}

export async function deleteJournalAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteJournalEntry(id);
    revalidatePath('/athletes');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    console.error('deleteJournalEntry error:', e);
    return { error: msg || 'Failed to delete journal entry' };
  }
}
