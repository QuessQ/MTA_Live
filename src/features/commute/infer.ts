// Commute inference — PRD §6.6 spec, pragmatic implementation.
//
// Full DBSCAN over (lat, lng, hour-of-day) is overkill for the signal we
// have. We key observations by (day-band, hour-band, nearestStation) and
// count occurrences. A pattern is "real" if the same station appears in
// the same band >= MIN_CONFIRMATIONS times on distinct calendar days.
//
// Two bands on weekdays:
//   - morning: 6-10am  → "home"  (where you start the day)
//   - evening: 5-9pm   → "work"  (where you start the trip home)
// and their mirrors are inferred.

import type { Observation } from "./observations";

const MIN_CONFIRMATIONS = 3;

export interface InferredCommute {
  stationId: string;
  band: "morning" | "evening";
  confirmations: number;
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function bandOf(h: number): "morning" | "evening" | null {
  const dow = Math.floor(h / 24);
  if (dow >= 5) return null; // weekend — ignore for now
  const hr = h % 24;
  if (hr >= 6 && hr <= 10) return "morning";
  if (hr >= 17 && hr <= 21) return "evening";
  return null;
}

export function inferCommutes(obs: Observation[]): InferredCommute[] {
  // key: `${band}|${stationId}` → set of calendar days it was observed
  const bucket = new Map<string, Set<string>>();
  for (const o of obs) {
    const band = bandOf(o.hourOfWeek);
    if (!band) continue;
    const key = `${band}|${o.stationId}`;
    const day = dayKey(o.at);
    const s = bucket.get(key) ?? new Set<string>();
    s.add(day);
    bucket.set(key, s);
  }

  const out: InferredCommute[] = [];
  for (const [key, days] of bucket) {
    if (days.size < MIN_CONFIRMATIONS) continue;
    const [band, stationId] = key.split("|") as ["morning" | "evening", string];
    out.push({ band, stationId, confirmations: days.size });
  }
  // Sort strongest first.
  out.sort((a, b) => b.confirmations - a.confirmations);
  return out;
}

// After the rider has confirmed both a morning and evening station, pair
// them as a (home, work) commute.
export interface Commute {
  home: string;
  work: string;
}

export function pairToCommute(
  home?: string,
  work?: string
): Commute | null {
  if (home && work && home !== work) return { home, work };
  return null;
}
