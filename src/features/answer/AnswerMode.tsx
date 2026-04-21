import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { STATIONS, type Station } from "@/data/stations";
import { nearestFrom, walkSeconds } from "@/lib/geo";
import { etaMinutesOnly, formatWalk } from "@/lib/time";
import { LineBullet } from "@/ui/LineBullet";
import { StaleBadge } from "@/ui/StaleBadge";
import type { Arrival } from "@/data/gtfs-rt/client";
import { DestinationSearch } from "@/features/search/DestinationSearch";
import { RouteCard } from "@/features/routing/RouteCard";
import { FavoritesRow } from "@/features/favorites/FavoritesRow";
import { SettingsSheet } from "@/features/settings/SettingsSheet";

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
    .map((s) => ({
      s,
      meters: Math.hypot(
        (s.lat - origin.lat) * 111_000,
        (s.lng - origin.lng) * 85_000
      ),
    }))
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
  const {
    arrivals,
    userLocation,
    setSelectedStation,
    setView,
    setOriginStation,
    setDestinationStation,
    originStationId,
    destinationStationId,
    route,
  } = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const card = useMemo(
    () => buildAnswer(userLocation, arrivals),
    [userLocation, arrivals]
  );

  // Auto-set origin to the nearest station when the rider starts a search.
  const handleDestination = (id: string | null) => {
    if (id && !originStationId && card) {
      setOriginStation(card.station.id);
    }
    setDestinationStation(id);
    if (id) setView("map");
  };

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
      className="flex h-full flex-col overflow-y-auto px-6"
      style={{ paddingTop: "calc(var(--safe-top) + 16px)" }}
    >
      <header className="flex items-center justify-between pb-4 no-select">
        <div className="flex items-baseline gap-2">
          <span className="numerals font-bold text-gold tracking-tight text-sm">PULSE</span>
          <StaleBadge />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] numerals text-bone-300">NYC · MTA LIVE</span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-11 w-11 grid place-items-center text-bone-300 hover:text-bone-0 -mr-2"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Destination search */}
      <div className="pb-2">
        <DestinationSearch
          value={destinationStationId}
          placeholder="Where to?"
          label="Destination"
          onPick={handleDestination}
        />
      </div>

      {/* Route card, if one exists */}
      {route && <RouteCard />}

      {/* Primary card — the one answer. Hidden when a route is showing. */}
      {!route && (
        <article
          className="flex-1 flex flex-col justify-center pt-4"
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
      )}

      {/* Alternatives */}
      {!route && alternatives.length > 0 && (
        <div className="mt-5 space-y-2">
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

      <FavoritesRow />

      <button
        onClick={() => setView("map")}
        className="mt-auto mb-2 text-center py-4 text-bone-300 text-xs uppercase tracking-widest no-select"
      >
        <span className="inline-flex flex-col items-center gap-1">
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
            <path d="M1 7l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Swipe up for map
        </span>
      </button>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </section>
  );
}
