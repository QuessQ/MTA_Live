import { findNearbyStations, SUBWAY_STATIONS } from './stationData.js';
import { getSubwayArrivals } from './subwayFeed.js';
import { getAlerts } from './alertsFeed.js';
import type { StopData } from './types.js';

export interface RoutePlanLeg {
  id: string;
  type: 'walk' | 'subway' | 'bus';
  routeName: string | null;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
}

export interface RoutePlanOption {
  id: string;
  legs: RoutePlanLeg[];
  totalDurationMinutes: number;
  totalWalkingMinutes: number;
  transferCount: number;
  hasActiveAlerts: boolean;
  reliability: 'high' | 'moderate' | 'low';
}

const WALK_SPEED_MPS = 1.3; // ~4.7 km/h average walking
const SUBWAY_SPEED_MPS = 13; // ~47 km/h average including stops
const TRANSFER_PENALTY_MIN = 5;

export async function planRoutes(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number
): Promise<RoutePlanOption[]> {
  const originStops = findNearbyStations(originLat, originLon, 1200);
  const destStops = findNearbyStations(destLat, destLon, 1200);

  if (originStops.length === 0 || destStops.length === 0) {
    return [];
  }

  const alerts = await getAlerts().catch(() => []);
  const alertedRoutes = new Set(alerts.flatMap((a) => a.affectedRoutes));

  const options: RoutePlanOption[] = [];
  const seen = new Set<string>();

  for (const origin of originStops.slice(0, 5)) {
    for (const dest of destStops.slice(0, 5)) {
      const sharedRoutes = origin.routes.filter((r) => dest.routes.includes(r));

      // Direct routes (no transfer)
      for (const route of sharedRoutes) {
        const key = `direct-${route}-${origin.id}-${dest.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const option = await buildDirectRoute(
          origin, dest, route, originLat, originLon, destLat, destLon, alertedRoutes
        );
        if (option) options.push(option);
      }

      // One-transfer routes via common transfer stations
      if (sharedRoutes.length === 0) {
        const transferOptions = findTransferRoutes(origin, dest);
        for (const transfer of transferOptions.slice(0, 3)) {
          const key = `transfer-${transfer.route1}-${transfer.route2}-${origin.id}-${dest.id}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const option = await buildTransferRoute(
            origin, dest, transfer, originLat, originLon, destLat, destLon, alertedRoutes
          );
          if (option) options.push(option);
        }
      }
    }
  }

  // Walk-only option if close enough
  const walkDist = haversine(originLat, originLon, destLat, destLon);
  if (walkDist < 3000) {
    const walkMin = Math.round(walkDist / WALK_SPEED_MPS / 60);
    const now = new Date();
    options.push({
      id: 'walk-only',
      legs: [{
        id: 'walk-0',
        type: 'walk',
        routeName: null,
        from: 'Origin',
        to: 'Destination',
        departureTime: now.toISOString(),
        arrivalTime: new Date(now.getTime() + walkMin * 60000).toISOString(),
        durationMinutes: walkMin,
        stops: 0,
      }],
      totalDurationMinutes: walkMin,
      totalWalkingMinutes: walkMin,
      transferCount: 0,
      hasActiveAlerts: false,
      reliability: 'high',
    });
  }

  options.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
  return options.slice(0, 8);
}

interface TransferInfo {
  transferStation: StopData;
  route1: string;
  route2: string;
}

function findTransferRoutes(
  origin: StopData & { distance: number },
  dest: StopData & { distance: number }
): TransferInfo[] {
  const results: TransferInfo[] = [];

  for (const station of SUBWAY_STATIONS) {
    const originRoutes = origin.routes.filter((r) => station.routes.includes(r));
    const destRoutes = dest.routes.filter((r) => station.routes.includes(r));

    if (originRoutes.length > 0 && destRoutes.length > 0) {
      for (const r1 of originRoutes) {
        for (const r2 of destRoutes) {
          if (r1 !== r2) {
            results.push({ transferStation: station, route1: r1, route2: r2 });
          }
        }
      }
    }
  }

  // Sort by geographic midpoint proximity (prefer transfers roughly between origin and dest)
  const midLat = (origin.latitude + dest.latitude) / 2;
  const midLon = (origin.longitude + dest.longitude) / 2;
  results.sort((a, b) => {
    const distA = haversine(midLat, midLon, a.transferStation.latitude, a.transferStation.longitude);
    const distB = haversine(midLat, midLon, b.transferStation.latitude, b.transferStation.longitude);
    return distA - distB;
  });

  return results;
}

async function buildDirectRoute(
  origin: StopData & { distance: number },
  dest: StopData,
  route: string,
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  alertedRoutes: Set<string>
): Promise<RoutePlanOption | null> {
  const now = new Date();
  const walkToMin = Math.round(origin.distance / WALK_SPEED_MPS / 60);
  const walkFromDist = haversine(dest.latitude, dest.longitude, destLat, destLon);
  const walkFromMin = Math.round(walkFromDist / WALK_SPEED_MPS / 60);

  const subwayDist = haversine(origin.latitude, origin.longitude, dest.latitude, dest.longitude);
  const subwayMin = Math.max(2, Math.round(subwayDist / SUBWAY_SPEED_MPS / 60));

  // Try to get real arrival time
  let waitMin = 3;
  try {
    const arrivals = await getSubwayArrivals(origin.id);
    const matching = arrivals.filter((a) => a.routeId === route);
    if (matching.length > 0) {
      const firstArrival = new Date(matching[0].expectedArrival);
      waitMin = Math.max(0, Math.round((firstArrival.getTime() - now.getTime()) / 60000));
    }
  } catch { /* use default wait */ }

  const totalMin = walkToMin + waitMin + subwayMin + walkFromMin;
  const hasAlerts = alertedRoutes.has(route);
  const legs: RoutePlanLeg[] = [];
  let cursor = now;

  if (walkToMin > 0) {
    const walkEnd = new Date(cursor.getTime() + walkToMin * 60000);
    legs.push({
      id: `walk-to-${origin.id}`,
      type: 'walk',
      routeName: null,
      from: 'Origin',
      to: origin.name,
      departureTime: cursor.toISOString(),
      arrivalTime: walkEnd.toISOString(),
      durationMinutes: walkToMin,
      stops: 0,
    });
    cursor = walkEnd;
  }

  const boardTime = new Date(cursor.getTime() + waitMin * 60000);
  const alightTime = new Date(boardTime.getTime() + subwayMin * 60000);
  legs.push({
    id: `subway-${route}-${origin.id}-${dest.id}`,
    type: 'subway',
    routeName: route,
    from: origin.name,
    to: dest.name,
    departureTime: boardTime.toISOString(),
    arrivalTime: alightTime.toISOString(),
    durationMinutes: subwayMin + waitMin,
    stops: Math.max(1, Math.round(subwayDist / 800)),
  });
  cursor = alightTime;

  if (walkFromMin > 0) {
    const walkEnd = new Date(cursor.getTime() + walkFromMin * 60000);
    legs.push({
      id: `walk-from-${dest.id}`,
      type: 'walk',
      routeName: null,
      from: dest.name,
      to: 'Destination',
      departureTime: cursor.toISOString(),
      arrivalTime: walkEnd.toISOString(),
      durationMinutes: walkFromMin,
      stops: 0,
    });
  }

  return {
    id: `direct-${route}-${origin.id}-${dest.id}`,
    legs,
    totalDurationMinutes: totalMin,
    totalWalkingMinutes: walkToMin + walkFromMin,
    transferCount: 0,
    hasActiveAlerts: hasAlerts,
    reliability: hasAlerts ? 'low' : 'high',
  };
}

async function buildTransferRoute(
  origin: StopData & { distance: number },
  dest: StopData,
  transfer: TransferInfo,
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  alertedRoutes: Set<string>
): Promise<RoutePlanOption | null> {
  const now = new Date();
  const walkToMin = Math.round(origin.distance / WALK_SPEED_MPS / 60);
  const walkFromDist = haversine(dest.latitude, dest.longitude, destLat, destLon);
  const walkFromMin = Math.round(walkFromDist / WALK_SPEED_MPS / 60);

  const leg1Dist = haversine(origin.latitude, origin.longitude, transfer.transferStation.latitude, transfer.transferStation.longitude);
  const leg1Min = Math.max(2, Math.round(leg1Dist / SUBWAY_SPEED_MPS / 60));

  const leg2Dist = haversine(transfer.transferStation.latitude, transfer.transferStation.longitude, dest.latitude, dest.longitude);
  const leg2Min = Math.max(2, Math.round(leg2Dist / SUBWAY_SPEED_MPS / 60));

  const waitMin = 3;
  const totalMin = walkToMin + waitMin + leg1Min + TRANSFER_PENALTY_MIN + leg2Min + walkFromMin;
  const hasAlerts = alertedRoutes.has(transfer.route1) || alertedRoutes.has(transfer.route2);

  const legs: RoutePlanLeg[] = [];
  let cursor = now;

  if (walkToMin > 0) {
    const walkEnd = new Date(cursor.getTime() + walkToMin * 60000);
    legs.push({
      id: `walk-to-${origin.id}`,
      type: 'walk',
      routeName: null,
      from: 'Origin',
      to: origin.name,
      departureTime: cursor.toISOString(),
      arrivalTime: walkEnd.toISOString(),
      durationMinutes: walkToMin,
      stops: 0,
    });
    cursor = walkEnd;
  }

  const board1 = new Date(cursor.getTime() + waitMin * 60000);
  const alight1 = new Date(board1.getTime() + leg1Min * 60000);
  legs.push({
    id: `subway-${transfer.route1}-${origin.id}-${transfer.transferStation.id}`,
    type: 'subway',
    routeName: transfer.route1,
    from: origin.name,
    to: transfer.transferStation.name,
    departureTime: board1.toISOString(),
    arrivalTime: alight1.toISOString(),
    durationMinutes: leg1Min + waitMin,
    stops: Math.max(1, Math.round(leg1Dist / 800)),
  });

  const board2 = new Date(alight1.getTime() + TRANSFER_PENALTY_MIN * 60000);
  const alight2 = new Date(board2.getTime() + leg2Min * 60000);
  legs.push({
    id: `subway-${transfer.route2}-${transfer.transferStation.id}-${dest.id}`,
    type: 'subway',
    routeName: transfer.route2,
    from: transfer.transferStation.name,
    to: dest.name,
    departureTime: board2.toISOString(),
    arrivalTime: alight2.toISOString(),
    durationMinutes: leg2Min + TRANSFER_PENALTY_MIN,
    stops: Math.max(1, Math.round(leg2Dist / 800)),
  });
  cursor = alight2;

  if (walkFromMin > 0) {
    const walkEnd = new Date(cursor.getTime() + walkFromMin * 60000);
    legs.push({
      id: `walk-from-${dest.id}`,
      type: 'walk',
      routeName: null,
      from: dest.name,
      to: 'Destination',
      departureTime: cursor.toISOString(),
      arrivalTime: walkEnd.toISOString(),
      durationMinutes: walkFromMin,
      stops: 0,
    });
  }

  return {
    id: `transfer-${transfer.route1}-${transfer.route2}-${origin.id}-${dest.id}`,
    legs,
    totalDurationMinutes: totalMin,
    totalWalkingMinutes: walkToMin + walkFromMin,
    transferCount: 1,
    hasActiveAlerts: hasAlerts,
    reliability: hasAlerts ? 'low' : 'moderate',
  };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
