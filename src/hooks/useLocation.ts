import { useState, useEffect, useCallback } from 'react';
import { getCurrentPosition, watchPosition, type Coordinates } from '@/services';

interface LocationState {
  coords: Coordinates | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(watch = false): LocationState & { refresh: () => void } {
  const [state, setState] = useState<LocationState>({
    coords: null,
    error: null,
    loading: true,
  });

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    getCurrentPosition()
      .then((coords) => setState({ coords, error: null, loading: false }))
      .catch((err: Error) => setState({ coords: null, error: err.message, loading: false }));
  }, []);

  useEffect(() => {
    if (watch) {
      setState((s) => ({ ...s, loading: true }));
      const cleanup = watchPosition(
        (coords) => setState({ coords, error: null, loading: false }),
        (err) => setState({ coords: null, error: err.message, loading: false })
      );
      return cleanup;
    } else {
      refresh();
    }
  }, [watch, refresh]);

  return { ...state, refresh };
}
