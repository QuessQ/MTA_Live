import { describe, it, expect } from 'vitest';
import { findNearbyStations, SUBWAY_STATIONS } from '../stationData.js';

describe('findNearbyStations', () => {
  it('finds Times Square when searching near midtown', () => {
    const results = findNearbyStations(40.756, -73.987, 500);
    const names = results.map((s) => s.name);
    expect(names).toContain('Times Sq-42 St');
  });

  it('returns results sorted by distance', () => {
    const results = findNearbyStations(40.756, -73.987, 1000);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distance).toBeGreaterThanOrEqual(results[i - 1].distance);
    }
  });

  it('returns empty array for location far from any station', () => {
    const results = findNearbyStations(0, 0, 500);
    expect(results).toHaveLength(0);
  });

  it('respects radius parameter', () => {
    const small = findNearbyStations(40.756, -73.987, 100);
    const large = findNearbyStations(40.756, -73.987, 2000);
    expect(large.length).toBeGreaterThanOrEqual(small.length);
  });

  it('includes distance in results', () => {
    const results = findNearbyStations(40.756, -73.987, 500);
    for (const r of results) {
      expect(r.distance).toBeGreaterThanOrEqual(0);
      expect(r.distance).toBeLessThanOrEqual(500);
    }
  });

  it('station data has required fields', () => {
    for (const station of SUBWAY_STATIONS) {
      expect(station.id).toBeTruthy();
      expect(station.name).toBeTruthy();
      expect(station.latitude).toBeGreaterThan(40);
      expect(station.latitude).toBeLessThan(41);
      expect(station.longitude).toBeGreaterThan(-75);
      expect(station.longitude).toBeLessThan(-73);
      expect(station.routes.length).toBeGreaterThan(0);
    }
  });
});
