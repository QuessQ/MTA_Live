import type { TransitStop, Arrival, TransitLine, ServiceAlert, RouteOption } from '@/types';
import type { Coordinates } from './geolocation';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function fetchJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  url.pathname = API_BASE + path;
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Transit API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchNearbyStops(
  coords: Coordinates,
  radiusMeters = 800
): Promise<TransitStop[]> {
  return fetchJson<TransitStop[]>('/nearby-stops', {
    lat: String(coords.latitude),
    lon: String(coords.longitude),
    radius: String(radiusMeters),
  });
}

export async function fetchArrivals(stopId: string): Promise<Arrival[]> {
  return fetchJson<Arrival[]>(`/stops/${encodeURIComponent(stopId)}/arrivals`);
}

export async function fetchLines(): Promise<TransitLine[]> {
  return fetchJson<TransitLine[]>('/lines');
}

export async function fetchLineStatus(lineId: string): Promise<ServiceAlert[]> {
  return fetchJson<ServiceAlert[]>(`/lines/${encodeURIComponent(lineId)}/alerts`);
}

export async function fetchAlerts(routeIds?: string[]): Promise<ServiceAlert[]> {
  const params: Record<string, string> = {};
  if (routeIds?.length) {
    params.routes = routeIds.join(',');
  }
  return fetchJson<ServiceAlert[]>('/alerts', params);
}

export async function fetchRouteOptions(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteOption[]> {
  return fetchJson<RouteOption[]>('/route-plan', {
    originLat: String(origin.latitude),
    originLon: String(origin.longitude),
    destLat: String(destination.latitude),
    destLon: String(destination.longitude),
  });
}
