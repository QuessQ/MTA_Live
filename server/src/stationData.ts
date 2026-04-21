import type { StopData } from './types.js';

// Major NYC subway stations with GTFS stop IDs, coordinates, and served routes.
// Derived from the MTA GTFS static stops.txt.
// This is a representative subset — a full deployment would load from the GTFS file.
export const SUBWAY_STATIONS: StopData[] = [
  // Manhattan — Midtown
  { id: '127', name: 'Times Sq-42 St', latitude: 40.75529, longitude: -73.987495, routes: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W', 'S'], type: 'subway', parentStation: null },
  { id: '725', name: '42 St-Bryant Pk', latitude: 40.754222, longitude: -73.984569, routes: ['B', 'D', 'F', 'M', '7'], type: 'subway', parentStation: null },
  { id: '631', name: 'Grand Central-42 St', latitude: 40.752769, longitude: -73.979189, routes: ['4', '5', '6', '7', 'S'], type: 'subway', parentStation: null },
  { id: '901', name: 'Grand Central-42 St', latitude: 40.752769, longitude: -73.979189, routes: ['S'], type: 'subway', parentStation: null },
  { id: '614', name: 'Penn Station-34 St', latitude: 40.750373, longitude: -73.991057, routes: ['1', '2', '3'], type: 'subway', parentStation: null },
  { id: 'A28', name: '34 St-Penn Station', latitude: 40.752287, longitude: -73.993391, routes: ['A', 'C', 'E'], type: 'subway', parentStation: null },
  { id: 'D17', name: 'Herald Sq-34 St', latitude: 40.749567, longitude: -73.98795, routes: ['B', 'D', 'F', 'M', 'N', 'Q', 'R', 'W'], type: 'subway', parentStation: null },
  { id: '128', name: '50 St', latitude: 40.761728, longitude: -73.983849, routes: ['1', '2'], type: 'subway', parentStation: null },
  { id: 'A25', name: '59 St-Columbus Circle', latitude: 40.768247, longitude: -73.981929, routes: ['A', 'B', 'C', 'D', '1'], type: 'subway', parentStation: null },
  { id: 'R14', name: '49 St', latitude: 40.759901, longitude: -73.984139, routes: ['N', 'R', 'W'], type: 'subway', parentStation: null },
  { id: 'R15', name: '57 St-7 Ave', latitude: 40.764664, longitude: -73.980658, routes: ['N', 'Q', 'R', 'W'], type: 'subway', parentStation: null },
  { id: '629', name: '51 St', latitude: 40.757107, longitude: -73.97192, routes: ['6'], type: 'subway', parentStation: null },
  { id: '625', name: 'Lexington Av/59 St', latitude: 40.762526, longitude: -73.967967, routes: ['4', '5', '6', 'N', 'R', 'W'], type: 'subway', parentStation: null },

  // Manhattan — Downtown
  { id: '132', name: '14 St-7 Ave', latitude: 40.737826, longitude: -73.999395, routes: ['1', '2', '3'], type: 'subway', parentStation: null },
  { id: 'A31', name: '14 St-8 Ave', latitude: 40.740893, longitude: -74.00169, routes: ['A', 'C', 'E', 'L'], type: 'subway', parentStation: null },
  { id: 'L01', name: '8 Av', latitude: 40.739777, longitude: -74.002578, routes: ['L'], type: 'subway', parentStation: null },
  { id: 'D20', name: '14 St-Union Sq', latitude: 40.735736, longitude: -73.990568, routes: ['4', '5', '6', 'L', 'N', 'Q', 'R', 'W'], type: 'subway', parentStation: null },
  { id: 'R20', name: '14 St-Union Sq', latitude: 40.735736, longitude: -73.990568, routes: ['N', 'Q', 'R', 'W'], type: 'subway', parentStation: null },
  { id: 'R23', name: 'Canal St', latitude: 40.72028, longitude: -74.00083, routes: ['N', 'Q', 'R', 'W', 'J', 'Z', '6'], type: 'subway', parentStation: null },
  { id: 'A36', name: 'W 4 St-Wash Sq', latitude: 40.732338, longitude: -74.000495, routes: ['A', 'B', 'C', 'D', 'E', 'F', 'M'], type: 'subway', parentStation: null },
  { id: '137', name: 'Chambers St', latitude: 40.715478, longitude: -74.009266, routes: ['1', '2', '3'], type: 'subway', parentStation: null },
  { id: '138', name: 'WTC Cortlandt', latitude: 40.711835, longitude: -74.012188, routes: ['1'], type: 'subway', parentStation: null },
  { id: 'A40', name: 'Fulton St', latitude: 40.710374, longitude: -74.007582, routes: ['A', 'C', 'J', 'Z', '2', '3', '4', '5'], type: 'subway', parentStation: null },
  { id: 'R25', name: 'City Hall', latitude: 40.713282, longitude: -74.006978, routes: ['N', 'R', 'W'], type: 'subway', parentStation: null },
  { id: '142', name: 'South Ferry', latitude: 40.702068, longitude: -74.013664, routes: ['1'], type: 'subway', parentStation: null },
  { id: 'R27', name: 'Whitehall St', latitude: 40.703087, longitude: -74.012994, routes: ['N', 'R', 'W'], type: 'subway', parentStation: null },
  { id: 'R28', name: 'Rector St', latitude: 40.707513, longitude: -74.013783, routes: ['R', 'W'], type: 'subway', parentStation: null },
  { id: 'A42', name: 'Bowling Green', latitude: 40.704817, longitude: -74.014065, routes: ['4', '5'], type: 'subway', parentStation: null },

  // Manhattan — Upper
  { id: '120', name: '96 St', latitude: 40.793919, longitude: -73.972323, routes: ['1', '2', '3'], type: 'subway', parentStation: null },
  { id: '116', name: '125 St', latitude: 40.815581, longitude: -73.958372, routes: ['1'], type: 'subway', parentStation: null },
  { id: 'A15', name: '125 St', latitude: 40.811109, longitude: -73.952343, routes: ['A', 'B', 'C', 'D'], type: 'subway', parentStation: null },
  { id: '621', name: '125 St', latitude: 40.804138, longitude: -73.937594, routes: ['4', '5', '6'], type: 'subway', parentStation: null },
  { id: '124', name: '72 St', latitude: 40.778453, longitude: -73.98197, routes: ['1', '2', '3'], type: 'subway', parentStation: null },
  { id: 'Q04', name: '72 St', latitude: 40.768786, longitude: -73.958425, routes: ['Q'], type: 'subway', parentStation: null },
  { id: 'A24', name: '81 St-Museum of Natural History', latitude: 40.781433, longitude: -73.972143, routes: ['B', 'C'], type: 'subway', parentStation: null },
  { id: '626', name: '86 St', latitude: 40.779492, longitude: -73.955589, routes: ['4', '5', '6'], type: 'subway', parentStation: null },

  // Brooklyn
  { id: 'R30', name: 'Jay St-MetroTech', latitude: 40.69218, longitude: -73.987342, routes: ['A', 'C', 'F', 'R'], type: 'subway', parentStation: null },
  { id: 'D25', name: 'Atlantic Av-Barclays Ctr', latitude: 40.684359, longitude: -73.977666, routes: ['2', '3', '4', '5', 'B', 'D', 'N', 'Q', 'R'], type: 'subway', parentStation: null },
  { id: 'G29', name: 'Hoyt-Schermerhorn Sts', latitude: 40.688484, longitude: -73.985001, routes: ['A', 'C', 'G'], type: 'subway', parentStation: null },
  { id: 'A41', name: 'Borough Hall', latitude: 40.692404, longitude: -73.989951, routes: ['2', '3', '4', '5'], type: 'subway', parentStation: null },
  { id: 'R29', name: 'Court St', latitude: 40.6941, longitude: -73.991777, routes: ['R'], type: 'subway', parentStation: null },
  { id: 'G30', name: 'Bedford-Nostrand Avs', latitude: 40.689627, longitude: -73.953522, routes: ['G'], type: 'subway', parentStation: null },
  { id: 'L06', name: 'Bedford Av', latitude: 40.717304, longitude: -73.956872, routes: ['L'], type: 'subway', parentStation: null },
  { id: 'G31', name: 'Classon Av', latitude: 40.688873, longitude: -73.96007, routes: ['G'], type: 'subway', parentStation: null },
  { id: 'L08', name: 'Lorimer St', latitude: 40.714063, longitude: -73.950275, routes: ['L'], type: 'subway', parentStation: null },
  { id: 'G28', name: 'Lafayette Av', latitude: 40.686113, longitude: -73.974023, routes: ['C'], type: 'subway', parentStation: null },
  { id: 'A46', name: 'Nostrand Av', latitude: 40.680438, longitude: -73.950426, routes: ['A', 'C'], type: 'subway', parentStation: null },
  { id: 'F21', name: 'Bergen St', latitude: 40.686145, longitude: -73.975082, routes: ['F', 'G'], type: 'subway', parentStation: null },
  { id: 'F23', name: 'Carroll St', latitude: 40.680303, longitude: -73.975, routes: ['F', 'G'], type: 'subway', parentStation: null },
  { id: 'D26', name: '7 Av', latitude: 40.67705, longitude: -73.972791, routes: ['B', 'Q'], type: 'subway', parentStation: null },
  { id: 'D43', name: 'Coney Island-Stillwell Av', latitude: 40.577422, longitude: -73.981233, routes: ['D', 'F', 'N', 'Q'], type: 'subway', parentStation: null },

  // Queens
  { id: '710', name: 'Flushing-Main St', latitude: 40.7596, longitude: -73.83003, routes: ['7'], type: 'subway', parentStation: null },
  { id: 'G08', name: 'Court Sq', latitude: 40.746554, longitude: -73.945264, routes: ['7', 'E', 'G', 'M'], type: 'subway', parentStation: null },
  { id: 'F09', name: 'Jackson Hts-Roosevelt Av', latitude: 40.746644, longitude: -73.891338, routes: ['7', 'E', 'F', 'M', 'R'], type: 'subway', parentStation: null },
  { id: 'G14', name: 'Jamaica-179 St', latitude: 40.712646, longitude: -73.783817, routes: ['F'], type: 'subway', parentStation: null },
  { id: 'J27', name: 'Jamaica Center-Parsons/Archer', latitude: 40.702147, longitude: -73.801109, routes: ['J', 'Z'], type: 'subway', parentStation: null },
  { id: 'G22', name: 'Forest Hills-71 Av', latitude: 40.721691, longitude: -73.844521, routes: ['E', 'F', 'M', 'R'], type: 'subway', parentStation: null },
  { id: 'A65', name: 'Howard Beach-JFK Airport', latitude: 40.660476, longitude: -73.8303, routes: ['A'], type: 'subway', parentStation: null },
  { id: 'F01', name: 'Jamaica-Van Wyck', latitude: 40.702566, longitude: -73.816859, routes: ['E'], type: 'subway', parentStation: null },
  { id: 'R01', name: 'Astoria-Ditmars Blvd', latitude: 40.775036, longitude: -73.912034, routes: ['N', 'W'], type: 'subway', parentStation: null },

  // Bronx
  { id: 'A02', name: 'Inwood-207 St', latitude: 40.868072, longitude: -73.919899, routes: ['A'], type: 'subway', parentStation: null },
  { id: '101', name: 'Van Cortlandt Park-242 St', latitude: 40.889248, longitude: -73.898583, routes: ['1'], type: 'subway', parentStation: null },
  { id: '401', name: 'Woodlawn', latitude: 40.886037, longitude: -73.878751, routes: ['4'], type: 'subway', parentStation: null },
  { id: '601', name: 'Pelham Bay Park', latitude: 40.852462, longitude: -73.828121, routes: ['6'], type: 'subway', parentStation: null },
  { id: '416', name: 'Yankee Stadium-161 St', latitude: 40.827994, longitude: -73.925831, routes: ['4', 'B', 'D'], type: 'subway', parentStation: null },
];

export function findNearbyStations(
  lat: number,
  lon: number,
  radiusMeters: number
): (StopData & { distance: number })[] {
  const results: (StopData & { distance: number })[] = [];

  for (const station of SUBWAY_STATIONS) {
    const dist = haversine(lat, lon, station.latitude, station.longitude);
    if (dist <= radiusMeters) {
      results.push({ ...station, distance: dist });
    }
  }

  results.sort((a, b) => a.distance - b.distance);
  return results;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
