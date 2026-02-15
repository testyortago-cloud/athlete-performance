'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToastStore } from '@/stores/toastStore';
import { createUserAction, updateUserAction } from '@/app/(dashboard)/settings/userActions';

interface UserFormProps {
  onSuccess?: () => void;
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'coach' | 'athlete';
  };
  currentUserId?: string;
}

export function UserForm({ onSuccess, initialData, currentUserId }: UserFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!initialData;
  const isSelf = initialData?.id === currentUserId;

  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [role, setRole] = useState(initialData?.role || 'coach');
  const [password, setPassword] = useState('');

  const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Coach', value: 'coach' },
    { label: 'Athlete', value: 'athlete' },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateUserAction(initialData.id, formData)
        : await createUserAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        addToast(isEdit ? 'User updated successfully' : 'User created successfully', 'success');
        onSuccess?.();
        router.refresh();
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

      <Input
        id="name"
        name="name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        required
      />

      <Input
        id="email"
        name="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="user@example.com"
        required
      />

      <Select
        id="role"
        name="role"
        label="Role"
        options={roleOptions}
        value={role}
        onChange={(e) => setRole(e.target.value as 'admin' | 'coach' | 'athlete')}
        disabled={isSelf}
      />
      {isSelf && (
        <p className="text-xs text-gray-400">You cannot change your own role.</p>
      )}

      {!isEdit && (
        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          required
          minLength={8}
        />
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
