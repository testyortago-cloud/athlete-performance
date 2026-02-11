'use server';

import { thresholdSettingsSchema } from '@/lib/validations';
import { updateThresholdSettings } from '@/lib/services/settingsService';

export async function updateSettingsAction(data: {
  acwrModerate: number;
  acwrHigh: number;
  loadSpikePercent: number;
  defaultDays: number;
}) {
  const parsed = thresholdSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await updateThresholdSettings(parsed.data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save settings' };
  }
}
