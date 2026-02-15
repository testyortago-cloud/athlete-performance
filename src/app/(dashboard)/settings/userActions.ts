'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { userCreateSchema, userUpdateSchema, passwordResetSchema } from '@/lib/validations';
import { getAllUsers, createUser, updateUser, resetUserPassword, deleteUser, getUserByEmail } from '@/lib/services/userService';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  if (session.user.role !== 'admin') {
    return { error: 'Only admins can manage users', session: null };
  }
  return { error: null, session };
}

export async function getUsersAction() {
  const { error } = await requireAdmin();
  if (error) return { error, users: [] };

  try {
    const users = await getAllUsers();
    return { users };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch users', users: [] };
  }
}

export async function createUserAction(formData: FormData) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    role: formData.get('role') as string,
  };

  const parsed = userCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const existing = await getUserByEmail(parsed.data.email);
    if (existing) {
      return { error: 'A user with this email already exists' };
    }

    await createUser(parsed.data);
    revalidatePath('/settings');
    return { success: true };
  } catch (e) {
    console.error('createUser error:', e);
    return { error: e instanceof Error ? e.message : 'Failed to create user' };
  }
}

export async function updateUserAction(id: string, formData: FormData) {
  const { error, session } = await requireAdmin();
  if (error || !session) return { error: error || 'Unauthorized' };

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    role: formData.get('role') as string,
  };

  const parsed = userUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // Prevent admin from changing their own role away from admin
    if (id === session.user.id && parsed.data.role !== 'admin') {
      return { error: 'You cannot change your own role' };
    }

    // Check email uniqueness (exclude current user)
    const existing = await getUserByEmail(parsed.data.email);
    if (existing && existing.id !== id) {
      return { error: 'A user with this email already exists' };
    }

    await updateUser(id, parsed.data);
    revalidatePath('/settings');
    return { success: true };
  } catch (e) {
    console.error('updateUser error:', e);
    return { error: e instanceof Error ? e.message : 'Failed to update user' };
  }
}

export async function resetUserPasswordAction(id: string, formData: FormData) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const raw = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const parsed = passwordResetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await resetUserPassword(id, parsed.data.password);
    return { success: true };
  } catch (e) {
    console.error('resetUserPassword error:', e);
    return { error: e instanceof Error ? e.message : 'Failed to reset password' };
  }
}

export async function deleteUserAction(id: string) {
  const { error, session } = await requireAdmin();
  if (error || !session) return { error: error || 'Unauthorized' };

  if (id === session.user.id) {
    return { error: 'You cannot delete your own account' };
  }

  try {
    await deleteUser(id);
    revalidatePath('/settings');
    return { success: true };
  } catch (e) {
    console.error('deleteUser error:', e);
    return { error: e instanceof Error ? e.message : 'Failed to delete user' };
  }
}
