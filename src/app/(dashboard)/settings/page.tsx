import { getThresholdSettings } from '@/lib/services/settingsService';
import { getAllUsers } from '@/lib/services/userService';
import { auth } from '@/lib/auth';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [thresholds, session] = await Promise.all([
    getThresholdSettings(),
    auth(),
  ]);

  const isAdmin = session?.user?.role === 'admin';
  const users = isAdmin ? await getAllUsers() : [];

  return (
    <SettingsClient
      thresholds={thresholds}
      users={users}
      isAdmin={isAdmin}
      currentUserId={session?.user?.id}
    />
  );
}
