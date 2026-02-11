import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, TABLES } from '@/lib/airtable';
import type { MetricCategory, MetricCategoryFormData, Metric, MetricFormData } from '@/types';

function mapCategory(record: { id: string; fields: Record<string, unknown> }): MetricCategory {
  return {
    id: record.id,
    sportId: Array.isArray(record.fields.Sport) ? record.fields.Sport[0] : (record.fields.Sport as string) || '',
    name: (record.fields.Name as string) || '',
    sortOrder: (record.fields.SortOrder as number) || 0,
  };
}

function mapMetric(record: { id: string; fields: Record<string, unknown> }): Metric {
  return {
    id: record.id,
    categoryId: Array.isArray(record.fields.Category) ? record.fields.Category[0] : (record.fields.Category as string) || '',
    sportId: Array.isArray(record.fields.Sport) ? record.fields.Sport[0] : (record.fields.Sport as string) || '',
    name: (record.fields.Name as string) || '',
    unit: (record.fields.Unit as string) || '',
    isDerived: (record.fields.IsDerived as boolean) || false,
    formula: (record.fields.Formula as string) || null,
    bestScoreMethod: ((record.fields.BestScoreMethod as string) || 'highest') as 'highest' | 'lowest',
    trialCount: (record.fields.TrialCount as number) || 3,
    createdAt: (record.fields.Created as string) || new Date().toISOString(),
  };
}

export async function getCategoriesBySport(sportId: string): Promise<MetricCategory[]> {
  const records = await getRecords(TABLES.METRIC_CATEGORIES, {
    filterByFormula: `FIND("${sportId}", ARRAYJOIN({Sport}))`,
    sort: [{ field: 'SortOrder', direction: 'asc' }],
  });
  return records.map(mapCategory);
}

export async function getCategoryById(id: string): Promise<MetricCategory | null> {
  const record = await getRecordById(TABLES.METRIC_CATEGORIES, id);
  if (!record) return null;
  return mapCategory(record);
}

export async function createCategory(data: MetricCategoryFormData): Promise<MetricCategory> {
  const record = await createRecord(TABLES.METRIC_CATEGORIES, {
    Sport: [data.sportId],
    Name: data.name,
    SortOrder: data.sortOrder,
  });
  return mapCategory(record);
}

export async function updateCategory(id: string, data: Partial<MetricCategoryFormData>): Promise<MetricCategory> {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields.Name = data.name;
  if (data.sortOrder !== undefined) fields.SortOrder = data.sortOrder;
  if (data.sportId !== undefined) fields.Sport = [data.sportId];

  const record = await updateRecord(TABLES.METRIC_CATEGORIES, id, fields);
  return mapCategory(record);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteRecord(TABLES.METRIC_CATEGORIES, id);
}

export async function getMetricsByCategory(categoryId: string): Promise<Metric[]> {
  const records = await getRecords(TABLES.METRICS, {
    filterByFormula: `FIND("${categoryId}", ARRAYJOIN({Category}))`,
    sort: [{ field: 'Name', direction: 'asc' }],
  });
  return records.map(mapMetric);
}

export async function getMetricsBySport(sportId: string): Promise<Metric[]> {
  const records = await getRecords(TABLES.METRICS, {
    filterByFormula: `FIND("${sportId}", ARRAYJOIN({Sport}))`,
    sort: [{ field: 'Name', direction: 'asc' }],
  });
  return records.map(mapMetric);
}

export async function createMetric(data: MetricFormData): Promise<Metric> {
  const record = await createRecord(TABLES.METRICS, {
    Category: [data.categoryId],
    Sport: [data.sportId],
    Name: data.name,
    Unit: data.unit,
    IsDerived: data.isDerived,
    Formula: data.formula || '',
    BestScoreMethod: data.bestScoreMethod,
    TrialCount: data.trialCount,
  });
  return mapMetric(record);
}

export async function updateMetric(id: string, data: Partial<MetricFormData>): Promise<Metric> {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields.Name = data.name;
  if (data.unit !== undefined) fields.Unit = data.unit;
  if (data.isDerived !== undefined) fields.IsDerived = data.isDerived;
  if (data.formula !== undefined) fields.Formula = data.formula;
  if (data.bestScoreMethod !== undefined) fields.BestScoreMethod = data.bestScoreMethod;
  if (data.trialCount !== undefined) fields.TrialCount = data.trialCount;
  if (data.categoryId !== undefined) fields.Category = [data.categoryId];
  if (data.sportId !== undefined) fields.Sport = [data.sportId];

  const record = await updateRecord(TABLES.METRICS, id, fields);
  return mapMetric(record);
}

export async function deleteMetric(id: string): Promise<void> {
  await deleteRecord(TABLES.METRICS, id);
}
