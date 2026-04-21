// Time formatting for Answer Mode and arrivals cards.

export function minutesUntil(etaMs: number, nowMs = Date.now()): number {
  return Math.max(0, Math.round((etaMs - nowMs) / 60_000));
}

// "4 min" / "Now" / "Due"
export function formatEta(etaSec: number): string {
  if (etaSec <= 20) return "Now";
  if (etaSec <= 60) return "Due";
  return `${Math.round(etaSec / 60)} min`;
}

// "4" — bare minute number (for hero display alongside a muted "min" unit).
export function etaMinutesOnly(etaSec: number): string {
  if (etaSec <= 20) return "—";
  return String(Math.max(1, Math.round(etaSec / 60)));
}

export function formatWalk(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)} min walk`;
}

export function stalenessLabel(fetchedAt: number | null, nowMs = Date.now()): string | null {
  if (!fetchedAt) return null;
  const age = (nowMs - fetchedAt) / 1000;
  if (age < 30) return null;
  if (age < 120) return `${Math.round(age)}s old`;
  return `${Math.round(age / 60)}m old`;
}
