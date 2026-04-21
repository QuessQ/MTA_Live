import { useState, useCallback } from 'react';
import type { RouteOption, RouteSortOption } from '@/types';
import { sortRouteOptions } from '@/types';
import { fetchRouteOptions, type Coordinates } from '@/services';

interface RoutePlannerState {
  options: RouteOption[];
  loading: boolean;
  error: string | null;
  sortBy: RouteSortOption;
}

export function useRoutePlanner() {
  const [state, setState] = useState<RoutePlannerState>({
    options: [],
    loading: false,
    error: null,
    sortBy: 'fastest',
  });

  const plan = useCallback((origin: Coordinates, destination: Coordinates) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchRouteOptions(origin, destination)
      .then((options) => {
        setState((s) => ({
          ...s,
          options: sortRouteOptions(options, s.sortBy),
          loading: false,
          error: null,
        }));
      })
      .catch((err: Error) => {
        setState((s) => ({ ...s, options: [], loading: false, error: err.message }));
      });
  }, []);

  const setSortBy = useCallback((sortBy: RouteSortOption) => {
    setState((s) => ({
      ...s,
      sortBy,
      options: sortRouteOptions(s.options, sortBy),
    }));
  }, []);

  return { ...state, plan, setSortBy };
}
