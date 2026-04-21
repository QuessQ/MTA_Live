// Dijkstra over the station graph. Edge weight: travel time + transfer
// penalty when switching lines. Not as principled as RAPTOR — it can't
// reason about transfer timing vs. frequency — but it returns a correct
// shortest-time itinerary for the embedded station set and is instant.

import { getGraph, type Edge } from "./graph";
import { STATION_BY_ID } from "@/data/stations";
import type { SubwayLine } from "@/data/lines";

const TRAIN_MPS = 12.5; // rough average NYC subway speed incl. dwell
const TRANSFER_SEC = 180;

export interface RouteLeg {
  line: SubwayLine;
  from: string;
  to: string;
  seconds: number;
  stops: string[]; // station ids traversed, inclusive
}

export interface Route {
  legs: RouteLeg[];
  totalSeconds: number;
  transfers: number;
}

interface Visit {
  stationId: string;
  line: SubwayLine | null; // line we arrived on (null for origin)
  cost: number;
  prev: Visit | null;
  edge: Edge | null;
}

export function planRoute(fromId: string, toId: string): Route | null {
  if (fromId === toId) return null;
  const graph = getGraph();
  if (!graph.has(fromId) || !graph.has(toId)) return null;

  // (stationId|line) -> best cost so far.
  const best = new Map<string, number>();
  const pq: Visit[] = [
    { stationId: fromId, line: null, cost: 0, prev: null, edge: null },
  ];
  const key = (v: Visit) => `${v.stationId}|${v.line ?? ""}`;
  best.set(key(pq[0]), 0);

  let found: Visit | null = null;
  while (pq.length) {
    pq.sort((a, b) => a.cost - b.cost);
    const cur = pq.shift()!;
    if (cur.stationId === toId) {
      found = cur;
      break;
    }
    if ((best.get(key(cur)) ?? Infinity) < cur.cost) continue;
    for (const edge of graph.get(cur.stationId) ?? []) {
      const ride = edge.meters / TRAIN_MPS;
      const transfer = cur.line && cur.line !== edge.line ? TRANSFER_SEC : 0;
      const next: Visit = {
        stationId: edge.to,
        line: edge.line,
        cost: cur.cost + ride + transfer,
        prev: cur,
        edge,
      };
      const k = key(next);
      if (next.cost < (best.get(k) ?? Infinity)) {
        best.set(k, next.cost);
        pq.push(next);
      }
    }
  }

  if (!found) return null;

  // Walk back the visit chain, collapsing consecutive hops on the same line
  // into a single leg.
  const hops: { stationId: string; line: SubwayLine }[] = [];
  let v: Visit | null = found;
  while (v && v.edge) {
    hops.unshift({ stationId: v.stationId, line: v.edge.line });
    v = v.prev;
  }
  // The origin:
  const origin: { stationId: string; line: SubwayLine } | null = v
    ? { stationId: v.stationId, line: hops[0]?.line ?? ("?" as SubwayLine) }
    : null;
  if (!origin) return null;

  const legs: RouteLeg[] = [];
  let currentLine: SubwayLine | null = null;
  let legStart: string = origin.stationId;
  let legStops: string[] = [origin.stationId];
  let legSeconds = 0;

  for (let i = 0; i < hops.length; i++) {
    const h = hops[i];
    if (currentLine === null) currentLine = h.line;
    if (h.line !== currentLine) {
      legs.push({
        line: currentLine,
        from: legStart,
        to: legStops[legStops.length - 1],
        seconds: legSeconds,
        stops: legStops,
      });
      legStart = legStops[legStops.length - 1];
      legStops = [legStart];
      legSeconds = TRANSFER_SEC;
      currentLine = h.line;
    }
    const prevId = legStops[legStops.length - 1];
    const prev = STATION_BY_ID.get(prevId);
    const cur = STATION_BY_ID.get(h.stationId);
    if (prev && cur) {
      legSeconds += hopSeconds(prev, cur);
    }
    legStops.push(h.stationId);
  }
  if (currentLine !== null) {
    legs.push({
      line: currentLine,
      from: legStart,
      to: legStops[legStops.length - 1],
      seconds: legSeconds,
      stops: legStops,
    });
  }

  const totalSeconds = legs.reduce((s, l) => s + l.seconds, 0);
  return {
    legs,
    totalSeconds,
    transfers: Math.max(0, legs.length - 1),
  };
}

function hopSeconds(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dx = (a.lat - b.lat) * 111_000;
  const dy = (a.lng - b.lng) * 85_000;
  return Math.hypot(dx, dy) / TRAIN_MPS;
}
