import type { TransitType } from './transit';

export type RouteLegType = 'walk' | 'subway' | 'bus' | 'ferry';
export type RouteReliability = 'high' | 'moderate' | 'low';
export type RouteSortOption = 'fastest' | 'fewestTransfers' | 'leastWalking';

export interface RouteLeg {
  id: string;
  type: RouteLegType;
  routeName: string | null;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
}

export interface RouteOption {
  id: string;
  legs: RouteLeg[];
  totalDurationMinutes: number;
  totalWalkingMinutes: number;
  transferCount: number;
  hasActiveAlerts: boolean;
  reliability: RouteReliability;
}

export interface SavedRoute {
  id: string;
  name: string;
  originName: string;
  originLatitude: number;
  originLongitude: number;
  destinationName: string;
  destinationLatitude: number;
  destinationLongitude: number;
  preferredRouteIds: string[];
}

export interface FavoriteStop {
  id: string;
  stopId: string;
  name: string;
  type: TransitType;
  trackedRoutes: string[];
}

export const SORT_LABELS: Record<RouteSortOption, string> = {
  fastest: 'Fastest',
  fewestTransfers: 'Fewest transfers',
  leastWalking: 'Least walking',
};

export const RELIABILITY_LABELS: Record<RouteReliability, string> = {
  high: 'Reliable',
  moderate: 'Some delays',
  low: 'Disrupted',
};

export function sortRouteOptions(
  options: RouteOption[],
  by: RouteSortOption
): RouteOption[] {
  const sorted = [...options];
  switch (by) {
    case 'fastest':
      return sorted.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
    case 'fewestTransfers':
      return sorted.sort((a, b) => a.transferCount - b.transferCount);
    case 'leastWalking':
      return sorted.sort((a, b) => a.totalWalkingMinutes - b.totalWalkingMinutes);
  }
}
