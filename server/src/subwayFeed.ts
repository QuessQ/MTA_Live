import { MTA_SUBWAY_FEEDS, FEED_FOR_LINE } from './feedConfig.js';
import { decodeFeedMessage, type GtfsrtStopTimeUpdate } from './gtfsrt.js';

export interface SubwayArrival {
  id: string;
  stopId: string;
  routeId: string;
  routeName: string;
  direction: string;
  expectedArrival: string;
  scheduledArrival: string;
  isRealTime: boolean;
}

const feedCache = new Map<string, { data: ArrayBuffer; fetchedAt: number }>();
const CACHE_TTL_MS = 15_000;

async function fetchFeed(feedKey: string): Promise<ArrayBuffer> {
  const cached = feedCache.get(feedKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = MTA_SUBWAY_FEEDS[feedKey];
  if (!url) throw new Error(`Unknown feed: ${feedKey}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`MTA feed ${feedKey}: ${res.status}`);
  const data = await res.arrayBuffer();
  feedCache.set(feedKey, { data, fetchedAt: Date.now() });
  return data;
}

function directionLabel(stopId: string): string {
  // MTA stop IDs end with N (northbound) or S (southbound)
  if (stopId.endsWith('N')) return 'Uptown & The Bronx';
  if (stopId.endsWith('S')) return 'Downtown & Brooklyn';
  return '';
}

export async function getSubwayArrivals(stopId: string): Promise<SubwayArrival[]> {
  // Fetch all feeds since a station can serve multiple line groups
  const feedKeys = new Set<string>();
  for (const key of Object.keys(MTA_SUBWAY_FEEDS)) {
    feedKeys.add(key);
  }

  const now = Date.now();
  const arrivals: SubwayArrival[] = [];

  const feedPromises = Array.from(feedKeys).map(async (feedKey) => {
    try {
      const buf = await fetchFeed(feedKey);
      const msg = decodeFeedMessage(buf);

      for (const entity of msg.entity) {
        if (!entity.tripUpdate) continue;
        const { trip, stopTimeUpdate } = entity.tripUpdate;

        for (const stu of stopTimeUpdate) {
          // Match stop ID base (without direction suffix)
          const stuBase = stu.stopId.replace(/[NS]$/, '');
          const queryBase = stopId.replace(/[NS]$/, '');
          if (stuBase !== queryBase) continue;

          const arrivalTime = getArrivalTime(stu);
          if (!arrivalTime || arrivalTime * 1000 < now) continue;

          arrivals.push({
            id: `${entity.id}-${stu.stopId}`,
            stopId: stu.stopId,
            routeId: trip.routeId,
            routeName: trip.routeId,
            direction: directionLabel(stu.stopId),
            expectedArrival: new Date(arrivalTime * 1000).toISOString(),
            scheduledArrival: new Date(arrivalTime * 1000).toISOString(),
            isRealTime: true,
          });
        }
      }
    } catch {
      // Skip feeds that fail — partial data is better than none
    }
  });

  await Promise.all(feedPromises);

  arrivals.sort(
    (a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime()
  );

  return arrivals;
}

export async function getSubwayArrivalsForLine(
  stopId: string,
  lineId: string
): Promise<SubwayArrival[]> {
  const feedKey = FEED_FOR_LINE[lineId.toUpperCase()];
  if (!feedKey) return [];

  const buf = await fetchFeed(feedKey);
  const msg = decodeFeedMessage(buf);
  const now = Date.now();
  const arrivals: SubwayArrival[] = [];

  for (const entity of msg.entity) {
    if (!entity.tripUpdate) continue;
    const { trip, stopTimeUpdate } = entity.tripUpdate;
    if (trip.routeId !== lineId) continue;

    for (const stu of stopTimeUpdate) {
      const stuBase = stu.stopId.replace(/[NS]$/, '');
      const queryBase = stopId.replace(/[NS]$/, '');
      if (stuBase !== queryBase) continue;

      const arrivalTime = getArrivalTime(stu);
      if (!arrivalTime || arrivalTime * 1000 < now) continue;

      arrivals.push({
        id: `${entity.id}-${stu.stopId}`,
        stopId: stu.stopId,
        routeId: trip.routeId,
        routeName: trip.routeId,
        direction: directionLabel(stu.stopId),
        expectedArrival: new Date(arrivalTime * 1000).toISOString(),
        scheduledArrival: new Date(arrivalTime * 1000).toISOString(),
        isRealTime: true,
      });
    }
  }

  arrivals.sort(
    (a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime()
  );

  return arrivals;
}

function getArrivalTime(stu: GtfsrtStopTimeUpdate): number | null {
  return stu.arrival?.time || stu.departure?.time || null;
}
