// Minimal geographic helpers.

export interface LatLng {
  lat: number;
  lng: number;
}

const R_M = 6371_000;

// Haversine distance in meters.
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Walking time at a brisk NYC pace (~1.4 m/s).
export function walkSeconds(meters: number): number {
  return Math.round(meters / 1.4);
}

export function nearestFrom<T extends LatLng>(
  origin: LatLng,
  items: T[]
): { item: T; meters: number } | null {
  let best: { item: T; meters: number } | null = null;
  for (const it of items) {
    const d = distanceMeters(origin, it);
    if (!best || d < best.meters) best = { item: it, meters: d };
  }
  return best;
}
