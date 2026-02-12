'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { metricCategorySchema, metricSchema } from '@/lib/validations';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createMetric,
  updateMetric,
  deleteMetric,
} from '@/lib/services/metricService';

export async function createCategoryAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    sportId: formData.get('sportId') as string,
    name: formData.get('name') as string,
    sortOrder: Number(formData.get('sortOrder')),
  };

  const parsed = metricCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createCategory(parsed.data);
    revalidatePath(`/sports/${raw.sportId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create category' };
  }
}

export async function updateCategoryAction(id: string, sportId: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    sportId,
    name: formData.get('name') as string,
    sortOrder: Number(formData.get('sortOrder')),
  };

  const parsed = metricCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateCategory(id, parsed.data);
    revalidatePath(`/sports/${sportId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update category' };
  }
}

export async function deleteCategoryAction(id: string, sportId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteCategory(id);
    revalidatePath(`/sports/${sportId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete category' };
  }
}

export async function createMetricAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    categoryId: formData.get('categoryId') as string,
    sportId: formData.get('sportId') as string,
    name: formData.get('name') as string,
    unit: formData.get('unit') as string,
    isDerived: formData.get('isDerived') === 'true',
    hasReps: formData.get('hasReps') === 'true',
    formula: (formData.get('formula') as string) || undefined,
    bestScoreMethod: (formData.get('bestScoreMethod') as string) || 'highest',
    trialCount: Number(formData.get('trialCount')) || 3,
  };

  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createMetric(parsed.data);
    revalidatePath(`/sports/${raw.sportId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create metric' };
  }
}

export async function updateMetricAction(id: string, sportId: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const raw = {
    categoryId: formData.get('categoryId') as string,
    sportId,
    name: formData.get('name') as string,
    unit: formData.get('unit') as string,
    isDerived: formData.get('isDerived') === 'true',
    hasReps: formData.get('hasReps') === 'true',
    formula: (formData.get('formula') as string) || undefined,
    bestScoreMethod: (formData.get('bestScoreMethod') as string) || 'highest',
    trialCount: Number(formData.get('trialCount')) || 3,
  };

  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateMetric(id, parsed.data);
    revalidatePath(`/sports/${sportId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update metric' };
  }
}

export async function deleteMetricAction(id: string, sportId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    await deleteMetric(id);
    revalidatePath(`/sports/${sportId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete metric' };
  }
}
