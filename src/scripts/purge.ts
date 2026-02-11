/**
 * DJP Athlete — Purge Script
 *
 * Deletes all records from Airtable tables in reverse FK order.
 *
 * Usage:
 *   npm run purge
 *
 * Requires env vars: AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 */

import Airtable from 'airtable';

const API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

if (!API_KEY || !BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  process.exit(1);
}

const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let reqCount = 0;
async function throttle() {
  reqCount++;
  if (reqCount % 4 === 0) await sleep(250);
}

// Delete order: children before parents to avoid FK violations
const TABLES = [
  'Trial_Data',
  'Testing_Sessions',
  'Daily_Load',
  'Injuries',
  'Metrics',
  'Metric_Categories',
  'Athletes',
  'Sports',
  'Settings',
  'Users',
];

async function getAllRecordIds(table: string): Promise<string[]> {
  const ids: string[] = [];
  await base(table)
    .select({ fields: [] })
    .eachPage((records, fetchNextPage) => {
      for (const r of records) ids.push(r.id);
      fetchNextPage();
    });
  return ids;
}

async function purge() {
  console.log('🗑️  Purging all Airtable data...\n');

  let totalDeleted = 0;

  for (const table of TABLES) {
    try {
      const ids = await getAllRecordIds(table);
      if (ids.length === 0) {
        console.log(`  - ${table}: empty`);
        continue;
      }

      let deleted = 0;
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        await throttle();
        await base(table).destroy(batch);
        deleted += batch.length;
      }
      console.log(`  ✓ ${table}: deleted ${deleted} records`);
      totalDeleted += deleted;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NOT_AUTHORIZED') || msg.includes('403')) {
        console.error(`\n  ✗ ${table}: DELETE not authorized.`);
        console.error('    → Update your Airtable PAT to include the "data.records:write" scope.');
        console.error('    → https://airtable.com/create/tokens\n');
        process.exit(1);
      }
      throw err;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Purge complete! Deleted ${totalDeleted} total records.`);
  console.log(`═══════════════════════════════════════\n`);
}

purge().catch((err) => {
  console.error('Purge failed:', err);
  process.exit(1);
});
