// NYC subway line palette + metadata. Colors from the MTA brand guidelines;
// we're not affiliated with the MTA (see PRD §10.7).

export type SubwayLine =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7"
  | "A" | "B" | "C" | "D" | "E" | "F" | "G"
  | "J" | "L" | "M" | "N" | "Q" | "R" | "W" | "Z"
  | "S"   // 42 St / Franklin / Rockaway shuttles
  | "SIR"; // Staten Island Railway

export type TransitMode = "subway" | "bus" | "lirr" | "mnr" | "sir";

export const lineColor: Record<SubwayLine, string> = {
  "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
  "4": "#00933C", "5": "#00933C", "6": "#00933C",
  "7": "#B933AD",
  A: "#0039A6", C: "#0039A6", E: "#0039A6",
  B: "#FF6319", D: "#FF6319", F: "#FF6319", M: "#FF6319",
  G: "#6CBE45",
  J: "#996633", Z: "#996633",
  L: "#A7A9AC",
  N: "#FCCC0A", Q: "#FCCC0A", R: "#FCCC0A", W: "#FCCC0A",
  S: "#808183",
  SIR: "#053F8E",
};

// Text color that reads on each bullet.
export const lineTextColor: Record<SubwayLine, string> = {
  "1": "#FFF", "2": "#FFF", "3": "#FFF",
  "4": "#FFF", "5": "#FFF", "6": "#FFF",
  "7": "#FFF",
  A: "#FFF", C: "#FFF", E: "#FFF",
  B: "#FFF", D: "#FFF", F: "#FFF", M: "#FFF",
  G: "#FFF",
  J: "#FFF", Z: "#FFF",
  L: "#FFF",
  N: "#000", Q: "#000", R: "#000", W: "#000",
  S: "#FFF",
  SIR: "#FFF",
};

export const modeLabel: Record<TransitMode, string> = {
  subway: "Subway",
  bus: "Bus",
  lirr: "LIRR",
  mnr: "Metro-North",
  sir: "Staten Island Rwy",
};
