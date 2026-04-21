import { useState, useCallback } from 'react';
import type { FavoriteStop, SavedRoute } from '@/types';
import {
  loadFavoriteStops,
  saveFavoriteStops,
  loadSavedRoutes,
  saveSavedRoutes,
  loadTrackedLines,
  saveTrackedLines,
} from '@/services';

export function useFavoriteStops() {
  const [stops, setStops] = useState<FavoriteStop[]>(() => loadFavoriteStops());

  const add = useCallback((stop: FavoriteStop) => {
    setStops((prev) => {
      const next = [...prev, stop];
      saveFavoriteStops(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setStops((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveFavoriteStops(next);
      return next;
    });
  }, []);

  return { stops, add, remove };
}

export function useSavedRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>(() => loadSavedRoutes());

  const add = useCallback((route: SavedRoute) => {
    setRoutes((prev) => {
      const next = [...prev, route];
      saveSavedRoutes(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setRoutes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveSavedRoutes(next);
      return next;
    });
  }, []);

  return { routes, add, remove };
}

export function useTrackedLines() {
  const [lineIds, setLineIds] = useState<string[]>(() => loadTrackedLines());

  const toggle = useCallback((lineId: string) => {
    setLineIds((prev) => {
      const next = prev.includes(lineId)
        ? prev.filter((id) => id !== lineId)
        : [...prev, lineId];
      saveTrackedLines(next);
      return next;
    });
  }, []);

  return { lineIds, toggle };
}
