import { useEffect, useState } from "react";
import { readAll } from "./observations";
import { inferCommutes } from "./infer";
import { useCommute } from "./commuteStore";
import { STATION_BY_ID } from "@/data/stations";

// Polls the observation log every minute. When inference produces both a
// morning and evening station and that pair hasn't already been saved or
// dismissed, we show a non-intrusive prompt.
export function CommuteSuggestion() {
  const { commutes, dismissedSuggestionIds, add, dismissSuggestion } = useCommute();
  const [suggestion, setSuggestion] = useState<
    { home: string; work: string; key: string } | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const obs = await readAll();
      const inferred = inferCommutes(obs);
      const morning = inferred.find((i) => i.band === "morning");
      const evening = inferred.find((i) => i.band === "evening");
      if (!morning || !evening || morning.stationId === evening.stationId) {
        if (!cancelled) setSuggestion(null);
        return;
      }
      const key = `${morning.stationId}__${evening.stationId}`;
      const alreadyKnown = commutes.some(
        (c) => c.home === morning.stationId && c.work === evening.stationId
      );
      if (alreadyKnown || dismissedSuggestionIds.includes(key)) {
        if (!cancelled) setSuggestion(null);
        return;
      }
      if (!cancelled) {
        setSuggestion({ home: morning.stationId, work: evening.stationId, key });
      }
    };
    run();
    const id = window.setInterval(run, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [commutes, dismissedSuggestionIds]);

  if (!suggestion) return null;
  const home = STATION_BY_ID.get(suggestion.home);
  const work = STATION_BY_ID.get(suggestion.work);
  if (!home || !work) return null;

  return (
    <section className="mt-4 rounded-2xl border border-gold/40 bg-ink-100 p-4">
      <p className="text-[10px] numerals uppercase tracking-widest text-gold-soft">
        Looks like a commute
      </p>
      <p className="text-bone-0 text-sm mt-1">
        Morning: <span className="font-medium">{home.name}</span> → Evening:{" "}
        <span className="font-medium">{work.name}</span>
      </p>
      <p className="text-bone-300 text-xs mt-1">
        Learned locally from your launches. Nothing sent off-device.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            add(suggestion.home, suggestion.work);
            setSuggestion(null);
          }}
          className="rounded-lg bg-gold text-ink-0 text-xs font-semibold py-2.5"
        >
          Save commute
        </button>
        <button
          onClick={() => {
            dismissSuggestion(suggestion.key);
            setSuggestion(null);
          }}
          className="rounded-lg border border-ink-300 text-bone-200 hover:bg-ink-200 text-xs py-2.5"
        >
          Not a commute
        </button>
      </div>
    </section>
  );
}
