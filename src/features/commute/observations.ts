// Local observation log for commute inference (PRD §6.6, §8.3).
// We write one entry per app launch (and at most every 10 min during a
// session), keyed by hour-of-week and the rider's nearest station.
// Everything lives in IndexedDB via Dexie; nothing is transmitted.

import Dexie, { type Table } from "dexie";

export interface Observation {
  id?: number;
  stationId: string;
  hourOfWeek: number; // 0..167  (dayOfWeek * 24 + hour)
  at: number; // unix ms
}

class PulseDB extends Dexie {
  observations!: Table<Observation, number>;
  constructor() {
    super("pulse");
    this.version(1).stores({
      observations: "++id, stationId, hourOfWeek, at",
    });
  }
}

export const db = new PulseDB();

export function hourOfWeek(d: Date = new Date()): number {
  // JS Date.getDay: 0 = Sunday. We want Mon-first weeks so commutes make
  // sense: remap Sun(0)→6, Mon(1)→0, ..., Sat(6)→5.
  const js = d.getDay();
  const dow = (js + 6) % 7;
  return dow * 24 + d.getHours();
}

export function hourOfWeekLabel(h: number): string {
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][Math.floor(h / 24)];
  const hr = h % 24;
  const ampm = hr >= 12 ? "pm" : "am";
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${day} ${h12}${ampm}`;
}

const SESSION_MIN_GAP_MS = 10 * 60 * 1000;
let lastWriteAt = 0;

export async function observe(stationId: string): Promise<void> {
  const now = Date.now();
  if (now - lastWriteAt < SESSION_MIN_GAP_MS) return;
  lastWriteAt = now;
  await db.observations.add({
    stationId,
    hourOfWeek: hourOfWeek(new Date(now)),
    at: now,
  });
  // Cap at the most recent 1000 entries.
  const count = await db.observations.count();
  if (count > 1000) {
    const extra = count - 1000;
    const old = await db.observations.orderBy("at").limit(extra).toArray();
    await db.observations.bulkDelete(old.map((o) => o.id!).filter(Boolean));
  }
}

export async function readAll(): Promise<Observation[]> {
  return db.observations.orderBy("at").toArray();
}

export async function clearObservations(): Promise<void> {
  await db.observations.clear();
}
