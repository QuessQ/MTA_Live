import { describe, it, expect } from 'vitest';
import { sortRouteOptions } from '@/types/routes';
import type { RouteOption } from '@/types/routes';

function makeOption(overrides: Partial<RouteOption> = {}): RouteOption {
  return {
    id: '1',
    legs: [],
    totalDurationMinutes: 30,
    totalWalkingMinutes: 5,
    transferCount: 1,
    hasActiveAlerts: false,
    reliability: 'high',
    ...overrides,
  };
}

describe('sortRouteOptions', () => {
  const options: RouteOption[] = [
    makeOption({ id: 'a', totalDurationMinutes: 45, transferCount: 0, totalWalkingMinutes: 15 }),
    makeOption({ id: 'b', totalDurationMinutes: 25, transferCount: 2, totalWalkingMinutes: 5 }),
    makeOption({ id: 'c', totalDurationMinutes: 35, transferCount: 1, totalWalkingMinutes: 8 }),
  ];

  it('sorts by fastest', () => {
    const sorted = sortRouteOptions(options, 'fastest');
    expect(sorted.map((o) => o.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by fewest transfers', () => {
    const sorted = sortRouteOptions(options, 'fewestTransfers');
    expect(sorted.map((o) => o.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by least walking', () => {
    const sorted = sortRouteOptions(options, 'leastWalking');
    expect(sorted.map((o) => o.id)).toEqual(['b', 'c', 'a']);
  });
});
