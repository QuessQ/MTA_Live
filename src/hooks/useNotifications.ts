import { useState, useEffect, useCallback, useRef } from 'react';
import type { ServiceAlert } from '@/types';
import { compareSeverity } from '@/types';

type NotificationPermission = 'default' | 'granted' | 'denied';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem('nyctransit:notificationsEnabled') === 'true';
    } catch {
      return false;
    }
  });
  const notifiedAlerts = useRef(new Set<string>());

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setEnabled(true);
      localStorage.setItem('nyctransit:notificationsEnabled', 'true');
    }
  }, []);

  const toggle = useCallback(() => {
    if (!enabled && permission !== 'granted') {
      requestPermission();
    } else {
      const next = !enabled;
      setEnabled(next);
      localStorage.setItem('nyctransit:notificationsEnabled', String(next));
    }
  }, [enabled, permission, requestPermission]);

  const notifyAlerts = useCallback((alerts: ServiceAlert[]) => {
    if (!enabled || permission !== 'granted') return;

    const sorted = [...alerts].sort((a, b) => compareSeverity(a.severity, b.severity));
    for (const alert of sorted) {
      if (notifiedAlerts.current.has(alert.id)) continue;
      notifiedAlerts.current.add(alert.id);

      if (alert.severity === 'info') continue;

      new Notification(`NYC Transit: ${alert.title}`, {
        body: `${alert.affectedRoutes.join(', ')} — ${alert.body.slice(0, 100)}`,
        tag: alert.id,
        requireInteraction: alert.severity === 'emergency' || alert.severity === 'severe',
      });
    }
  }, [enabled, permission]);

  useEffect(() => {
    // Clean up old alert IDs periodically
    const interval = setInterval(() => {
      if (notifiedAlerts.current.size > 200) {
        notifiedAlerts.current.clear();
      }
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  return {
    permission,
    enabled,
    supported: typeof Notification !== 'undefined',
    toggle,
    notifyAlerts,
  };
}
