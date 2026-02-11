import { getRecords, createRecord, updateRecord, TABLES } from '@/lib/airtable';
import { DEFAULT_THRESHOLDS, type ThresholdSettings } from '@/types/settings';

export async function getThresholdSettings(): Promise<ThresholdSettings> {
  try {
    const records = await getRecords(TABLES.SETTINGS, {
      filterByFormula: `{Category} = 'thresholds'`,
      maxRecords: 10,
    });

    if (records.length === 0) return { ...DEFAULT_THRESHOLDS };

    const settings: ThresholdSettings = { ...DEFAULT_THRESHOLDS };

    for (const record of records) {
      const key = record.fields.Key as string;
      const value = Number(record.fields.Value);
      if (isNaN(value)) continue;

      if (key === 'acwrModerate') settings.acwrModerate = value;
      if (key === 'acwrHigh') settings.acwrHigh = value;
      if (key === 'loadSpikePercent') settings.loadSpikePercent = value;
      if (key === 'defaultDays') settings.defaultDays = value;
    }

    return settings;
  } catch {
    return { ...DEFAULT_THRESHOLDS };
  }
}

export async function updateThresholdSettings(
  settings: ThresholdSettings
): Promise<void> {
  const records = await getRecords(TABLES.SETTINGS, {
    filterByFormula: `{Category} = 'thresholds'`,
    maxRecords: 10,
  });

  const existingMap = new Map<string, string>();
  for (const record of records) {
    existingMap.set(record.fields.Key as string, record.id);
  }

  const entries: [string, number][] = [
    ['acwrModerate', settings.acwrModerate],
    ['acwrHigh', settings.acwrHigh],
    ['loadSpikePercent', settings.loadSpikePercent],
    ['defaultDays', settings.defaultDays],
  ];

  for (const [key, value] of entries) {
    const existingId = existingMap.get(key);
    if (existingId) {
      await updateRecord(TABLES.SETTINGS, existingId, {
        Key: key,
        Value: String(value),
        Category: 'thresholds',
      });
    } else {
      await createRecord(TABLES.SETTINGS, {
        Key: key,
        Value: String(value),
        Category: 'thresholds',
      });
    }
  }
}
