import { useMemo } from "react";
import { useStore } from "@/store";
import { STATIONS, type Station } from "@/data/stations";
import { nearestFrom, walkSeconds } from "@/lib/geo";
import { etaMinutesOnly, formatWalk } from "@/lib/time";
import { LineBullet } from "@/ui/LineBullet";
import { StaleBadge } from "@/ui/StaleBadge";
import type { Arrival } from "@/data/gtfs-rt/client";

interface AnswerCard {
  station: Station;
  walkMeters: number;
  arrival: Arrival | null;
  alternatives: Arrival[];
}

// Build the primary answer from: nearest station → its soonest upcoming
// arrival, plus up to two alternatives from other stations within walking.
function buildAnswer(
  userLoc: { lat: number; lng: number } | null,
  arrivals: Arrival[]
): AnswerCard | null {
  const origin = userLoc ?? { lat: 40.7549, lng: -73.984 }; // Midtown fallback
  const nearest = nearestFrom(origin, STATIONS);
  if (!nearest) return null;
  const { item: station, meters } = nearest;

  const now = Date.now();
  const walkSec = walkSeconds(meters);

  // Find arrivals for the nearest station that we can still catch.
  const catchable = arrivals.filter(
    (a) => a.stationId === station.id && a.etaAt - now >= walkSec * 1000 - 30_000
  );

  // Alternatives: soonest arrival from other stations within ~8 min walk.
  const others = STATIONS.filter((s) => s.id !== station.id);
  const withWalk = others
    .map((s) => {
      const d = Math.hypot(
        (s.lat - origin.lat) * 111_000,
        (s.lng - origin.lng) * 85_000
      );
      return { s, meters: d };
    })
    .filter((x) => x.meters < 700)
    .sort((a, b) => a.meters - b.meters)
    .slice(0, 4);

  const altArrivals: Arrival[] = [];
  for (const { s } of withWalk) {
    const first = arrivals.find((a) => a.stationId === s.id);
    if (first) altArrivals.push(first);
    if (altArrivals.length >= 2) break;
  }

  return {
    station,
    walkMeters: meters,
    arrival: catchable[0] ?? null,
    alternatives: altArrivals,
  };
}

export function AnswerMode() {
  const { arrivals, userLocation, setSelectedStation, setView } = useStore();

  const card = useMemo(
    () => buildAnswer(userLocation, arrivals),
    [userLocation, arrivals]
  );

  if (!card) {
    return (
      <section
        className="flex h-full items-center justify-center px-8 text-center"
        aria-live="polite"
      >
        <p className="text-bone-200">Locating you…</p>
      </section>
    );
  }

  const { station, walkMeters, arrival, alternatives } = card;
  const directionLabel =
    arrival?.direction === "N"
      ? "Uptown"
      : arrival?.direction === "S"
        ? "Downtown"
        : "";

  return (
    <section
      className="flex h-full flex-col px-6"
      style={{ paddingTop: "calc(var(--safe-top) + 16px)" }}
    >
      <header className="flex items-center justify-between pb-6 no-select">
        <div className="flex items-baseline gap-2">
          <span className="numerals font-bold text-gold tracking-tight text-sm">PULSE</span>
          <StaleBadge />
        </div>
        <span className="text-[10px] numerals text-bone-300">
          NYC · MTA LIVE
        </span>
      </header>

      {/* Primary card — the one answer. */}
      <article
        className="flex-1 flex flex-col justify-center"
        onClick={() => {
          setSelectedStation(station.id);
          setView("map");
        }}
        role="button"
        aria-label={`${station.name} next train`}
      >
        <div className="flex items-center gap-2 text-bone-300 text-xs uppercase tracking-widest">
          <span>Nearest · {station.name}</span>
        </div>

        <div className="mt-6 flex items-end gap-4">
          <div className="flex flex-col gap-2">
            {arrival && <LineBullet line={arrival.line} size="lg" />}
          </div>
          <div className="flex items-end gap-3">
            <span className="numerals font-bold text-gold leading-none text-hero">
              {arrival ? etaMinutesOnly(arrival.etaSec) : "—"}
            </span>
            <span className="numerals text-bone-200 pb-3 text-xl">min</span>
          </div>
        </div>

        <div className="mt-5 space-y-1">
          <p className="text-bone-0 text-xl font-medium">
            {arrival
              ? `${directionLabel} ${arrival.line} train`
              : "No live arrivals yet"}
          </p>
          <p className="text-bone-300 text-sm">
            {formatWalk(walkSeconds(walkMeters))} · {Math.round(walkMeters)} m
          </p>
        </div>
      </article>

      {/* Alternatives. */}
      {alternatives.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-[10px] numerals tracking-widest text-bone-300 uppercase">
            Alternatives
          </p>
          {alternatives.map((a) => (
            <button
              key={`${a.stationId}-${a.tripId}-${a.etaAt}`}
              onClick={() => {
                setSelectedStation(a.stationId);
                setView("map");
              }}
              className="w-full flex items-center justify-between rounded-xl bg-ink-100 border border-ink-200 px-4 py-3 hover:bg-ink-200 active:bg-ink-300 transition-colors no-select"
            >
              <span className="flex items-center gap-3">
                <LineBullet line={a.line} size="sm" />
                <span className="text-bone-100 text-sm">
                  {STATIONS.find((s) => s.id === a.stationId)?.name ?? a.stationId}
                </span>
              </span>
              <span className="numerals text-bone-0 text-sm">
                {etaMinutesOnly(a.etaSec)} min
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Swipe up hint. */}
      <button
        onClick={() => setView("map")}
        className="mb-2 text-center py-4 text-bone-300 text-xs uppercase tracking-widest no-select"
      >
        <span className="inline-flex flex-col items-center gap-1">
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
            <path d="M1 7l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Swipe up for map
        </span>
      </button>
    </section>
  );
}
