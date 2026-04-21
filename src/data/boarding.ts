// Boarding intelligence — curated best-car-per-station-pair reference.
// The MTA does not publish this; community projects (Exit Strategy, etc.)
// have historically collected it by hand. We ship only high-confidence
// entries here so we never fabricate guidance (PRD §10.8). Additions
// welcome via PR — format is intentionally boring and diff-friendly.
//
// carsFromFront: 1 = front car, 10/11 = back of a 10- or 11-car train.
// Where a pair has a "best-exit" hint that isn't just car-based, we add a
// freeform note.

export interface BoardingHint {
  fromStationId: string;
  toStationId: string;
  direction: "N" | "S";
  carsFromFront: number;
  note?: string;
  confidence: "high" | "medium";
}

export const BOARDING_HINTS: BoardingHint[] = [
  // 42 St shuttle between Times Sq and Grand Central — front car for the
  // easier Grand Central exit.
  {
    fromStationId: "times-sq-42",
    toStationId: "grand-central-42",
    direction: "S",
    carsFromFront: 1,
    note: "Front of train — exits near 4/5/6 transfer",
    confidence: "high",
  },
  {
    fromStationId: "grand-central-42",
    toStationId: "times-sq-42",
    direction: "N",
    carsFromFront: 1,
    note: "Front of train — exits near 1/2/3 + N/Q/R/W",
    confidence: "high",
  },

  // Union Sq (4/5/6) → Grand Central — last two cars line up with the
  // 42nd St exits and the Lex-line stairs.
  {
    fromStationId: "14-union-sq",
    toStationId: "grand-central-42",
    direction: "N",
    carsFromFront: 9,
    note: "Rear of train — closest to Grand Central exits",
    confidence: "medium",
  },

  // Fulton St → Atlantic-Barclays on the 4/5.
  {
    fromStationId: "fulton-st",
    toStationId: "atlantic-barclays",
    direction: "S",
    carsFromFront: 6,
    note: "Middle of train — shortest walk to Barclays exit",
    confidence: "medium",
  },

  // Columbus Circle → 125 St St-Nicholas on the A/B/C/D.
  {
    fromStationId: "columbus-circle-59",
    toStationId: "125-stnich",
    direction: "N",
    carsFromFront: 2,
    note: "Front of train — closest to St Nicholas Ave exit",
    confidence: "medium",
  },

  // Jackson Hts → Court Sq on the 7.
  {
    fromStationId: "jackson-hts",
    toStationId: "court-sq",
    direction: "S",
    carsFromFront: 4,
    note: "Mid-front — closest to Court Sq transfer to E/G/M",
    confidence: "medium",
  },
];

const key = (from: string, to: string) => `${from}__${to}`;
const BY_PAIR = new Map<string, BoardingHint>();
for (const h of BOARDING_HINTS) BY_PAIR.set(key(h.fromStationId, h.toStationId), h);

export function hintFor(fromId: string, toId: string): BoardingHint | null {
  return BY_PAIR.get(key(fromId, toId)) ?? null;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function carPositionLabel(n: number): string {
  if (n === 1) return "Front car";
  if (n <= 3) return `${ordinal(n)} car from front`;
  if (n >= 9) return `${ordinal(11 - n + 1)} car from back`;
  return "Middle of train";
}
