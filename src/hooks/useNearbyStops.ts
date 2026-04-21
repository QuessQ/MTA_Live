import { useState, useEffect } from 'react';
import type { TransitStop } from '@/types';
import { fetchNearbyStops, type Coordinates } from '@/services';

interface NearbyStopsState {
  stops: TransitStop[];
  loading: boolean;
  error: string | null;
}

export function useNearbyStops(coords: Coordinates | null): NearbyStopsState {
  const [state, setState] = useState<NearbyStopsState>({
    stops: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!coords) return;

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchNearbyStops(coords)
      .then((stops) => {
        if (!cancelled) setState({ stops, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ stops: [], loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [coords?.latitude, coords?.longitude]);

  return state;
}
