'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';
import { AcwrGauge } from '@/components/charts/AcwrGauge';
import { updateSettingsAction } from './actions';
import { useNotificationPrefsStore, type NotificationPrefs } from '@/stores/notificationPrefsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useReportPrefsStore, ALL_SECTIONS, REPORT_SECTION_LABELS, type ReportSection, type ReportFrequency } from '@/stores/reportPrefsStore';
import { HelpTip } from '@/components/ui/HelpTip';
import { cn } from '@/utils/cn';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { UserForm } from '@/components/forms/UserForm';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';
import { deleteUserAction } from './userActions';
import { Settings, Activity, Bell, Database, RotateCcw, HelpCircle, FileText, Plus, X, Check, Mail, UserCog, Pencil, KeyRound, Trash2 } from 'lucide-react';
import type { ThresholdSettings } from '@/types';
import { DEFAULT_THRESHOLDS } from '@/types';
import type { UserRecord } from '@/lib/services/userService';

interface SettingsClientProps {
  thresholds: ThresholdSettings;
  users?: UserRecord[];
  isAdmin?: boolean;
  currentUserId?: string;
}

type SettingsTab = 'general' | 'risk' | 'notifications' | 'reports' | 'data' | 'users';

const BASE_TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
  { key: 'risk', label: 'Risk Thresholds', icon: <Activity className="h-4 w-4" /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { key: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
  { key: 'data', label: 'Data', icon: <Database className="h-4 w-4" /> },
];

const USERS_TAB = { key: 'users' as SettingsTab, label: 'Users', icon: <UserCog className="h-4 w-4" /> };

export function SettingsClient({ thresholds, users = [], isAdmin = false, currentUserId }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const TABS = isAdmin ? [...BASE_TABS, USERS_TAB] : BASE_TABS;
  const [acwrModerate, setAcwrModerate] = useState(thresholds.acwrModerate);
  const [acwrHigh, setAcwrHigh] = useState(thresholds.acwrHigh);
  const [loadSpikePercent, setLoadSpikePercent] = useState(thresholds.loadSpikePercent);
  const [defaultDays, setDefaultDays] = useState(thresholds.defaultDays);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();
  const notifPrefs = useNotificationPrefsStore();
  const onboarding = useOnboardingStore();
  const reportPrefs = useReportPrefsStore();
  const [newRecipient, setNewRecipient] = useState('');

  // User management state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const router = useRouter();

  async function handleDeleteUser() {
    if (!deletingUser) return;
    setDeleteLoading(true);
    const result = await deleteUserAction(deletingUser.id);
    if (result.error) {
      addToast(result.error, 'error');
    } else {
      addToast('User deleted successfully', 'success');
      router.refresh();
    }
    setDeleteLoading(false);
    setDeletingUser(null);
  }

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

  function handleResetGeneral() {
    setDefaultDays(DEFAULT_THRESHOLDS.defaultDays);
    addToast('General settings reset to defaults', 'success');
  }

  function handleResetRisk() {
    setAcwrModerate(DEFAULT_THRESHOLDS.acwrModerate);
    setAcwrHigh(DEFAULT_THRESHOLDS.acwrHigh);
    setLoadSpikePercent(DEFAULT_THRESHOLDS.loadSpikePercent);
    addToast('Risk thresholds reset to defaults', 'success');
  }

  return (
    <>
      <PageHeader title="Settings" />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar tabs */}
        <nav className="flex lg:w-56 lg:shrink-0 lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-muted hover:text-black'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">General</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure general platform settings and defaults.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={handleResetGeneral}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-6">
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
                    Default number of days shown in analytics charts (default: {DEFAULT_THRESHOLDS.defaultDays})
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Onboarding
                  </label>
                  <Button
                    variant="outline"
                    icon={<HelpCircle className="h-3.5 w-3.5" />}
                    onClick={() => {
                      onboarding.reset();
                      addToast('Tour will restart on your next dashboard visit', 'success');
                    }}
                  >
                    Restart Tour
                  </Button>
                  <p className="mt-1 text-xs text-gray-400">
                    Replay the onboarding walkthrough that highlights key dashboard features.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} loading={saving}>
                  Save Settings
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black">Risk Thresholds</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure ACWR risk thresholds and load spike detection used across the platform.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                    onClick={handleResetRisk}
                  >
                    Reset
                  </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* ACWR thresholds */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-black">ACWR Thresholds</h4>
                      <HelpTip term="ACWR" description="Acute:Chronic Workload Ratio — compares recent (7-day) training load to longer-term (28-day) average. Higher values indicate increased injury risk." />
                    </div>
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
                        ACWR above this triggers moderate risk (default: {DEFAULT_THRESHOLDS.acwrModerate})
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
                        ACWR above this triggers high risk (default: {DEFAULT_THRESHOLDS.acwrHigh})
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-black">
                        Load Spike Threshold (%)
                        <HelpTip term="Load Spike" description="A sudden week-over-week increase in training load. Spikes above this threshold may increase injury risk." side="right" />
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
                        Week-over-week load increase % that triggers a spike alert (default: {DEFAULT_THRESHOLDS.loadSpikePercent}%)
                      </p>
                    </div>
                  </div>

                  {/* Live preview */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-black">Live Preview</h4>
                    {/* Zone band */}
                    <div className="flex gap-0 rounded-full overflow-hidden h-3">
                      <div
                        className="bg-success/30 transition-all"
                        style={{ width: `${(acwrModerate / 2.5) * 100}%` }}
                      />
                      <div
                        className="bg-warning/40 transition-all"
                        style={{ width: `${((acwrHigh - acwrModerate) / 2.5) * 100}%` }}
                      />
                      <div
                        className="bg-danger/40 transition-all"
                        style={{ width: `${((2.5 - acwrHigh) / 2.5) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex text-[10px]">
                      <div style={{ width: `${(acwrModerate / 2.5) * 100}%` }} className="text-center text-success font-medium">
                        Low Risk
                      </div>
                      <div style={{ width: `${((acwrHigh - acwrModerate) / 2.5) * 100}%` }} className="text-center text-warning font-medium">
                        Moderate
                      </div>
                      <div style={{ width: `${((2.5 - acwrHigh) / 2.5) * 100}%` }} className="text-center text-danger font-medium">
                        High Risk
                      </div>
                    </div>
                    <div className="mt-1 flex text-[10px] text-gray-400">
                      <span>0</span>
                      <span className="ml-auto">{acwrModerate}</span>
                      <span className="ml-auto">{acwrHigh}</span>
                      <span className="ml-auto">2.5</span>
                    </div>

                    {/* Sample gauges */}
                    <div className="mt-4 flex items-end justify-center gap-4 flex-wrap">
                      {[0.8, 1.0, acwrModerate, (acwrModerate + acwrHigh) / 2, acwrHigh, 1.8].map((v) => (
                        <div key={v} className="flex flex-col items-center">
                          <AcwrGauge
                            value={v}
                            moderateThreshold={acwrModerate}
                            highThreshold={acwrHigh}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-center text-[10px] text-gray-400">
                      Sample ACWR values with your current thresholds
                    </p>

                    {/* Spike preview */}
                    <div className="mt-6 border-t border-border pt-4">
                      <h4 className="mb-3 text-sm font-semibold text-black">Spike Detection</h4>
                      <div className="flex items-end gap-1">
                        {(() => {
                          const baseLoad = 300;
                          const spikeLoad = Math.round(baseLoad * (1 + loadSpikePercent / 100));
                          const maxBar = Math.max(spikeLoad, 600);
                          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          const values = [280, 310, 290, 320, 300, baseLoad, spikeLoad];

                          return values.map((v, i) => {
                            const isSpike = i === values.length - 1;
                            const height = Math.max((v / maxBar) * 80, 4);
                            return (
                              <div key={days[i]} className="flex flex-col items-center flex-1">
                                <span className={cn('mb-1 text-[10px] font-medium', isSpike ? 'text-danger' : 'text-gray-500')}>
                                  {v}
                                </span>
                                <div
                                  className={cn(
                                    'w-full rounded-t transition-all',
                                    isSpike ? 'bg-danger/60' : 'bg-black/15'
                                  )}
                                  style={{ height: `${height}px` }}
                                />
                                <span className="mt-1 text-[10px] text-gray-400">{days[i]}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <p className="mt-2 text-center text-[10px] text-gray-400">
                        A {loadSpikePercent}% spike: 300 → {Math.round(300 * (1 + loadSpikePercent / 100))} triggers an alert
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSave} loading={saving}>
                    Save Settings
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">Notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure alert preferences and notification delivery.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={() => {
                    notifPrefs.resetAll();
                    addToast('Notification preferences reset to defaults', 'success');
                  }}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                {([
                  { key: 'highRiskAlerts' as keyof NotificationPrefs, label: 'High Risk Alerts', desc: 'Get notified when an athlete enters the high risk zone' },
                  { key: 'loadSpikeAlerts' as keyof NotificationPrefs, label: 'Load Spike Alerts', desc: 'Get notified when a training load spike is detected' },
                  { key: 'injuryUpdates' as keyof NotificationPrefs, label: 'Injury Updates', desc: 'Get notified when injury status changes' },
                  { key: 'weeklyDigest' as keyof NotificationPrefs, label: 'Weekly Digest', desc: 'Receive a weekly summary of athlete performance and risk data' },
                ]).map(({ key, label, desc }) => {
                  const enabled = notifPrefs[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => notifPrefs.toggle(key)}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-black">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <div className="relative shrink-0 ml-4">
                        <div className={cn(
                          'h-6 w-10 rounded-full transition-colors',
                          enabled ? 'bg-black' : 'bg-gray-200'
                        )} />
                        <div className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
                          enabled ? 'right-0.5' : 'left-0.5'
                        )} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 rounded-md bg-muted px-4 py-3 text-xs text-gray-500">
                In-app notifications are active. Email and push delivery will be available in a future update.
              </p>
            </Card>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black">Scheduled Reports</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure automated email reports sent to your coaching staff.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                    onClick={() => {
                      reportPrefs.resetAll();
                      addToast('Report preferences reset to defaults', 'success');
                    }}
                  >
                    Reset
                  </Button>
                </div>

                {/* Enable toggle */}
                <button
                  type="button"
                  onClick={() => reportPrefs.setEnabled(!reportPrefs.enabled)}
                  className="flex w-full items-center justify-between rounded-lg border border-border p-4 text-left hover:bg-muted/30 transition-colors mb-4"
                >
                  <div>
                    <p className="text-sm font-medium text-black">Enable Scheduled Reports</p>
                    <p className="text-xs text-gray-500">Automatically send digest emails on a recurring schedule</p>
                  </div>
                  <div className="relative shrink-0 ml-4">
                    <div className={cn(
                      'h-6 w-10 rounded-full transition-colors',
                      reportPrefs.enabled ? 'bg-black' : 'bg-gray-200'
                    )} />
                    <div className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
                      reportPrefs.enabled ? 'right-0.5' : 'left-0.5'
                    )} />
                  </div>
                </button>

                {reportPrefs.enabled && (
                  <div className="space-y-5">
                    {/* Frequency */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black">Frequency</label>
                      <div className="flex gap-2">
                        {(['daily', 'weekly', 'monthly'] as ReportFrequency[]).map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => reportPrefs.setFrequency(freq)}
                            className={cn(
                              'flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors',
                              reportPrefs.frequency === freq
                                ? 'border-black bg-black text-white'
                                : 'border-border bg-white text-gray-600 hover:bg-muted hover:text-black'
                            )}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recipients */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black">Recipients</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="coach@example.com"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newRecipient.includes('@')) {
                              e.preventDefault();
                              reportPrefs.addRecipient(newRecipient.trim());
                              setNewRecipient('');
                            }
                          }}
                          className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:border-black focus:outline-none"
                        />
                        <Button
                          variant="secondary"
                          icon={<Plus className="h-3.5 w-3.5" />}
                          onClick={() => {
                            if (newRecipient.includes('@')) {
                              reportPrefs.addRecipient(newRecipient.trim());
                              setNewRecipient('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {reportPrefs.recipients.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {reportPrefs.recipients.map((email) => (
                            <span
                              key={email}
                              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-black"
                            >
                              <Mail className="h-3 w-3 text-gray-400" />
                              {email}
                              <button
                                onClick={() => reportPrefs.removeRecipient(email)}
                                className="rounded-full p-0.5 text-gray-400 hover:text-danger transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {reportPrefs.recipients.length === 0 && (
                        <p className="mt-1 text-xs text-gray-400">Add at least one email address to receive reports.</p>
                      )}
                    </div>

                    {/* Report sections */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black">Report Sections</label>
                      <div className="space-y-2">
                        {ALL_SECTIONS.map((section) => {
                          const included = reportPrefs.sections.includes(section);
                          return (
                            <button
                              key={section}
                              type="button"
                              onClick={() => reportPrefs.toggleSection(section)}
                              className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                            >
                              <div className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                                included
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-300 bg-white'
                              )}>
                                {included && <Check className="h-3 w-3" />}
                              </div>
                              <span className={cn(
                                'text-sm',
                                included ? 'font-medium text-black' : 'text-gray-500'
                              )}>
                                {REPORT_SECTION_LABELS[section]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Report preview */}
              {reportPrefs.enabled && reportPrefs.sections.length > 0 && (
                <Card>
                  <h3 className="mb-3 text-sm font-semibold text-black">Report Preview</h3>
                  <div className="rounded-lg border border-border overflow-hidden">
                    {/* Email header */}
                    <div className="bg-black px-5 py-4">
                      <p className="text-lg font-bold text-white">DJP Athlete Performance</p>
                      <p className="text-xs text-white/60 capitalize">
                        {reportPrefs.frequency} Report — {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="divide-y divide-border p-5 space-y-0">
                      {reportPrefs.sections.includes('kpis') && (
                        <div className="py-3 first:pt-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Key Metrics</p>
                          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {['Active Athletes: 12', 'Active Injuries: 3', 'Avg Load: 345', 'Sessions: 28'].map((kpi) => (
                              <div key={kpi} className="rounded-md bg-muted px-3 py-2 text-center">
                                <p className="text-[11px] text-gray-500">{kpi.split(': ')[0]}</p>
                                <p className="text-lg font-bold text-black">{kpi.split(': ')[1]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {reportPrefs.sections.includes('riskAlerts') && (
                        <div className="py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Risk Alerts</p>
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="h-2 w-2 rounded-full bg-danger" />
                              <span className="text-black">J. Smith — ACWR 1.62, high risk</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="h-2 w-2 rounded-full bg-warning" />
                              <span className="text-black">A. Jones — ACWR 1.35, moderate risk</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {reportPrefs.sections.includes('injuries') && (
                        <div className="py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Injuries</p>
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-black">M. Wilson — Hamstring strain</span>
                              <span className="text-xs text-gray-400">12 days</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-black">K. Brown — Ankle sprain</span>
                              <span className="text-xs text-gray-400">5 days</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {reportPrefs.sections.includes('loadTrends') && (
                        <div className="py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Load Trends</p>
                          <div className="mt-2 flex items-end gap-1 h-10">
                            {[40, 55, 45, 60, 50, 70, 65].map((h, i) => (
                              <div key={i} className="flex-1 rounded-t bg-black/15" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400 text-center">7-day load distribution</p>
                        </div>
                      )}

                      {reportPrefs.sections.includes('topPerformers') && (
                        <div className="py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Top Performers</p>
                          <div className="mt-2 space-y-1.5">
                            {['R. Taylor — 3 new personal bests', 'L. Davis — Most consistent load'].map((perf) => (
                              <div key={perf} className="flex items-center gap-2 text-sm">
                                <span className="h-2 w-2 rounded-full bg-success" />
                                <span className="text-black">{perf}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border bg-muted/40 px-5 py-3">
                      <p className="text-[11px] text-gray-400 text-center">
                        This is a preview. Actual report data will be populated from your live platform.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <p className="rounded-md bg-muted px-4 py-3 text-xs text-gray-500">
                Email delivery requires backend integration. Report preferences are saved locally and will be synced when email service is configured.
              </p>
            </div>
          )}

          {activeTab === 'data' && (
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">Data Management</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your data, exports, and integrations.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="text-sm font-medium text-black">Data Source</h4>
                  <p className="mt-1 text-xs text-gray-500">Currently connected to Airtable + Supabase</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-xs text-success font-medium">Connected</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="text-sm font-medium text-black">Export All Data</h4>
                  <p className="mt-1 text-xs text-gray-500">Download a complete backup of all your data as CSV files.</p>
                  <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-gray-500">
                    Use the Export buttons on individual pages (Athletes, Load Monitoring, Testing, Injuries, Programs) to download data.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="text-sm font-medium text-black">Sync Status</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    Data syncs in real-time with Airtable. Changes are reflected immediately.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card>
                  <p className="text-xs font-medium text-gray-500">Total Users</p>
                  <p className="mt-1 text-2xl font-bold text-black">{users.length}</p>
                </Card>
                <Card>
                  <p className="text-xs font-medium text-gray-500">Admins</p>
                  <p className="mt-1 text-2xl font-bold text-black">
                    {users.filter((u) => u.role === 'admin').length}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs font-medium text-gray-500">Coaches</p>
                  <p className="mt-1 text-2xl font-bold text-black">
                    {users.filter((u) => u.role === 'coach').length}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs font-medium text-gray-500">Athletes</p>
                  <p className="mt-1 text-2xl font-bold text-black">
                    {users.filter((u) => u.role === 'athlete').length}
                  </p>
                </Card>
              </div>

              {/* User table */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black">Platform Users</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage user accounts and permissions.
                    </p>
                  </div>
                  <Button
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setShowCreateUser(true)}
                  >
                    Add User
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 font-medium text-gray-500">Name</th>
                        <th className="pb-3 font-medium text-gray-500">Email</th>
                        <th className="pb-3 font-medium text-gray-500">Role</th>
                        <th className="pb-3 font-medium text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((user) => {
                        const isSelf = user.id === currentUserId;
                        const roleBadgeVariant = user.role === 'admin' ? 'danger' : user.role === 'coach' ? 'warning' : 'default';
                        return (
                          <tr key={user.id} className="group">
                            <td className="py-3 font-medium text-black">
                              {user.name}
                              {isSelf && (
                                <span className="ml-2 text-xs text-gray-400">(you)</span>
                              )}
                            </td>
                            <td className="py-3 text-gray-600">{user.email}</td>
                            <td className="py-3">
                              <Badge variant={roleBadgeVariant}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingUser(user)}
                                  className="rounded-md p-1.5 text-gray-400 hover:bg-muted hover:text-black transition-colors"
                                  title="Edit user"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResetPasswordUser(user)}
                                  className="rounded-md p-1.5 text-gray-400 hover:bg-muted hover:text-black transition-colors"
                                  title="Reset password"
                                >
                                  <KeyRound className="h-4 w-4" />
                                </button>
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingUser(user)}
                                    className="rounded-md p-1.5 text-gray-400 hover:bg-danger/10 hover:text-danger transition-colors"
                                    title="Delete user"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Create User Modal */}
              <Modal
                isOpen={showCreateUser}
                onClose={() => setShowCreateUser(false)}
                title="Create User"
              >
                <UserForm
                  onSuccess={() => setShowCreateUser(false)}
                  currentUserId={currentUserId}
                />
              </Modal>

              {/* Edit User Modal */}
              <Modal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title="Edit User"
              >
                {editingUser && (
                  <UserForm
                    initialData={editingUser}
                    onSuccess={() => setEditingUser(null)}
                    currentUserId={currentUserId}
                  />
                )}
              </Modal>

              {/* Reset Password Modal */}
              <Modal
                isOpen={!!resetPasswordUser}
                onClose={() => setResetPasswordUser(null)}
                title="Reset Password"
              >
                {resetPasswordUser && (
                  <ResetPasswordForm
                    userId={resetPasswordUser.id}
                    userName={resetPasswordUser.name}
                    onSuccess={() => setResetPasswordUser(null)}
                  />
                )}
              </Modal>

              {/* Delete Confirmation Modal */}
              <ConfirmModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={handleDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone. The user will no longer be able to log in.`}
                confirmText="Delete User"
                loading={deleteLoading}
                variant="danger"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
