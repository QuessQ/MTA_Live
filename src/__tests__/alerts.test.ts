import { describe, it, expect } from 'vitest';
import { isAlertActive, compareSeverity } from '@/types/alerts';
import type { ServiceAlert } from '@/types/alerts';

function makeAlert(overrides: Partial<ServiceAlert> = {}): ServiceAlert {
  return {
    id: '1',
    title: 'Test Alert',
    body: 'Some details',
    severity: 'warning',
    category: 'delay',
    affectedRoutes: ['A', 'C'],
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('isAlertActive', () => {
  it('returns true for currently active alerts', () => {
    expect(isAlertActive(makeAlert())).toBe(true);
  });

  it('returns false for future alerts', () => {
    expect(
      isAlertActive(
        makeAlert({ startTime: new Date(Date.now() + 7200000).toISOString() })
      )
    ).toBe(false);
  });

  it('returns false for expired alerts', () => {
    expect(
      isAlertActive(
        makeAlert({
          startTime: new Date(Date.now() - 7200000).toISOString(),
          endTime: new Date(Date.now() - 3600000).toISOString(),
        })
      )
    ).toBe(false);
  });

  it('returns true for open-ended alerts (no end time)', () => {
    expect(isAlertActive(makeAlert({ endTime: null }))).toBe(true);
  });
});

describe('compareSeverity', () => {
  it('sorts emergency before info (higher severity first)', () => {
    expect(compareSeverity('emergency', 'info')).toBeLessThan(0);
  });

  it('returns 0 for equal severity', () => {
    expect(compareSeverity('warning', 'warning')).toBe(0);
  });
});
