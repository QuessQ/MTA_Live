import { useEffect, useMemo, useRef, useState } from "react";
import { STATIONS, type Station } from "@/data/stations";
import { LineBullet } from "@/ui/LineBullet";

interface Props {
  value: string | null;
  placeholder?: string;
  label?: string;
  onPick: (stationId: string | null) => void;
}

export function DestinationSearch({ value, onPick, placeholder, label }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = value ? STATIONS.find((s) => s.id === value) ?? null : null;

  useEffect(() => {
    if (selected && !open) setQuery(selected.name);
    if (!selected && !open) setQuery("");
  }, [selected, open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIONS.slice(0, 8);
    return STATIONS.filter((s) =>
      s.name.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  return (
    <div className="relative">
      {label && (
        <label className="block text-[10px] numerals uppercase tracking-widest text-bone-300 pb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder ?? "Search stations…"}
          inputMode="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so a click on a result fires before we close.
            setTimeout(() => setOpen(false), 120);
          }}
          className="w-full rounded-xl bg-ink-100 border border-ink-300 focus:border-gold/60 px-4 py-3 text-bone-0 placeholder:text-bone-300 outline-none text-sm numerals"
        />
        {selected && !open && (
          <button
            onClick={() => {
              onPick(null);
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-bone-300 hover:text-bone-0 text-xs numerals"
            aria-label="Clear destination"
          >
            ×
          </button>
        )}
      </div>
      {open && matches.length > 0 && (
        <ul
          className="absolute z-30 mt-1 w-full rounded-xl bg-ink-100 border border-ink-300 max-h-64 overflow-y-auto shadow-xl"
          role="listbox"
        >
          {matches.map((s) => (
            <Result key={s.id} station={s} onPick={(id) => {
              onPick(id);
              setOpen(false);
            }} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Result({ station, onPick }: { station: Station; onPick: (id: string) => void }) {
  return (
    <li>
      <button
        onMouseDown={(e) => {
          // mousedown so onBlur doesn't cancel us
          e.preventDefault();
          onPick(station.id);
        }}
        className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-ink-200"
      >
        <span className="text-bone-0 text-sm">{station.name}</span>
        <span className="flex gap-1">
          {station.lines.slice(0, 4).map((l) => (
            <LineBullet key={l} line={l} size="sm" />
          ))}
        </span>
      </button>
    </li>
  );
}
