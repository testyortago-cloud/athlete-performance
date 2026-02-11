'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';
import { updateSettingsAction } from './actions';
import type { ThresholdSettings } from '@/types';

interface SettingsClientProps {
  thresholds: ThresholdSettings;
}

export function SettingsClient({ thresholds }: SettingsClientProps) {
  const [acwrModerate, setAcwrModerate] = useState(thresholds.acwrModerate);
  const [acwrHigh, setAcwrHigh] = useState(thresholds.acwrHigh);
  const [loadSpikePercent, setLoadSpikePercent] = useState(thresholds.loadSpikePercent);
  const [defaultDays, setDefaultDays] = useState(thresholds.defaultDays);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  async function handleSave() {
    setSaving(true);
    const result = await updateSettingsAction({
      acwrModerate,
      acwrHigh,
      loadSpikePercent,
      defaultDays,
    });

    if (result.success) {
      addToast('Settings saved successfully', 'success');
    } else {
      addToast(result.error || 'Failed to save settings', 'error');
    }
    setSaving(false);
  }

  return (
    <>
      <PageHeader title="Settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">
            ACWR Risk Thresholds
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Configure the acute-to-chronic workload ratio thresholds used to determine risk levels across the platform.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Moderate Risk Threshold
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={acwrModerate}
                onChange={(e) => setAcwrModerate(Number(e.target.value))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                ACWR above this value triggers moderate risk (default: 1.3)
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                High Risk Threshold
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={acwrHigh}
                onChange={(e) => setAcwrHigh(Number(e.target.value))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                ACWR above this value triggers high risk (default: 1.5)
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">
            Load Monitoring
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Configure load spike detection and default time ranges for analytics.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Load Spike Threshold (%)
              </label>
              <input
                type="number"
                step="5"
                min="1"
                max="500"
                value={loadSpikePercent}
                onChange={(e) => setLoadSpikePercent(Number(e.target.value))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                Week-over-week load increase % that triggers a spike alert (default: 50%)
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Default Date Range (days)
              </label>
              <input
                type="number"
                step="1"
                min="7"
                max="365"
                value={defaultDays}
                onChange={(e) => setDefaultDays(Number(e.target.value))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                Default number of days shown in analytics charts (default: 30)
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          Save Settings
        </Button>
      </div>
    </>
  );
}
