import { describe, it, expect } from 'vitest';
import { MTA_SUBWAY_FEEDS, FEED_FOR_LINE, MTA_ALERTS } from '../feedConfig.js';

describe('feedConfig', () => {
  it('maps all common subway lines to a feed', () => {
    const lines = ['1', '2', '3', '4', '5', '6', '7', 'A', 'C', 'E', 'B', 'D', 'F', 'M', 'G', 'J', 'Z', 'L', 'N', 'Q', 'R', 'W', 'S'];
    for (const line of lines) {
      expect(FEED_FOR_LINE[line]).toBeTruthy();
      expect(MTA_SUBWAY_FEEDS[FEED_FOR_LINE[line]]).toBeTruthy();
    }
  });

  it('all feed URLs point to mta.info', () => {
    for (const url of Object.values(MTA_SUBWAY_FEEDS)) {
      expect(url).toContain('api-endpoint.mta.info');
    }
  });

  it('alert feed URLs exist', () => {
    expect(MTA_ALERTS.all).toBeTruthy();
    expect(MTA_ALERTS.subway).toBeTruthy();
    expect(MTA_ALERTS.bus).toBeTruthy();
  });
});
