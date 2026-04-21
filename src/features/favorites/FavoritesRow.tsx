import { useStore } from "@/store";
import { STATION_BY_ID } from "@/data/stations";
import { LineBullet } from "@/ui/LineBullet";

export function FavoritesRow() {
  const { favorites, setSelectedStation, arrivals } = useStore();
  if (favorites.length === 0) return null;

  return (
    <section className="mt-5">
      <p className="text-[10px] numerals tracking-widest text-bone-300 uppercase pb-2">
        Favorites
      </p>
      <div className="flex gap-2 overflow-x-auto no-select -mx-6 px-6 pb-1">
        {favorites.map((id) => {
          const station = STATION_BY_ID.get(id);
          if (!station) return null;
          const next = arrivals.find((a) => a.stationId === id);
          return (
            <button
              key={id}
              onClick={() => setSelectedStation(id)}
              className="shrink-0 w-40 rounded-xl bg-ink-100 border border-ink-300 px-3 py-3 text-left hover:bg-ink-200 transition-colors"
            >
              <div className="flex items-center gap-1.5 pb-1.5">
                {station.lines.slice(0, 3).map((l) => (
                  <LineBullet key={l} line={l} size="sm" />
                ))}
              </div>
              <p className="text-bone-0 text-xs font-medium line-clamp-1">
                {station.name}
              </p>
              {next && (
                <p className="numerals text-gold-soft text-[11px] mt-1">
                  {Math.max(1, Math.round(next.etaSec / 60))} min
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
