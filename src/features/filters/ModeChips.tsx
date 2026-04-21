import { useStore } from "@/store";
import { modeLabel, type TransitMode } from "@/data/lines";

const MODES: TransitMode[] = ["subway", "bus", "lirr", "mnr", "sir"];

export function ModeChips() {
  const { modes, toggleMode } = useStore();

  return (
    <div
      className="absolute inset-x-0 top-0 z-20 flex gap-2 overflow-x-auto px-4 py-3 no-select"
      style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}
    >
      {MODES.map((m) => {
        const active = modes[m];
        return (
          <button
            key={m}
            onClick={() => toggleMode(m)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              active
                ? "bg-gold/15 border-gold/60 text-gold-soft"
                : "bg-ink-50/80 border-ink-300 text-bone-300 hover:border-ink-400"
            }`}
            aria-pressed={active}
          >
            {modeLabel[m]}
          </button>
        );
      })}
    </div>
  );
}
