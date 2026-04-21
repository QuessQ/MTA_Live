export type TransitType = 'subway' | 'bus' | 'ferry';

export interface TransitStop {
  id: string;
  name: string;
  type: TransitType;
  latitude: number;
  longitude: number;
  routes: string[];
}

export interface Arrival {
  id: string;
  stopId: string;
  routeId: string;
  routeName: string;
  direction: string;
  expectedArrival: string;
  scheduledArrival: string;
  isRealTime: boolean;
}

export interface TransitLine {
  id: string;
  name: string;
  shortName: string;
  type: TransitType;
  color: string;
}

export function getDelayMinutes(arrival: Arrival): number {
  const expected = new Date(arrival.expectedArrival).getTime();
  const scheduled = new Date(arrival.scheduledArrival).getTime();
  return Math.round((expected - scheduled) / 60000);
}

export function getMinutesUntilArrival(arrival: Arrival): number {
  const now = Date.now();
  const expected = new Date(arrival.expectedArrival).getTime();
  return Math.max(0, Math.round((expected - now) / 60000));
}

export function isDelayed(arrival: Arrival): boolean {
  return getDelayMinutes(arrival) > 1;
}
