'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { SportForm } from '../SportForm';
import { MetricCategorySection } from './MetricCategorySection';
import { MetricCategoryForm } from './MetricCategoryForm';
import { deleteSportAction } from '../actions';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { Sport, MetricCategory, Metric } from '@/types';

interface SportDetailClientProps {
  sport: Sport;
  categories: MetricCategory[];
  metrics: Metric[];
}

export function SportDetailClient({ sport, categories, metrics }: SportDetailClientProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteSportAction(sport.id);
    if (result.success) {
      router.push('/sports');
      router.refresh();
    }
    setDeleting(false);
  }

  // Group metrics by category
  const metricsByCategory = new Map<string, Metric[]>();
  for (const metric of metrics) {
    const existing = metricsByCategory.get(metric.categoryId) || [];
    existing.push(metric);
    metricsByCategory.set(metric.categoryId, existing);
  }

  return (
    <>
      <PageHeader
        title={sport.name}
        breadcrumbs={[
          { label: 'Sports', href: '/sports' },
          { label: sport.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      {sport.description && (
        <Card className="mb-6">
          <p className="text-sm text-gray-700">{sport.description}</p>
        </Card>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">Metric Categories</h2>
        <Button
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCategoryModal(true)}
        >
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-gray-500 py-8">
            No metric categories yet. Add one to start defining metrics.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((category) => (
              <MetricCategorySection
                key={category.id}
                category={category}
                metrics={metricsByCategory.get(category.id) || []}
                sportId={sport.id}
              />
            ))}
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Sport">
        <SportForm sport={sport} onSuccess={() => setShowEditModal(false)} />
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Sport"
        message={`Are you sure you want to delete ${sport.name}? All associated categories and metrics will also be removed.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add Metric Category"
      >
        <MetricCategoryForm
          sportId={sport.id}
          nextSortOrder={categories.length}
          onSuccess={() => setShowCategoryModal(false)}
        />
      </Modal>
    </>
  );
}
