import { getThresholdSettings } from '@/lib/services/settingsService';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const thresholds = await getThresholdSettings();

  return <SettingsClient thresholds={thresholds} />;
}
