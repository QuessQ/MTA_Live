// Curated NYC subway station reference for MVP. In a full build this is
// hydrated from the weekly static-GTFS pipeline (see PRD §8.2). For v0 we
// bundle a small, high-traffic subset so the map has something to show
// without network. gtfsStopIds are parent-station IDs used by the GTFS-RT
// trip-update feeds; arrivals aggregate across each parent's N/S child stops.

import type { SubwayLine, TransitMode } from "./lines";

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lines: SubwayLine[];
  mode: TransitMode;
  gtfsStopIds?: string[];
  accessible?: boolean;
}

export const STATIONS: Station[] = [
  // ── Midtown / 42 St complex ───────────────────────────────────────
  {
    id: "times-sq-42",
    name: "Times Sq – 42 St",
    lat: 40.755477, lng: -73.987691,
    lines: ["1", "2", "3", "7", "N", "Q", "R", "W", "S"],
    mode: "subway",
    gtfsStopIds: ["127", "725", "R16", "902"],
    accessible: true,
  },
  {
    id: "42-st-port-authority",
    name: "42 St – Port Authority",
    lat: 40.757308, lng: -73.989735,
    lines: ["A", "C", "E"],
    mode: "subway",
    gtfsStopIds: ["A27"],
    accessible: true,
  },
  {
    id: "grand-central-42",
    name: "Grand Central – 42 St",
    lat: 40.751776, lng: -73.976848,
    lines: ["4", "5", "6", "7", "S"],
    mode: "subway",
    gtfsStopIds: ["631", "723", "901"],
    accessible: true,
  },
  {
    id: "5-av-bryant-pk",
    name: "5 Av – Bryant Pk",
    lat: 40.754222, lng: -73.981667,
    lines: ["7"],
    mode: "subway",
    gtfsStopIds: ["724"],
  },
  {
    id: "47-50-sts-rock-ctr",
    name: "47–50 Sts – Rockefeller Ctr",
    lat: 40.758663, lng: -73.981329,
    lines: ["B", "D", "F", "M"],
    mode: "subway",
    gtfsStopIds: ["D15"],
    accessible: true,
  },
  {
    id: "7-av-53",
    name: "7 Av (53 St)",
    lat: 40.762862, lng: -73.981637,
    lines: ["B", "D", "E"],
    mode: "subway",
    gtfsStopIds: ["D14"],
  },
  {
    id: "57-st-7-av",
    name: "57 St – 7 Av",
    lat: 40.764664, lng: -73.980658,
    lines: ["N", "Q", "R", "W"],
    mode: "subway",
    gtfsStopIds: ["R14"],
  },
  {
    id: "lexington-59",
    name: "Lexington Av / 59 St",
    lat: 40.762526, lng: -73.967967,
    lines: ["4", "5", "6", "N", "R", "W"],
    mode: "subway",
    gtfsStopIds: ["629", "R11"],
    accessible: true,
  },
  {
    id: "lexington-63",
    name: "Lexington Av / 63 St",
    lat: 40.764629, lng: -73.966113,
    lines: ["F", "Q"],
    mode: "subway",
    gtfsStopIds: ["B08"],
    accessible: true,
  },
  {
    id: "columbus-circle-59",
    name: "59 St – Columbus Circle",
    lat: 40.768247, lng: -73.981929,
    lines: ["1", "A", "B", "C", "D"],
    mode: "subway",
    gtfsStopIds: ["125", "A24"],
    accessible: true,
  },

  // ── Lower Midtown / Village ───────────────────────────────────────
  {
    id: "34-penn-acenb",
    name: "34 St – Penn Station (A,C,E)",
    lat: 40.752287, lng: -73.993391,
    lines: ["A", "C", "E"],
    mode: "subway",
    gtfsStopIds: ["A28"],
    accessible: true,
  },
  {
    id: "34-penn-123",
    name: "34 St – Penn Station (1,2,3)",
    lat: 40.750373, lng: -73.991057,
    lines: ["1", "2", "3"],
    mode: "subway",
    gtfsStopIds: ["128"],
    accessible: true,
  },
  {
    id: "34-herald-sq",
    name: "34 St – Herald Sq",
    lat: 40.749567, lng: -73.987950,
    lines: ["B", "D", "F", "M", "N", "Q", "R", "W"],
    mode: "subway",
    gtfsStopIds: ["D17", "R17"],
    accessible: true,
  },
  {
    id: "23-6av",
    name: "23 St (6 Av)",
    lat: 40.742781, lng: -73.992821,
    lines: ["F", "M"],
    mode: "subway",
    gtfsStopIds: ["D18"],
  },
  {
    id: "23-broadway",
    name: "23 St (Broadway)",
    lat: 40.741303, lng: -73.989344,
    lines: ["N", "R", "W"],
    mode: "subway",
    gtfsStopIds: ["R20"],
  },
  {
    id: "14-union-sq",
    name: "14 St – Union Sq",
    lat: 40.734673, lng: -73.989951,
    lines: ["4", "5", "6", "L", "N", "Q", "R", "W"],
    mode: "subway",
    gtfsStopIds: ["635", "L03", "R20"],
    accessible: true,
  },
  {
    id: "14-6av",
    name: "14 St (6 Av)",
    lat: 40.737335, lng: -73.996786,
    lines: ["F", "L", "M"],
    mode: "subway",
    gtfsStopIds: ["D19", "L02"],
  },
  {
    id: "14-8av",
    name: "14 St (8 Av)",
    lat: 40.740893, lng: -74.002472,
    lines: ["A", "C", "E", "L"],
    mode: "subway",
    gtfsStopIds: ["A31", "L01"],
    accessible: true,
  },
  {
    id: "west-4-washsq",
    name: "W 4 St – Washington Sq",
    lat: 40.732338, lng: -74.000495,
    lines: ["A", "B", "C", "D", "E", "F", "M"],
    mode: "subway",
    gtfsStopIds: ["A32", "D20"],
  },
  {
    id: "astor-pl",
    name: "Astor Pl",
    lat: 40.730054, lng: -73.991070,
    lines: ["6"],
    mode: "subway",
    gtfsStopIds: ["637"],
  },

  // ── Lower Manhattan ──────────────────────────────────────────────
  {
    id: "canal-lex",
    name: "Canal St (Lexington)",
    lat: 40.718803, lng: -74.000193,
    lines: ["6", "J", "N", "Q", "R", "W", "Z"],
    mode: "subway",
    gtfsStopIds: ["639", "R23", "J15"],
  },
  {
    id: "canal-8av",
    name: "Canal St (8 Av)",
    lat: 40.720824, lng: -74.005229,
    lines: ["A", "C", "E"],
    mode: "subway",
    gtfsStopIds: ["A34"],
    accessible: true,
  },
  {
    id: "chambers-broadway",
    name: "Chambers St",
    lat: 40.714111, lng: -74.008585,
    lines: ["1", "2", "3", "A", "C"],
    mode: "subway",
    gtfsStopIds: ["137", "A36"],
  },
  {
    id: "fulton-st",
    name: "Fulton St",
    lat: 40.710374, lng: -74.009267,
    lines: ["2", "3", "4", "5", "A", "C", "J", "Z"],
    mode: "subway",
    gtfsStopIds: ["229", "418", "A38", "M22"],
    accessible: true,
  },
  {
    id: "wall-st-4-5",
    name: "Wall St",
    lat: 40.707557, lng: -74.011862,
    lines: ["4", "5"],
    mode: "subway",
    gtfsStopIds: ["420"],
  },
  {
    id: "bowling-green",
    name: "Bowling Green",
    lat: 40.704817, lng: -74.014065,
    lines: ["4", "5"],
    mode: "subway",
    gtfsStopIds: ["420"],
  },
  {
    id: "south-ferry",
    name: "South Ferry",
    lat: 40.701411, lng: -74.013205,
    lines: ["1"],
    mode: "subway",
    gtfsStopIds: ["140"],
    accessible: true,
  },

  // ── Uptown Manhattan ─────────────────────────────────────────────
  {
    id: "72-broadway",
    name: "72 St (Broadway)",
    lat: 40.778453, lng: -73.981977,
    lines: ["1", "2", "3"],
    mode: "subway",
    gtfsStopIds: ["123"],
    accessible: true,
  },
  {
    id: "86-lex",
    name: "86 St (Lexington)",
    lat: 40.779492, lng: -73.955589,
    lines: ["4", "5", "6"],
    mode: "subway",
    gtfsStopIds: ["626"],
    accessible: true,
  },
  {
    id: "125-lex",
    name: "125 St (Lexington)",
    lat: 40.804138, lng: -73.937594,
    lines: ["4", "5", "6"],
    mode: "subway",
    gtfsStopIds: ["621"],
  },
  {
    id: "125-broadway",
    name: "125 St (Broadway)",
    lat: 40.815581, lng: -73.958372,
    lines: ["1"],
    mode: "subway",
    gtfsStopIds: ["119"],
  },
  {
    id: "125-stnich",
    name: "125 St (St Nicholas)",
    lat: 40.811109, lng: -73.952343,
    lines: ["A", "B", "C", "D"],
    mode: "subway",
    gtfsStopIds: ["A15", "D13"],
    accessible: true,
  },

  // ── Bronx ────────────────────────────────────────────────────────
  {
    id: "yankee-stadium",
    name: "161 St – Yankee Stadium",
    lat: 40.827994, lng: -73.925831,
    lines: ["4", "B", "D"],
    mode: "subway",
    gtfsStopIds: ["611", "D09"],
    accessible: true,
  },

  // ── Brooklyn ─────────────────────────────────────────────────────
  {
    id: "atlantic-barclays",
    name: "Atlantic Av – Barclays Ctr",
    lat: 40.683666, lng: -73.978401,
    lines: ["2", "3", "4", "5", "B", "D", "N", "Q", "R", "W"],
    mode: "subway",
    gtfsStopIds: ["617", "D24", "R31"],
    accessible: true,
  },
  {
    id: "jay-metrotech",
    name: "Jay St – MetroTech",
    lat: 40.692338, lng: -73.987342,
    lines: ["A", "C", "F", "R"],
    mode: "subway",
    gtfsStopIds: ["A41", "R29"],
    accessible: true,
  },
  {
    id: "bedford-l",
    name: "Bedford Av",
    lat: 40.717304, lng: -73.956872,
    lines: ["L"],
    mode: "subway",
    gtfsStopIds: ["L08"],
  },
  {
    id: "broadway-junction",
    name: "Broadway Junction",
    lat: 40.678334, lng: -73.903097,
    lines: ["A", "C", "J", "L", "Z"],
    mode: "subway",
    gtfsStopIds: ["A51", "J27", "L22"],
  },
  {
    id: "coney-island",
    name: "Coney Island – Stillwell Av",
    lat: 40.577422, lng: -73.981233,
    lines: ["D", "F", "N", "Q"],
    mode: "subway",
    gtfsStopIds: ["D43", "R45"],
    accessible: true,
  },

  // ── Queens ───────────────────────────────────────────────────────
  {
    id: "queens-plaza",
    name: "Queensboro Plaza",
    lat: 40.750582, lng: -73.940202,
    lines: ["7", "N", "W"],
    mode: "subway",
    gtfsStopIds: ["718", "R09"],
  },
  {
    id: "court-sq",
    name: "Court Sq",
    lat: 40.747023, lng: -73.945264,
    lines: ["7", "E", "G", "M"],
    mode: "subway",
    gtfsStopIds: ["719", "G22"],
    accessible: true,
  },
  {
    id: "jackson-hts",
    name: "Jackson Hts – Roosevelt Av",
    lat: 40.746644, lng: -73.891338,
    lines: ["7", "E", "F", "M", "R"],
    mode: "subway",
    gtfsStopIds: ["705", "F20"],
    accessible: true,
  },
  {
    id: "flushing-main",
    name: "Flushing – Main St",
    lat: 40.759600, lng: -73.830030,
    lines: ["7"],
    mode: "subway",
    gtfsStopIds: ["701"],
    accessible: true,
  },
  {
    id: "jamaica-center",
    name: "Jamaica Center – Parsons/Archer",
    lat: 40.702147, lng: -73.801109,
    lines: ["E", "J", "Z"],
    mode: "subway",
    gtfsStopIds: ["G05", "M14"],
    accessible: true,
  },
  {
    id: "forest-hills",
    name: "Forest Hills – 71 Av",
    lat: 40.721872, lng: -73.844653,
    lines: ["E", "F", "M", "R"],
    mode: "subway",
    gtfsStopIds: ["F04"],
    accessible: true,
  },
];

export const STATION_BY_ID = new Map(STATIONS.map((s) => [s.id, s]));

export const STATION_BY_GTFS = (() => {
  const m = new Map<string, Station>();
  for (const s of STATIONS) {
    for (const gid of s.gtfsStopIds ?? []) {
      m.set(gid, s);
    }
  }
  return m;
})();
