// MTA GTFS-Realtime feed catalog. Endpoints are public (no key required).
// We front them through a Cloudflare Worker in prod (workers/mta-relay) or
// Vite's dev-server proxy locally.
//
// Upstream format reference: https://api.mta.info/#/subwayRealTimeFeeds

import type { SubwayLine } from "../lines";

export interface SubwayFeed {
  id: string;
  path: string; // relative path under the relay
  lines: SubwayLine[];
}

// Each feed file covers a set of lines. The GTFS-RT trip updates within a
// feed contain stop_id values scoped to the lines those trains run on.
export const SUBWAY_FEEDS: SubwayFeed[] = [
  { id: "ace", path: "nyct%2Fgtfs-ace", lines: ["A", "C", "E"] },
  { id: "bdfm", path: "nyct%2Fgtfs-bdfm", lines: ["B", "D", "F", "M"] },
  { id: "g", path: "nyct%2Fgtfs-g", lines: ["G"] },
  { id: "jz", path: "nyct%2Fgtfs-jz", lines: ["J", "Z"] },
  { id: "nqrw", path: "nyct%2Fgtfs-nqrw", lines: ["N", "Q", "R", "W"] },
  { id: "l", path: "nyct%2Fgtfs-l", lines: ["L"] },
  { id: "1234567", path: "nyct%2Fgtfs", lines: ["1", "2", "3", "4", "5", "6", "7", "S"] },
  { id: "si", path: "nyct%2Fgtfs-si", lines: ["SIR"] },
];

export function relayBase(): string {
  // In dev, we proxy through Vite: /mta/<feed-path>
  // In prod, point VITE_MTA_RELAY_URL at your Worker.
  return import.meta.env.VITE_MTA_RELAY_URL ?? "/mta";
}

export function feedUrl(feed: SubwayFeed): string {
  const base = relayBase().replace(/\/$/, "");
  return `${base}/${feed.path}`;
}
