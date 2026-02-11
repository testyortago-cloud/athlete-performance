'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToastStore } from '@/stores/toastStore';
import { updateProfileAction } from './actions';
import { Key } from 'lucide-react';
import type { UserRole } from '@/types';

interface ProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

const roleBadgeVariant = {
  admin: 'default' as const,
  coach: 'success' as const,
  athlete: 'warning' as const,
};

export function ProfileClient({ user }: ProfileClientProps) {
  const { addToast } = useToastStore();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }
    setSaving(true);
    const result = await updateProfileAction({ name: name.trim() });
    if (result.success) {
      addToast('Profile updated', 'success');
    } else {
      addToast(result.error || 'Failed to update profile', 'error');
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!currentPassword) {
      addToast('Current password is required', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setChangingPassword(true);
    const result = await updateProfileAction({
      currentPassword,
      newPassword,
    });
    if (result.success) {
      addToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      addToast(result.error || 'Failed to change password', 'error');
    }
    setChangingPassword(false);
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <PageHeader title="Profile" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <div className="mb-6 flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div>
              <h3 className="text-lg font-semibold text-black">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Badge variant={roleBadgeVariant[user.role]} className="mt-1">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Role
              </label>
              <input
                type="text"
                value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                disabled
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-gray-500"
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-black">Change Password</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                onClick={handleChangePassword}
                loading={changingPassword}
              >
                Change Password
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
