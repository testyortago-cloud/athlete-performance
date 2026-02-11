'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { trainingProgramSchema } from '@/lib/validations';
import { createProgram, updateProgram, deleteProgram } from '@/lib/services/programService';

export async function createProgramAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || '',
  };

  const parsed = trainingProgramSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createProgram(parsed.data);
    revalidatePath('/programs');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create program' };
  }
}

export async function updateProgramAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || '',
  };

  const parsed = trainingProgramSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateProgram(id, parsed.data);
    revalidatePath('/programs');
    revalidatePath(`/programs/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update program' };
  }
}

export async function deleteProgramAction(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteProgram(id);
    revalidatePath('/programs');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete program' };
  }
}
