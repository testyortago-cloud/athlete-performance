'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { injuryColumns } from './InjuryTableColumns';
import { InjuryForm } from './InjuryForm';
import { Plus } from 'lucide-react';
import type { Injury, Athlete } from '@/types';

interface InjuriesClientProps {
  injuries: Injury[];
  athletes: Athlete[];
}

export function InjuriesClient({ injuries, athletes }: InjuriesClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Injuries"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Log Injury
          </Button>
        }
      />

      <InteractiveTable
        columns={injuryColumns}
        data={injuries}
        onRowClick={(injury) => router.push(`/injuries/${injury.id}`)}
        searchPlaceholder="Search injuries..."
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Log Injury"
        size="lg"
      >
        <InjuryForm
          athletes={athletes}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>
    </>
  );
}
