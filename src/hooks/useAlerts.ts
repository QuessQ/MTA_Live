import { useState, useEffect, useCallback } from 'react';
import type { ServiceAlert } from '@/types';
import { compareSeverity } from '@/types';
import { fetchAlerts } from '@/services';

interface AlertsState {
  alerts: ServiceAlert[];
  loading: boolean;
  error: string | null;
}

const REFRESH_INTERVAL = 60000;

export function useAlerts(routeIds?: string[]): AlertsState & { refresh: () => void } {
  const [state, setState] = useState<AlertsState>({
    alerts: [],
    loading: false,
    error: null,
  });

  const routeKey = routeIds?.join(',') ?? '';

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchAlerts(routeIds)
      .then((alerts) => {
        const sorted = alerts.sort((a, b) => compareSeverity(a.severity, b.severity));
        setState({ alerts: sorted, loading: false, error: null });
      })
      .catch((err: Error) => setState({ alerts: [], loading: false, error: err.message }));
  }, [routeKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { ...state, refresh };
}
