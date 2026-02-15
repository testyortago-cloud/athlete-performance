import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, updateUserPassword, getUserByEmail, TABLES } from '@/lib/airtable';
import { hashPassword } from '@/utils/password';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'coach' | 'athlete';
  createdAt?: string;
}

function mapRecord(record: { id: string; fields: Record<string, unknown> }): UserRecord {
  return {
    id: record.id,
    name: (record.fields.Name as string) || '',
    email: (record.fields.Email as string) || '',
    role: ((record.fields.Role as string) || 'coach') as 'admin' | 'coach' | 'athlete',
    createdAt: (record.fields.Created as string) || undefined,
  };
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const records = await getRecords(TABLES.USERS, {
    sort: [{ field: 'Name', direction: 'asc' }],
  });
  return records.map(mapRecord);
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const record = await getRecordById(TABLES.USERS, id);
  if (!record) return null;
  return mapRecord(record);
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'coach' | 'athlete';
}): Promise<UserRecord> {
  const passwordHash = await hashPassword(data.password);
  const record = await createRecord(TABLES.USERS, {
    Name: data.name,
    Email: data.email,
    PasswordHash: passwordHash,
    Role: data.role,
  });
  return mapRecord(record);
}

export async function updateUser(
  id: string,
  data: { name: string; email: string; role: 'admin' | 'coach' | 'athlete' }
): Promise<UserRecord> {
  const record = await updateRecord(TABLES.USERS, id, {
    Name: data.name,
    Email: data.email,
    Role: data.role,
  });
  return mapRecord(record);
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(id, passwordHash);
}

export async function deleteUser(id: string): Promise<void> {
  await deleteRecord(TABLES.USERS, id);
}

export { getUserByEmail };
