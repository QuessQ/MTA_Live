import { describe, it, expect } from 'vitest';
import { getDelayMinutes, getMinutesUntilArrival, isDelayed } from '@/types/transit';
import type { Arrival } from '@/types/transit';

function makeArrival(overrides: Partial<Arrival> = {}): Arrival {
  const now = new Date();
  return {
    id: '1',
    stopId: 'stop-1',
    routeId: 'A',
    routeName: 'A',
    direction: 'Uptown',
    expectedArrival: new Date(now.getTime() + 5 * 60000).toISOString(),
    scheduledArrival: new Date(now.getTime() + 5 * 60000).toISOString(),
    isRealTime: true,
    ...overrides,
  };
}

describe('getDelayMinutes', () => {
  it('returns 0 for on-time arrivals', () => {
    const arrival = makeArrival();
    expect(getDelayMinutes(arrival)).toBe(0);
  });

  it('returns positive minutes for delayed arrivals', () => {
    const now = new Date();
    const arrival = makeArrival({
      scheduledArrival: new Date(now.getTime() + 5 * 60000).toISOString(),
      expectedArrival: new Date(now.getTime() + 8 * 60000).toISOString(),
    });
    expect(getDelayMinutes(arrival)).toBe(3);
  });
});

describe('getMinutesUntilArrival', () => {
  it('returns minutes until expected arrival', () => {
    const arrival = makeArrival({
      expectedArrival: new Date(Date.now() + 10 * 60000).toISOString(),
    });
    expect(getMinutesUntilArrival(arrival)).toBeGreaterThanOrEqual(9);
    expect(getMinutesUntilArrival(arrival)).toBeLessThanOrEqual(10);
  });

  it('returns 0 for past arrivals', () => {
    const arrival = makeArrival({
      expectedArrival: new Date(Date.now() - 60000).toISOString(),
    });
    expect(getMinutesUntilArrival(arrival)).toBe(0);
  });
});

describe('isDelayed', () => {
  it('returns false for on-time arrivals', () => {
    expect(isDelayed(makeArrival())).toBe(false);
  });

  it('returns true when delay exceeds 1 minute', () => {
    const now = new Date();
    const arrival = makeArrival({
      scheduledArrival: now.toISOString(),
      expectedArrival: new Date(now.getTime() + 3 * 60000).toISOString(),
    });
    expect(isDelayed(arrival)).toBe(true);
  });
});
