'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { loadMonitoringColumns } from './LoadMonitoringTableColumns';
import { DailyLoadForm } from './DailyLoadForm';
import { Plus } from 'lucide-react';
import type { DailyLoad, Athlete } from '@/types';

interface LoadMonitoringClientProps {
  loads: DailyLoad[];
  athletes: Athlete[];
}

export function LoadMonitoringClient({ loads, athletes }: LoadMonitoringClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Load Monitoring"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Add Entry
          </Button>
        }
      />

      <InteractiveTable
        columns={loadMonitoringColumns}
        data={loads}
        onRowClick={(load) => router.push(`/load-monitoring/${load.id}`)}
        searchPlaceholder="Search load entries..."
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Load Entry"
      >
        <DailyLoadForm
          athletes={athletes}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>
    </>
  );
}
