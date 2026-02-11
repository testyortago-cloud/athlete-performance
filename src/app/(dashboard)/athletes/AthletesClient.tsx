'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { athleteColumns } from './AthleteTableColumns';
import { AthleteForm } from './AthleteForm';
import { Plus } from 'lucide-react';
import type { Athlete, Sport, TrainingProgram } from '@/types';

interface AthletesClientProps {
  athletes: Athlete[];
  sports: Sport[];
  programs: TrainingProgram[];
}

export function AthletesClient({ athletes, sports, programs }: AthletesClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Athletes"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Add Athlete
          </Button>
        }
      />

      <InteractiveTable
        columns={athleteColumns}
        data={athletes}
        onRowClick={(athlete) => router.push(`/athletes/${athlete.id}`)}
        searchPlaceholder="Search athletes..."
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Athlete"
      >
        <AthleteForm
          sports={sports}
          programs={programs}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>
    </>
  );
}
