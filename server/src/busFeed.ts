import { MTA_BUS_SIRI_BASE } from './feedConfig.js';

export interface BusArrival {
  id: string;
  stopId: string;
  routeId: string;
  routeName: string;
  direction: string;
  expectedArrival: string;
  scheduledArrival: string;
  isRealTime: boolean;
  distanceFromStop: number | null;
  stopsAway: number | null;
}

interface SiriMonitoredCall {
  ExpectedArrivalTime?: string;
  AimedArrivalTime?: string;
  DistanceFromStop?: number;
  NumberOfStopsAway?: number;
  Extensions?: {
    Distances?: {
      PresentableDistance?: string;
      DistanceFromCall?: number;
      StopsFromCall?: number;
      CallDistanceAlongRoute?: number;
    };
  };
}

interface SiriMonitoredVehicleJourney {
  LineRef: string;
  PublishedLineName: string[];
  DirectionRef: string;
  DestinationName: string[];
  MonitoredCall?: SiriMonitoredCall;
}

interface SiriStopMonitoringDelivery {
  MonitoredStopVisit?: Array<{
    MonitoredVehicleJourney: SiriMonitoredVehicleJourney;
    RecordedAtTime: string;
  }>;
}

interface SiriResponse {
  Siri: {
    ServiceDelivery: {
      StopMonitoringDelivery: SiriStopMonitoringDelivery[];
    };
  };
}

export async function getBusArrivals(
  stopId: string,
  apiKey: string
): Promise<BusArrival[]> {
  if (!apiKey) return [];

  const url = `${MTA_BUS_SIRI_BASE}/stop-monitoring.json?key=${encodeURIComponent(apiKey)}&OperatorRef=MTA&MonitoringRef=${encodeURIComponent(stopId)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bus SIRI error: ${res.status}`);

  const data = (await res.json()) as SiriResponse;
  const delivery = data.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0];
  if (!delivery?.MonitoredStopVisit) return [];

  const arrivals: BusArrival[] = [];

  for (const visit of delivery.MonitoredStopVisit) {
    const journey = visit.MonitoredVehicleJourney;
    const call = journey.MonitoredCall;

    const expected = call?.ExpectedArrivalTime ?? call?.AimedArrivalTime;
    const scheduled = call?.AimedArrivalTime ?? expected;
    if (!expected) continue;

    const distances = call?.Extensions?.Distances;

    arrivals.push({
      id: `bus-${journey.LineRef}-${visit.RecordedAtTime}`,
      stopId,
      routeId: journey.LineRef.replace('MTA NYCT_', '').replace('MTABC_', ''),
      routeName: journey.PublishedLineName?.[0] ?? journey.LineRef,
      direction: journey.DestinationName?.[0] ?? journey.DirectionRef,
      expectedArrival: expected,
      scheduledArrival: scheduled ?? expected,
      isRealTime: !!call?.ExpectedArrivalTime,
      distanceFromStop: distances?.DistanceFromCall ?? call?.DistanceFromStop ?? null,
      stopsAway: distances?.StopsFromCall ?? call?.NumberOfStopsAway ?? null,
    });
  }

  arrivals.sort(
    (a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime()
  );

  return arrivals;
}
