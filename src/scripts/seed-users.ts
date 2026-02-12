/**
 * DJP Athlete — User Seed Only
 *
 * Creates demo users in Airtable (purges existing users first).
 *
 * Usage:
 *   npm run seed:users
 */

import Airtable, { FieldSet } from 'airtable';
import bcrypt from 'bcryptjs';

const API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

if (!API_KEY || !BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  process.exit(1);
}

const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);

const USERS = [
  { Name: 'Admin User', Email: 'admin@djp.com', Password: 'admin123', Role: 'admin' },
  { Name: 'Sarah Coach', Email: 'coach@djp.com', Password: 'coach123', Role: 'coach' },
];

async function purgeUsers() {
  const ids: string[] = [];
  await base('Users')
    .select({ fields: [] })
    .eachPage((records, next) => {
      for (const r of records) ids.push(r.id);
      next();
    });

  if (ids.length === 0) {
    console.log('  Users table already empty');
    return;
  }

  for (let i = 0; i < ids.length; i += 10) {
    await base('Users').destroy(ids.slice(i, i + 10));
  }
  console.log(`  Purged ${ids.length} existing users`);
}

async function seed() {
  console.log('Seeding users...\n');

  await purgeUsers();

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.Password, 12);
    await base('Users').create({
      Name: u.Name,
      Email: u.Email,
      PasswordHash: hash,
      Role: u.Role,
    } as Partial<FieldSet>);
    console.log(`  + ${u.Email} (${u.Role})`);
  }

  console.log(`\nDone — ${USERS.length} users created.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
