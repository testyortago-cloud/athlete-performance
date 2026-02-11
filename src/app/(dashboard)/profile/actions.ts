'use server';

import { auth } from '@/lib/auth';
import { getUserByEmail, updateRecord, TABLES } from '@/lib/airtable';
import { verifyPassword, hashPassword } from '@/utils/password';

export async function updateProfileAction(data: {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Not authenticated' };
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  try {
    // Name update
    if (data.name !== undefined) {
      await updateRecord(TABLES.USERS, user.id, { Name: data.name });
      return { success: true };
    }

    // Password change
    if (data.currentPassword && data.newPassword) {
      const isValid = await verifyPassword(data.currentPassword, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      if (data.newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters' };
      }

      const hash = await hashPassword(data.newPassword);
      await updateRecord(TABLES.USERS, user.id, { PasswordHash: hash });
      return { success: true };
    }

    return { success: false, error: 'No changes provided' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update profile',
    };
  }
}
