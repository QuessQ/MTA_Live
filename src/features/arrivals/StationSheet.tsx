import { useMemo } from "react";
import { useStore } from "@/store";
import { STATION_BY_ID } from "@/data/stations";
import { BottomSheet } from "@/ui/BottomSheet";
import { LineBullet } from "@/ui/LineBullet";
import { etaMinutesOnly, formatEta } from "@/lib/time";
import { openDirections } from "@/features/deeplink/mapsLink";
import type { Arrival } from "@/data/gtfs-rt/client";

function groupByDirection(arrivals: Arrival[]) {
  const N: Arrival[] = [];
  const S: Arrival[] = [];
  for (const a of arrivals) {
    if (a.direction === "N") N.push(a);
    else S.push(a);
  }
  N.sort((a, b) => a.etaAt - b.etaAt);
  S.sort((a, b) => a.etaAt - b.etaAt);
  return { N: N.slice(0, 4), S: S.slice(0, 4) };
}

export function StationSheet() {
  const {
    selectedStationId,
    setSelectedStation,
    arrivals,
    userLocation,
    preferredMaps,
  } = useStore();

  const station = selectedStationId ? STATION_BY_ID.get(selectedStationId) : null;

  const grouped = useMemo(() => {
    if (!station) return { N: [], S: [] };
    const mine = arrivals.filter((a) => a.stationId === station.id);
    return groupByDirection(mine);
  }, [station, arrivals]);

  if (!station) {
    return (
      <BottomSheet open={false} onClose={() => setSelectedStation(null)}>
        <></>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      open={!!selectedStationId}
      onClose={() => setSelectedStation(null)}
      title={station.name}
    >
      <div className="flex flex-wrap gap-1.5 pb-4">
        {station.lines.map((l) => (
          <LineBullet key={l} line={l} size="sm" />
        ))}
        {station.accessible && (
          <span className="ml-2 numerals text-[10px] uppercase tracking-widest text-bone-300 self-center">
            ♿ step-free
          </span>
        )}
      </div>

      <DirectionColumn label="Uptown / Outbound" arrivals={grouped.N} />
      <div className="h-4" />
      <DirectionColumn label="Downtown / Inbound" arrivals={grouped.S} />

      <div className="mt-5">
        <button
          onClick={() =>
            userLocation &&
            openDirections(
              userLocation,
              { lat: station.lat, lng: station.lng },
              preferredMaps
            )
          }
          disabled={!userLocation}
          className="w-full rounded-xl bg-gold text-ink-0 font-semibold py-3 text-sm disabled:opacity-40"
        >
          Walking directions to station
        </button>
      </div>
    </BottomSheet>
  );
}

function DirectionColumn({ label, arrivals }: { label: string; arrivals: Arrival[] }) {
  return (
    <section>
      <h3 className="numerals text-[10px] uppercase tracking-widest text-bone-300 pb-2">
        {label}
      </h3>
      {arrivals.length === 0 ? (
        <p className="text-bone-300 text-sm py-3">No live arrivals in window.</p>
      ) : (
        <ul className="divide-y divide-ink-300">
          {arrivals.map((a) => (
            <li
              key={`${a.tripId}-${a.etaAt}`}
              className="flex items-center justify-between py-3"
            >
              <span className="flex items-center gap-3">
                <LineBullet line={a.line} size="sm" />
                <span className="text-bone-100 text-sm">{a.headsign ?? a.line}</span>
              </span>
              <span className="flex items-baseline gap-1">
                <span className="numerals text-bone-0 text-lg">
                  {etaMinutesOnly(a.etaSec)}
                </span>
                <span className="numerals text-bone-300 text-xs">
                  {a.etaSec <= 60 ? formatEta(a.etaSec) : "min"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
