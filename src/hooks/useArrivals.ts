import { useState, useEffect, useCallback } from 'react';
import type { Arrival } from '@/types';
import { fetchArrivals } from '@/services';

interface ArrivalsState {
  arrivals: Arrival[];
  loading: boolean;
  error: string | null;
}

const REFRESH_INTERVAL = 30000;

export function useArrivals(stopId: string | null): ArrivalsState & { refresh: () => void } {
  const [state, setState] = useState<ArrivalsState>({
    arrivals: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(() => {
    if (!stopId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchArrivals(stopId)
      .then((arrivals) => setState({ arrivals, loading: false, error: null }))
      .catch((err: Error) => setState({ arrivals: [], loading: false, error: err.message }));
  }, [stopId]);

  useEffect(() => {
    if (!stopId) {
      setState({ arrivals: [], loading: false, error: null });
      return;
    }

    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [stopId, refresh]);

  return { ...state, refresh };
}
