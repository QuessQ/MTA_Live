import { MTA_ALERTS } from './feedConfig.js';
import { decodeFeedMessage } from './gtfsrt.js';

export interface ParsedAlert {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'severe' | 'emergency';
  category: 'delay' | 'suspension' | 'reroute' | 'serviceChange' | 'emergency' | 'plannedWork';
  affectedRoutes: string[];
  startTime: string;
  endTime: string | null;
  updatedAt: string;
}

let alertsCache: { alerts: ParsedAlert[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getAlerts(routeIds?: string[]): Promise<ParsedAlert[]> {
  if (alertsCache && Date.now() - alertsCache.fetchedAt < CACHE_TTL_MS) {
    return filterByRoutes(alertsCache.alerts, routeIds);
  }

  const res = await fetch(MTA_ALERTS.subway);
  if (!res.ok) throw new Error(`Alerts feed error: ${res.status}`);

  const buf = await res.arrayBuffer();
  const msg = decodeFeedMessage(buf);
  const alerts: ParsedAlert[] = [];

  for (const entity of msg.entity) {
    if (!entity.alert) continue;
    const a = entity.alert;

    const routes = a.informedEntity
      .map((ie) => ie.routeId)
      .filter((r): r is string => !!r);

    const title = a.headerText?.translation?.[0]?.text ?? 'Service Alert';
    const body = a.descriptionText?.translation?.[0]?.text ?? '';

    const startTime = a.activePeriod[0]?.start;
    const endTime = a.activePeriod[0]?.end;

    alerts.push({
      id: entity.id,
      title,
      body,
      severity: inferSeverity(title, body),
      category: inferCategory(title, body),
      affectedRoutes: [...new Set(routes)],
      startTime: startTime ? new Date(startTime * 1000).toISOString() : new Date().toISOString(),
      endTime: endTime ? new Date(endTime * 1000).toISOString() : null,
      updatedAt: new Date(msg.header.timestamp * 1000).toISOString(),
    });
  }

  alertsCache = { alerts, fetchedAt: Date.now() };
  return filterByRoutes(alerts, routeIds);
}

function filterByRoutes(alerts: ParsedAlert[], routeIds?: string[]): ParsedAlert[] {
  if (!routeIds?.length) return alerts;
  const set = new Set(routeIds.map((r) => r.toUpperCase()));
  return alerts.filter((a) =>
    a.affectedRoutes.some((r) => set.has(r.toUpperCase()))
  );
}

function inferSeverity(title: string, body: string): ParsedAlert['severity'] {
  const text = (title + ' ' + body).toLowerCase();
  if (text.includes('suspend') || text.includes('no service')) return 'severe';
  if (text.includes('emergency') || text.includes('police')) return 'emergency';
  if (text.includes('delay') || text.includes('slow')) return 'warning';
  return 'info';
}

function inferCategory(title: string, body: string): ParsedAlert['category'] {
  const text = (title + ' ' + body).toLowerCase();
  if (text.includes('suspend') || text.includes('no service')) return 'suspension';
  if (text.includes('reroute') || text.includes('alternate')) return 'reroute';
  if (text.includes('delay') || text.includes('slow')) return 'delay';
  if (text.includes('emergency') || text.includes('police') || text.includes('fire')) return 'emergency';
  if (text.includes('planned') || text.includes('weekend') || text.includes('work')) return 'plannedWork';
  return 'serviceChange';
}
