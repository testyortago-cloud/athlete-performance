import { describe, it, expect } from 'vitest';
import { generateCsvContent } from '@/lib/utils/csvExport';

describe('generateCsvContent', () => {
  it('generates basic CSV with headers and rows', () => {
    const headers = ['Name', 'Score', 'Date'];
    const rows = [
      ['Alice', 95, '2024-01-01'],
      ['Bob', 88, '2024-01-02'],
    ];

    const csv = generateCsvContent(headers, rows);
    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('Name,Score,Date');
    expect(lines[1]).toBe('Alice,95,2024-01-01');
    expect(lines[2]).toBe('Bob,88,2024-01-02');
  });

  it('escapes values containing commas', () => {
    const headers = ['Name', 'Description'];
    const rows = [['Alice', 'Fast, strong athlete']];

    const csv = generateCsvContent(headers, rows);
    expect(csv).toContain('"Fast, strong athlete"');
  });

  it('escapes values containing double quotes', () => {
    const headers = ['Name', 'Notes'];
    const rows = [['Alice', 'Called "The Flash"']];

    const csv = generateCsvContent(headers, rows);
    expect(csv).toContain('"Called ""The Flash"""');
  });

  it('escapes values containing newlines', () => {
    const headers = ['Name', 'Notes'];
    const rows = [['Alice', 'Line 1\nLine 2']];

    const csv = generateCsvContent(headers, rows);
    expect(csv).toContain('"Line 1\nLine 2"');
  });

  it('handles null and undefined values', () => {
    const headers = ['Name', 'Score'];
    const rows = [
      ['Alice', null],
      ['Bob', undefined],
    ];

    const csv = generateCsvContent(headers, rows);
    const lines = csv.split('\r\n');

    expect(lines[1]).toBe('Alice,');
    expect(lines[2]).toBe('Bob,');
  });

  it('handles empty rows', () => {
    const headers = ['Name', 'Score'];
    const rows: (string | number)[][] = [];

    const csv = generateCsvContent(headers, rows);
    expect(csv).toBe('Name,Score');
  });

  it('handles numeric values correctly', () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['ACWR', 1.35],
      ['Load', 450],
    ];

    const csv = generateCsvContent(headers, rows);
    const lines = csv.split('\r\n');

    expect(lines[1]).toBe('ACWR,1.35');
    expect(lines[2]).toBe('Load,450');
  });
});
