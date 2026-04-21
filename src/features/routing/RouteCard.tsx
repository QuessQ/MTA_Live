import { useStore } from "@/store";
import { STATION_BY_ID } from "@/data/stations";
import { LineBullet } from "@/ui/LineBullet";
import { ShareEtaButton } from "@/features/share-eta/ShareEtaButton";
import { hintFor, carPositionLabel } from "@/data/boarding";

export function RouteCard() {
  const { route, clearRoute, destinationStationId, originStationId } = useStore();

  if (!route || !originStationId || !destinationStationId) return null;

  const origin = STATION_BY_ID.get(originStationId);
  const dest = STATION_BY_ID.get(destinationStationId);
  if (!origin || !dest) return null;

  const totalMin = Math.max(1, Math.round(route.totalSeconds / 60));

  return (
    <section className="rounded-2xl border border-gold/40 bg-ink-100/90 p-4 mt-4 shadow-glow">
      <header className="flex items-start justify-between pb-2">
        <div>
          <p className="text-[10px] numerals uppercase tracking-widest text-gold-soft">
            Route · {route.transfers === 0 ? "Direct" : `${route.transfers} transfer${route.transfers > 1 ? "s" : ""}`}
          </p>
          <p className="text-bone-0 text-sm mt-1">
            {origin.name} <span className="text-bone-300">→</span> {dest.name}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span className="numerals text-gold text-3xl font-bold leading-none">
              {totalMin}
            </span>
            <span className="numerals text-bone-200 text-xs">min</span>
          </div>
          <button
            onClick={clearRoute}
            className="text-[10px] numerals uppercase tracking-widest text-bone-300 mt-1 hover:text-bone-0"
          >
            Clear
          </button>
        </div>
      </header>

      <ShareEtaButton />

      <ol className="mt-3 space-y-2">
        {route.legs.map((leg, i) => {
          const from = STATION_BY_ID.get(leg.from);
          const to = STATION_BY_ID.get(leg.to);
          if (!from || !to) return null;
          const min = Math.max(1, Math.round(leg.seconds / 60));
          const hint = hintFor(leg.from, leg.to);
          return (
            <li
              key={i}
              className="rounded-lg bg-ink-200/60 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <LineBullet line={leg.line} size="sm" />
                <span className="flex-1 text-bone-100 text-xs">
                  {from.name} → {to.name}
                  {leg.stops.length > 2 && (
                    <span className="text-bone-300 numerals ml-1">
                      · {leg.stops.length - 1} stops
                    </span>
                  )}
                </span>
                <span className="numerals text-bone-0 text-xs">{min}m</span>
              </div>
              {hint && (
                <p className="mt-1.5 pl-8 text-[11px] text-gold-soft/90">
                  ↳ {carPositionLabel(hint.carsFromFront)}
                  {hint.note ? ` · ${hint.note}` : ""}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
