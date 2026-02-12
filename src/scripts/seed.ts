/**
 * DJP Athlete — Seed Script (Lite)
 *
 * Populates Airtable with realistic sport-science data, then syncs to Supabase.
 * ~200 API calls — runs in ~1-2 minutes.
 *
 * Usage:
 *   npm run seed
 *
 * Requires env vars: AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 * Optional: NEXT_PUBLIC_APP_URL (defaults to http://localhost:3000)
 */

import Airtable, { FieldSet } from 'airtable';
import bcrypt from 'bcryptjs';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

async function createRecord(table: string, fields: Record<string, unknown>): Promise<string> {
  await throttle();
  const record = await base(table).create(fields as Partial<FieldSet>);
  return record.id;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  return d.toISOString().split('T')[0];
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function computeBest(trials: (number | null)[], method: 'highest' | 'lowest'): number | null {
  const vals = trials.filter((t): t is number => t !== null);
  if (vals.length === 0) return null;
  return method === 'highest' ? Math.max(...vals) : Math.min(...vals);
}

function computeAvg(trials: (number | null)[]): number | null {
  const vals = trials.filter((t): t is number => t !== null);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SPORTS = [
  { name: 'Rugby League', description: 'Full-contact team sport with 13 players per side' },
  { name: 'Basketball', description: 'Indoor court sport with 5 players per side' },
  { name: 'Swimming', description: 'Aquatic individual and relay racing' },
];

const PROGRAMS = [
  { name: 'Pre-Season', description: 'High-volume conditioning and strength building phase before competition' },
  { name: 'In-Season', description: 'Maintenance training with focus on recovery and match preparation' },
  { name: 'Off-Season', description: 'Active recovery and foundational fitness development' },
  { name: 'Return to Play', description: 'Graduated rehabilitation program for athletes returning from injury' },
];

const ATHLETES: { name: string; dob: string; sport: string; position: string }[] = [
  // Rugby League — 3
  { name: 'Lachlan Mitchell', dob: '2001-03-15', sport: 'Rugby League', position: 'Fullback' },
  { name: 'Jake Thompson', dob: '2000-07-22', sport: 'Rugby League', position: 'Halfback' },
  { name: 'Ethan Williams', dob: '1999-11-08', sport: 'Rugby League', position: 'Prop' },
  // Basketball — 3
  { name: 'Kai Roberts', dob: '2002-04-12', sport: 'Basketball', position: 'Point Guard' },
  { name: 'Tyler Evans', dob: '2001-06-25', sport: 'Basketball', position: 'Shooting Guard' },
  { name: 'Jayden Clark', dob: '2000-02-17', sport: 'Basketball', position: 'Small Forward' },
  // Swimming — 2
  { name: 'Liam Scott', dob: '2003-01-05', sport: 'Swimming', position: 'Freestyle' },
  { name: 'Isaac Turner', dob: '2002-09-19', sport: 'Swimming', position: 'Backstroke' },
];

interface MetricDef {
  sport: string;
  category: string;
  sortOrder: number;
  metrics: { name: string; unit: string; best: 'highest' | 'lowest'; range: [number, number]; hasReps?: boolean }[];
}

const METRICS: MetricDef[] = [
  {
    sport: 'Rugby League', category: 'Speed', sortOrder: 1,
    metrics: [
      { name: '10m Sprint', unit: 's', best: 'lowest', range: [1.55, 1.95] },
      { name: '20m Sprint', unit: 's', best: 'lowest', range: [2.80, 3.40] },
      { name: '40m Sprint', unit: 's', best: 'lowest', range: [5.00, 5.90] },
    ],
  },
  {
    sport: 'Rugby League', category: 'Power', sortOrder: 2,
    metrics: [
      { name: 'Countermovement Jump', unit: 'cm', best: 'highest', range: [35, 60] },
      { name: 'Broad Jump', unit: 'cm', best: 'highest', range: [220, 290] },
    ],
  },
  {
    sport: 'Rugby League', category: 'Strength', sortOrder: 3,
    metrics: [
      { name: 'Bench Press 1RM', unit: 'kg', best: 'highest', range: [80, 140], hasReps: true },
      { name: 'Back Squat 1RM', unit: 'kg', best: 'highest', range: [120, 200], hasReps: true },
    ],
  },
  {
    sport: 'Rugby League', category: 'Endurance', sortOrder: 4,
    metrics: [
      { name: 'Yo-Yo IR1', unit: 'level', best: 'highest', range: [16, 21] },
    ],
  },
  {
    sport: 'Basketball', category: 'Speed & Agility', sortOrder: 1,
    metrics: [
      { name: 'Lane Agility', unit: 's', best: 'lowest', range: [10.5, 12.5] },
      { name: '3/4 Court Sprint', unit: 's', best: 'lowest', range: [3.00, 3.60] },
    ],
  },
  {
    sport: 'Basketball', category: 'Power', sortOrder: 2,
    metrics: [
      { name: 'Vertical Leap', unit: 'cm', best: 'highest', range: [55, 85] },
    ],
  },
  {
    sport: 'Basketball', category: 'Endurance', sortOrder: 3,
    metrics: [
      { name: 'Beep Test', unit: 'level', best: 'highest', range: [10, 14] },
    ],
  },
  {
    sport: 'Swimming', category: 'Sprint', sortOrder: 1,
    metrics: [
      { name: '50m Freestyle', unit: 's', best: 'lowest', range: [22.5, 27.0] },
      { name: '100m Freestyle', unit: 's', best: 'lowest', range: [49.0, 58.0] },
    ],
  },
  {
    sport: 'Swimming', category: 'Power', sortOrder: 2,
    metrics: [
      { name: 'Med Ball Throw', unit: 'cm', best: 'highest', range: [400, 650] },
    ],
  },
  {
    sport: 'Swimming', category: 'Endurance', sortOrder: 3,
    metrics: [
      { name: '400m Freestyle', unit: 's', best: 'lowest', range: [240, 290] },
    ],
  },
];

const SESSION_TYPES = ['Training', 'Match', 'Gym', 'Recovery', 'Skills'];

const INJURIES = [
  { bodyRegion: 'Hamstring', type: 'Injury', desc: 'Grade 1 hamstring strain', mechanism: 'Sprinting' },
  { bodyRegion: 'Ankle', type: 'Injury', desc: 'Lateral ankle sprain', mechanism: 'Landing' },
  { bodyRegion: 'Shoulder', type: 'Injury', desc: 'Rotator cuff impingement', mechanism: 'Overhead throwing' },
  { bodyRegion: 'Knee', type: 'Injury', desc: 'ACL strain during contact', mechanism: 'Tackle' },
  { bodyRegion: 'Respiratory', type: 'Illness', desc: 'Upper respiratory tract infection', mechanism: '' },
];

// ─── Purge ────────────────────────────────────────────────────────────────────

const PURGE_ORDER = [
  'Trial_Data',
  'Testing_Sessions',
  'Daily_Load',
  'Injuries',
  'Metrics',
  'Metric_Categories',
  'Athletes',
  'Training_Programs',
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

async function purgeAll() {
  console.log('Purging existing data...\n');

  for (const table of PURGE_ORDER) {
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
      console.log(`  + ${table}: deleted ${deleted} records`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NOT_AUTHORIZED') || msg.includes('403')) {
        console.error(`\n  x ${table}: DELETE not authorized.`);
        console.error('    -> Update your Airtable PAT to include the "data.records:write" scope.');
        console.error('    -> https://airtable.com/create/tokens\n');
        process.exit(1);
      }
      throw err;
    }
  }

  console.log('');
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function seed() {
  const start = Date.now();
  console.log('Starting seed...\n');

  await purgeAll();

  // 1. Users
  console.log('Creating users...');
  const adminHash = await bcrypt.hash('admin123', 12);
  const coachHash = await bcrypt.hash('coach123', 12);
  await createRecord('Users', { Name: 'Admin User', Email: 'admin@djp.com', PasswordHash: adminHash, Role: 'admin' });
  await createRecord('Users', { Name: 'Sarah Coach', Email: 'coach@djp.com', PasswordHash: coachHash, Role: 'coach' });
  console.log('  + 2 users\n');

  // 2. Sports
  console.log('Creating sports...');
  const sportIds: Record<string, string> = {};
  for (const s of SPORTS) {
    sportIds[s.name] = await createRecord('Sports', { Name: s.name, Description: s.description });
  }
  console.log(`  + ${SPORTS.length} sports\n`);

  // 3. Training Programs
  console.log('Creating programs...');
  const programIds: Record<string, string> = {};
  for (const p of PROGRAMS) {
    programIds[p.name] = await createRecord('Training_Programs', { Name: p.name, Description: p.description });
  }
  console.log(`  + ${PROGRAMS.length} programs\n`);

  // 4. Athletes
  console.log('Creating athletes...');
  const programNames = Object.keys(programIds);
  const athleteIds: { id: string; name: string; sport: string }[] = [];
  for (const a of ATHLETES) {
    const id = await createRecord('Athletes', {
      Name: a.name,
      DateOfBirth: a.dob,
      Sport: [sportIds[a.sport]],
      Program: [programIds[pick(programNames)]],
      Position: a.position,
      Status: 'Active',
    });
    athleteIds.push({ id, name: a.name, sport: a.sport });
  }
  console.log(`  + ${athleteIds.length} athletes\n`);

  // 5. Metric Categories + Metrics
  console.log('Creating metrics...');
  interface MetricRef { id: string; sport: string; best: 'highest' | 'lowest'; range: [number, number]; hasReps?: boolean }
  const metricRefs: MetricRef[] = [];
  let catCount = 0;
  let metricCount = 0;

  for (const md of METRICS) {
    const catId = await createRecord('Metric_Categories', {
      Sport: [sportIds[md.sport]],
      Name: md.category,
      SortOrder: md.sortOrder,
    });
    catCount++;

    for (const m of md.metrics) {
      const metricId = await createRecord('Metrics', {
        Category: [catId],
        Sport: [sportIds[md.sport]],
        Name: m.name,
        Unit: m.unit,
        IsDerived: false,
        HasReps: m.hasReps || false,
        BestScoreMethod: m.best === 'highest' ? 'Highest' : 'Lowest',
        TrialCount: 3,
      });
      metricRefs.push({ id: metricId, sport: md.sport, best: m.best, range: m.range, hasReps: m.hasReps });
      metricCount++;
    }
  }
  console.log(`  + ${catCount} categories, ${metricCount} metrics\n`);

  // 6. Testing Sessions + Trial Data — 2 sessions per athlete
  console.log('Creating testing sessions...');
  let sessionCount = 0;
  let trialCount = 0;

  for (const athlete of athleteIds) {
    const sportMetrics = metricRefs.filter((m) => m.sport === athlete.sport);
    const dates = [randomDate(60), randomDate(14)].sort();

    for (const date of dates) {
      const sessionId = await createRecord('Testing_Sessions', {
        Athlete: [athlete.id],
        Date: date,
        Notes: `${athlete.sport} testing battery`,
        CreatedBy: 'seed-script',
      });
      sessionCount++;

      for (const metric of sportMetrics) {
        const t1 = randomBetween(metric.range[0], metric.range[1]);
        const t2 = randomBetween(metric.range[0], metric.range[1]);
        const t3 = randomBetween(metric.range[0], metric.range[1]);

        const trialFields: Record<string, unknown> = {
          Session: [sessionId],
          Metric: [metric.id],
          Trial_1: t1,
          Trial_2: t2,
          Trial_3: t3,
          BestScore: computeBest([t1, t2, t3], metric.best),
          AverageScore: computeAvg([t1, t2, t3]),
        };

        if (metric.hasReps) {
          trialFields.Reps_1 = randomInt(1, 10);
          trialFields.Reps_2 = randomInt(1, 10);
          trialFields.Reps_3 = randomInt(1, 10);
        }

        await createRecord('Trial_Data', trialFields);
        trialCount++;
      }
    }
  }
  console.log(`  + ${sessionCount} sessions, ${trialCount} trials\n`);

  // 7. Daily Load — 14 days per athlete
  console.log('Creating daily load...');
  let loadCount = 0;

  for (const athlete of athleteIds) {
    for (let day = 0; day < 14; day++) {
      if (Math.random() < 0.15) continue; // rest day

      const sessionType = pick(SESSION_TYPES);
      const rpe = sessionType === 'Recovery' ? randomInt(2, 4)
        : sessionType === 'Match' ? randomInt(7, 10)
        : randomInt(4, 8);
      const duration = sessionType === 'Match' ? randomInt(60, 90)
        : sessionType === 'Recovery' ? randomInt(20, 40)
        : randomInt(45, 90);

      await createRecord('Daily_Load', {
        Athlete: [athlete.id],
        Date: dateNDaysAgo(day),
        RPE: rpe,
        DurationMinutes: duration,
        TrainingLoad: rpe * duration,
        SessionType: sessionType,
      });
      loadCount++;
    }
  }
  console.log(`  + ${loadCount} daily load entries\n`);

  // 8. Injuries — 0-1 per athlete
  console.log('Creating injuries...');
  let injuryCount = 0;

  for (const athlete of athleteIds) {
    if (Math.random() < 0.4) continue; // 40% chance of no injury

    const template = pick(INJURIES);
    const dateOccurred = randomDate(90);
    const isResolved = Math.random() > 0.35;
    const daysToResolve = randomInt(5, 30);
    const resolvedDate = new Date(dateOccurred);
    resolvedDate.setDate(resolvedDate.getDate() + daysToResolve);

    await createRecord('Injuries', {
      Athlete: [athlete.id],
      Type: template.type,
      Description: template.desc,
      Mechanism: template.mechanism,
      BodyRegion: template.bodyRegion,
      DateOccurred: dateOccurred,
      DateResolved: isResolved ? resolvedDate.toISOString().split('T')[0] : null,
      DaysLost: isResolved ? daysToResolve : null,
      Status: isResolved ? 'Resolved' : 'Active',
    });
    injuryCount++;
  }
  console.log(`  + ${injuryCount} injuries\n`);

  // 9. Settings
  console.log('Creating settings...');
  const settings = [
    { Key: 'acwrModerate', Value: '1.3', Category: 'thresholds' },
    { Key: 'acwrHigh', Value: '1.5', Category: 'thresholds' },
    { Key: 'loadSpikePercent', Value: '50', Category: 'thresholds' },
    { Key: 'defaultDays', Value: '30', Category: 'thresholds' },
  ];
  for (const s of settings) {
    await createRecord('Settings', s);
  }
  console.log(`  + ${settings.length} settings\n`);

  // Summary
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('===================================');
  console.log(`  Seed complete! (${elapsed}s)`);
  console.log('===================================');
  console.log(`  Users:      2`);
  console.log(`  Sports:     ${SPORTS.length}`);
  console.log(`  Programs:   ${PROGRAMS.length}`);
  console.log(`  Athletes:   ${athleteIds.length}`);
  console.log(`  Categories: ${catCount}`);
  console.log(`  Metrics:    ${metricCount}`);
  console.log(`  Sessions:   ${sessionCount}`);
  console.log(`  Trials:     ${trialCount}`);
  console.log(`  Load:       ${loadCount}`);
  console.log(`  Injuries:   ${injuryCount}`);
  console.log(`  Settings:   ${settings.length}`);
  console.log(`  Total API:  ~${reqCount} calls`);
  console.log('');

  // 10. Sync to Supabase
  console.log('Syncing to Supabase...');
  try {
    const res = await fetch(`${APP_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      console.log('  + Sync complete:', data.synced);
    } else {
      console.log(`  ! Sync returned ${res.status} — run manually from the app header`);
    }
  } catch {
    console.log('  ! Could not reach app for sync — start the dev server and use the sync button');
  }

  console.log('\nDone!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
