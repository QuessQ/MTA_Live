export type AlertSeverity = 'info' | 'warning' | 'severe' | 'emergency';

export type AlertCategory =
  | 'delay'
  | 'suspension'
  | 'reroute'
  | 'serviceChange'
  | 'emergency'
  | 'plannedWork';

export interface ServiceAlert {
  id: string;
  title: string;
  body: string;
  severity: AlertSeverity;
  category: AlertCategory;
  affectedRoutes: string[];
  startTime: string;
  endTime: string | null;
  updatedAt: string;
}

export function isAlertActive(alert: ServiceAlert): boolean {
  const now = Date.now();
  const start = new Date(alert.startTime).getTime();
  if (alert.endTime) {
    const end = new Date(alert.endTime).getTime();
    return now >= start && now <= end;
  }
  return now >= start;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  severe: 2,
  emergency: 3,
};

export function compareSeverity(a: AlertSeverity, b: AlertSeverity): number {
  return SEVERITY_ORDER[b] - SEVERITY_ORDER[a];
}
