import type { SavedRoute, FavoriteStop } from '@/types';

const SAVED_ROUTES_KEY = 'nyctransit:savedRoutes';
const FAVORITE_STOPS_KEY = 'nyctransit:favoriteStops';
const TRACKED_LINES_KEY = 'nyctransit:trackedLines';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadSavedRoutes(): SavedRoute[] {
  return loadJson<SavedRoute[]>(SAVED_ROUTES_KEY, []);
}

export function saveSavedRoutes(routes: SavedRoute[]): void {
  saveJson(SAVED_ROUTES_KEY, routes);
}

export function loadFavoriteStops(): FavoriteStop[] {
  return loadJson<FavoriteStop[]>(FAVORITE_STOPS_KEY, []);
}

export function saveFavoriteStops(stops: FavoriteStop[]): void {
  saveJson(FAVORITE_STOPS_KEY, stops);
}

export function loadTrackedLines(): string[] {
  return loadJson<string[]>(TRACKED_LINES_KEY, []);
}

export function saveTrackedLines(lineIds: string[]): void {
  saveJson(TRACKED_LINES_KEY, lineIds);
}
