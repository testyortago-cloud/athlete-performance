import { describe, it, expect } from 'vitest';
import {
  CHART_BLACK,
  CHART_GRAY,
  CHART_LIGHT,
  CHART_GRID,
  CHART_SUCCESS,
  CHART_WARNING,
  CHART_DANGER,
  getChartColor,
} from '@/components/charts/chartColors';

describe('chartColors', () => {
  it('exports color constants', () => {
    expect(CHART_BLACK).toBe('#000000');
    expect(CHART_GRAY).toBe('#999999');
    expect(CHART_LIGHT).toBe('#CCCCCC');
    expect(CHART_GRID).toBe('#E0E0E0');
  });

  it('exports semantic colors', () => {
    expect(CHART_SUCCESS).toBe('#16a34a');
    expect(CHART_WARNING).toBe('#d97706');
    expect(CHART_DANGER).toBe('#dc2626');
  });
});

describe('getChartColor', () => {
  it('returns the first color for index 0', () => {
    expect(getChartColor(0)).toBe(CHART_BLACK);
  });

  it('returns the second color for index 1', () => {
    expect(getChartColor(1)).toBe(CHART_GRAY);
  });

  it('wraps around for indices beyond palette length', () => {
    const color0 = getChartColor(0);
    const color6 = getChartColor(6);
    expect(color6).toBe(color0);
  });

  it('returns consistent colors for the same index', () => {
    expect(getChartColor(3)).toBe(getChartColor(3));
  });

  it('returns a string for any index', () => {
    for (let i = 0; i < 20; i++) {
      expect(typeof getChartColor(i)).toBe('string');
      expect(getChartColor(i)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
