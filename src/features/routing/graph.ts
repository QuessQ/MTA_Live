// Simple transit graph over the embedded station set. For v0 this is a
// nearest-neighbor connectivity graph per line — each station on a line
// is connected to the two closest stations on the same line. It's coarse
// compared to real GTFS ordering but sufficient for the curated ~50-station
// set we ship. Swap for RAPTOR over full static GTFS in a later pass.

import { STATIONS, type Station } from "@/data/stations";
import type { SubwayLine } from "@/data/lines";
import { distanceMeters } from "@/lib/geo";

export interface Edge {
  to: string; // station id
  line: SubwayLine;
  meters: number;
}

export type Graph = Map<string, Edge[]>;

let cached: Graph | null = null;

export function getGraph(): Graph {
  if (cached) return cached;
  const graph: Graph = new Map();
  for (const s of STATIONS) graph.set(s.id, []);

  // Group stations by line.
  const byLine = new Map<SubwayLine, Station[]>();
  for (const s of STATIONS) {
    for (const line of s.lines) {
      const arr = byLine.get(line) ?? [];
      arr.push(s);
      byLine.set(line, arr);
    }
  }

  // For each line, connect each station to its 2 nearest line-mates.
  for (const [line, stations] of byLine) {
    for (const s of stations) {
      const neighbors = stations
        .filter((o) => o.id !== s.id)
        .map((o) => ({ o, d: distanceMeters(s, o) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const { o, d } of neighbors) {
        graph.get(s.id)!.push({ to: o.id, line, meters: d });
      }
    }
  }

  cached = graph;
  return graph;
}
