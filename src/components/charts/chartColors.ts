export const CHART_BLACK = '#000000';
export const CHART_GRAY = '#999999';
export const CHART_LIGHT = '#CCCCCC';
export const CHART_GRID = '#E0E0E0';

export const CHART_SUCCESS = '#16a34a';
export const CHART_WARNING = '#d97706';
export const CHART_DANGER = '#dc2626';

const PALETTE = [
  CHART_BLACK,
  CHART_GRAY,
  CHART_LIGHT,
  '#555555',
  '#777777',
  '#AAAAAA',
];

export function getChartColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
