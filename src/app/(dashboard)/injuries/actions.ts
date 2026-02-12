'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { injurySchema } from '@/lib/validations';
import { createInjury, updateInjury, deleteInjury } from '@/lib/services/injuryService';

export async function createInjuryAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const dateResolved = formData.get('dateResolved') as string;

  const raw = {
    athleteId: formData.get('athleteId') as string,
    type: formData.get('type') as string,
    description: formData.get('description') as string,
    mechanism: (formData.get('mechanism') as string) || '',
    bodyRegion: formData.get('bodyRegion') as string,
    dateOccurred: formData.get('dateOccurred') as string,
    dateResolved: dateResolved || null,
    status: formData.get('status') as string,
  };

  const parsed = injurySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createInjury(parsed.data);
    revalidatePath('/injuries');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create injury' };
  }
}

export async function updateInjuryAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const dateResolved = formData.get('dateResolved') as string;

  const raw = {
    athleteId: formData.get('athleteId') as string,
    type: formData.get('type') as string,
    description: formData.get('description') as string,
    mechanism: (formData.get('mechanism') as string) || '',
    bodyRegion: formData.get('bodyRegion') as string,
    dateOccurred: formData.get('dateOccurred') as string,
    dateResolved: dateResolved || null,
    status: formData.get('status') as string,
  };

  const parsed = injurySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateInjury(id, parsed.data);
    revalidatePath('/injuries');
    revalidatePath(`/injuries/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update injury' };
  }
}

export async function updateInjuryStatusAction(id: string, status: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const validStatuses = ['active', 'rehab', 'monitoring', 'resolved'];
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' };
  }

  try {
    await updateInjury(id, { status: status as 'active' | 'rehab' | 'monitoring' | 'resolved' });
    revalidatePath('/injuries');
    revalidatePath(`/injuries/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update status' };
  }
}

export async function deleteInjuryAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteInjury(id);
    revalidatePath('/injuries');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete injury' };
  }
}
