import { describe, it, expect } from 'vitest';
import { distanceMeters } from '@/services/geolocation';

describe('distanceMeters', () => {
  it('returns 0 for identical coordinates', () => {
    const point = { latitude: 40.7128, longitude: -74.006 };
    expect(distanceMeters(point, point)).toBe(0);
  });

  it('calculates approximate distance between two NYC points', () => {
    const timesSquare = { latitude: 40.758, longitude: -73.9855 };
    const grandCentral = { latitude: 40.7527, longitude: -73.9772 };
    const distance = distanceMeters(timesSquare, grandCentral);
    expect(distance).toBeGreaterThan(700);
    expect(distance).toBeLessThan(1000);
  });
});
