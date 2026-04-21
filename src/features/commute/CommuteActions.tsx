import { useMemo } from "react";
import { useStore } from "@/store";
import { useCommute } from "./commuteStore";
import { STATION_BY_ID } from "@/data/stations";

// "→ Work" in the morning, "→ Home" in the evening. During the midday gap
// we show both for quick access. Each button pre-fills origin + destination
// and flips to Map view.
export function CommuteActions() {
  const { commutes } = useCommute();
  const { setOriginStation, setDestinationStation, setView } = useStore();

  const now = new Date();
  const hr = now.getHours();
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

  const actions = useMemo(() => {
    if (commutes.length === 0) return [];
    const morning = isWeekday && hr >= 5 && hr <= 11;
    const evening = isWeekday && hr >= 15 && hr <= 22;
    return commutes.flatMap((c) => {
      const home = STATION_BY_ID.get(c.home);
      const work = STATION_BY_ID.get(c.work);
      if (!home || !work) return [];
      const out: { label: string; origin: string; dest: string }[] = [];
      if (morning || !evening) out.push({ label: `→ ${work.name}`, origin: c.home, dest: c.work });
      if (evening || !morning) out.push({ label: `→ ${home.name}`, origin: c.work, dest: c.home });
      return out;
    });
  }, [commutes, hr, isWeekday]);

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-select -mx-6 px-6 pb-3 pt-1">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => {
            setOriginStation(a.origin);
            setDestinationStation(a.dest);
            setView("map");
          }}
          className="shrink-0 rounded-full border border-gold/50 text-gold-soft hover:bg-gold/10 px-4 py-1.5 text-xs numerals"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
