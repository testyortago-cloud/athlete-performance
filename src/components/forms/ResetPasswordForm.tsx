'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToastStore } from '@/stores/toastStore';
import { resetUserPasswordAction } from '@/app/(dashboard)/settings/userActions';

interface ResetPasswordFormProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export function ResetPasswordForm({ userId, userName, onSuccess }: ResetPasswordFormProps) {
  const { addToast } = useToastStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await resetUserPasswordAction(userId, formData);

      if (result.error) {
        setError(result.error);
      } else {
        addToast(`Password reset for ${userName}`, 'success');
        onSuccess?.();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Set a new password for <span className="font-medium text-black">{userName}</span>.
      </p>

      <Input
        id="password"
        name="password"
        label="New Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Minimum 8 characters"
        required
        minLength={8}
      />

      <Input
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter password"
        required
        minLength={8}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          Reset Password
        </Button>
      </div>
    </form>
  );
}
