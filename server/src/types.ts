export interface StopData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
  type: 'subway' | 'bus';
  parentStation: string | null;
}
