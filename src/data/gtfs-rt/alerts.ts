// Service-alerts client. Reads the MTA's GTFS-RT alerts feed, picks out the
// alerts that affect lines we display, and exposes a compact typed view.
//
// Feed: .../camsys%2Fsubway-alerts (protobuf)

import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import type { SubwayLine } from "../lines";
import { relayBase } from "./feeds";

const { transit_realtime } = GtfsRealtimeBindings;

export interface Alert {
  id: string;
  header: string;
  description: string;
  lines: SubwayLine[];
  stopIds: string[];
  severity: "info" | "warning" | "severe";
  effect: string;
  activeNow: boolean;
}

function alertsUrl(): string {
  return `${relayBase().replace(/\/$/, "")}/camsys%2Fsubway-alerts`;
}

function severityFor(effect: number): Alert["severity"] {
  const E = transit_realtime.Alert.Effect;
  if (effect === E.NO_SERVICE || effect === E.DETOUR) return "severe";
  if (effect === E.SIGNIFICANT_DELAYS || effect === E.REDUCED_SERVICE) return "warning";
  return "info";
}

function effectLabel(effect: number): string {
  const E = transit_realtime.Alert.Effect;
  switch (effect) {
    case E.NO_SERVICE: return "Suspended";
    case E.DETOUR: return "Detour";
    case E.SIGNIFICANT_DELAYS: return "Delays";
    case E.REDUCED_SERVICE: return "Reduced service";
    case E.STOP_MOVED: return "Stop moved";
    case E.MODIFIED_SERVICE: return "Modified";
    case E.OTHER_EFFECT: return "Alert";
    case E.ADDITIONAL_SERVICE: return "Added service";
    default: return "Alert";
  }
}

function textOf(
  ts: GtfsRealtimeBindings.transit_realtime.ITranslatedString | null | undefined
): string {
  if (!ts || !ts.translation) return "";
  const en = ts.translation.find((t) => !t.language || t.language.startsWith("en"));
  return (en ?? ts.translation[0])?.text ?? "";
}

export async function fetchAlerts(signal?: AbortSignal): Promise<Alert[]> {
  const res = await fetch(alertsUrl(), { signal });
  if (!res.ok) throw new Error(`alerts: HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const message = transit_realtime.FeedMessage.decode(buf);
  const now = Date.now() / 1000;

  const out: Alert[] = [];
  for (const entity of message.entity) {
    const alert = entity.alert;
    if (!alert) continue;

    const lines = new Set<SubwayLine>();
    const stopIds = new Set<string>();
    for (const ie of alert.informedEntity ?? []) {
      if (ie.routeId) lines.add(ie.routeId as SubwayLine);
      if (ie.stopId) stopIds.add(ie.stopId);
    }
    if (lines.size === 0) continue;

    const activeNow = (alert.activePeriod ?? []).some((p) => {
      const start = p.start ? Number(p.start) : 0;
      const end = p.end ? Number(p.end) : Infinity;
      return now >= start && now <= end;
    }) || (alert.activePeriod?.length ?? 0) === 0;

    const effect = alert.effect ?? transit_realtime.Alert.Effect.OTHER_EFFECT;
    out.push({
      id: entity.id,
      header: textOf(alert.headerText),
      description: textOf(alert.descriptionText),
      lines: [...lines],
      stopIds: [...stopIds],
      severity: severityFor(effect),
      effect: effectLabel(effect),
      activeNow,
    });
  }
  return out;
}
