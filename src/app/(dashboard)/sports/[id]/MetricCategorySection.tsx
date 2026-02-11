'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { MetricCategoryForm } from './MetricCategoryForm';
import { MetricForm } from './MetricForm';
import { deleteCategoryAction, deleteMetricAction } from './actions';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import type { MetricCategory, Metric } from '@/types';

interface MetricCategorySectionProps {
  category: MetricCategory;
  metrics: Metric[];
  sportId: string;
}

export function MetricCategorySection({ category, metrics, sportId }: MetricCategorySectionProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [deletingMetric, setDeletingMetric] = useState<Metric | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDeleteCategory() {
    setDeleteLoading(true);
    const result = await deleteCategoryAction(category.id, sportId);
    if (result.success) router.refresh();
    setDeleteLoading(false);
    setShowDeleteCategory(false);
  }

  async function handleDeleteMetric() {
    if (!deletingMetric) return;
    setDeleteLoading(true);
    const result = await deleteMetricAction(deletingMetric.id, sportId);
    if (result.success) router.refresh();
    setDeleteLoading(false);
    setDeletingMetric(null);
  }

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-black hover:text-gray-700"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {category.name}
          <Badge variant="outline">{metrics.length} metrics</Badge>
        </button>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAddMetric(true)}>
            Metric
          </Button>
          <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setShowEditCategory(true)} />
          <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5 text-danger" />} onClick={() => setShowDeleteCategory(true)} />
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-border">
          {metrics.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              No metrics in this category yet.
            </p>
          ) : (
            metrics.map((metric) => (
              <div key={metric.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black">{metric.name}</span>
                    {metric.isDerived && <Badge variant="outline">Derived</Badge>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                    <span>Unit: {metric.unit}</span>
                    <span>Trials: {metric.trialCount}</span>
                    <span>Best: {metric.bestScoreMethod}</span>
                    {metric.isDerived && metric.formula && (
                      <span>Formula: {metric.formula}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditingMetric(metric)} />
                  <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5 text-danger" />} onClick={() => setDeletingMetric(metric)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={showEditCategory} onClose={() => setShowEditCategory(false)} title="Edit Category">
        <MetricCategoryForm
          sportId={sportId}
          category={category}
          onSuccess={() => setShowEditCategory(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={showDeleteCategory}
        onClose={() => setShowDeleteCategory(false)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Delete "${category.name}" and all its metrics? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />

      <Modal isOpen={showAddMetric} onClose={() => setShowAddMetric(false)} title="Add Metric">
        <MetricForm
          sportId={sportId}
          categoryId={category.id}
          onSuccess={() => setShowAddMetric(false)}
        />
      </Modal>

      <Modal isOpen={!!editingMetric} onClose={() => setEditingMetric(null)} title="Edit Metric">
        {editingMetric && (
          <MetricForm
            sportId={sportId}
            categoryId={category.id}
            metric={editingMetric}
            onSuccess={() => setEditingMetric(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deletingMetric}
        onClose={() => setDeletingMetric(null)}
        onConfirm={handleDeleteMetric}
        title="Delete Metric"
        message={`Delete "${deletingMetric?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </Card>
  );
}
