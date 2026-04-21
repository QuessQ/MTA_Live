// GTFS-RT feed client. Fetches the protobuf feed via the relay, decodes
// trip updates, and produces per-station arrival lists.

import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { SUBWAY_FEEDS, feedUrl, type SubwayFeed } from "./feeds";
import { STATION_BY_GTFS } from "../stations";
import type { SubwayLine } from "../lines";

export interface Arrival {
  stationId: string; // our internal station id
  line: SubwayLine;
  tripId: string;
  direction: "N" | "S";
  etaSec: number; // seconds until arrival (may be negative for recently-departed)
  etaAt: number; // absolute unix ms
  headsign?: string;
}

const { transit_realtime } = GtfsRealtimeBindings;

// Fetch one feed and return decoded arrivals for stations we know about.
async function fetchFeed(feed: SubwayFeed, signal?: AbortSignal): Promise<Arrival[]> {
  const res = await fetch(feedUrl(feed), { signal });
  if (!res.ok) throw new Error(`${feed.id}: HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const message = transit_realtime.FeedMessage.decode(buf);

  const now = Date.now();
  const out: Arrival[] = [];

  for (const entity of message.entity) {
    const tu = entity.tripUpdate;
    if (!tu || !tu.trip) continue;
    const routeId = tu.trip.routeId as SubwayLine | undefined;
    if (!routeId) continue;

    for (const stu of tu.stopTimeUpdate ?? []) {
      const stopId = stu.stopId;
      if (!stopId) continue;
      // Child stops are "<parent><N|S>" — the trailing char is the direction.
      const dir = stopId.slice(-1);
      if (dir !== "N" && dir !== "S") continue;
      const parent = stopId.slice(0, -1);
      const station = STATION_BY_GTFS.get(parent);
      if (!station) continue;

      // Prefer arrival time; fall back to departure.
      const t =
        (stu.arrival?.time ?? stu.departure?.time) as number | Long | null | undefined;
      if (t == null) continue;
      const ms = Number(t) * 1000;
      const etaSec = Math.round((ms - now) / 1000);
      // Drop arrivals > 60 min out or > 2 min in the past.
      if (etaSec > 3600 || etaSec < -120) continue;

      out.push({
        stationId: station.id,
        line: routeId,
        tripId: tu.trip.tripId ?? "",
        direction: dir,
        etaSec,
        etaAt: ms,
        headsign: tu.trip.tripId?.split("..")[1] ?? undefined,
      });
    }
  }

  return out;
}

type Long = { toNumber(): number };

export interface FeedSnapshot {
  arrivals: Arrival[];
  fetchedAt: number;
  errors: string[];
}

export async function fetchAllFeeds(signal?: AbortSignal): Promise<FeedSnapshot> {
  const fetchedAt = Date.now();
  const errors: string[] = [];
  const results = await Promise.allSettled(
    SUBWAY_FEEDS.map((f) => fetchFeed(f, signal))
  );
  const arrivals: Arrival[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") arrivals.push(...r.value);
    else errors.push(`${SUBWAY_FEEDS[i].id}: ${String(r.reason)}`);
  });
  // Earliest-first per station + direction.
  arrivals.sort((a, b) => a.etaAt - b.etaAt);
  return { arrivals, fetchedAt, errors };
}
