import { useState } from "react";
import { BottomSheet } from "@/ui/BottomSheet";
import { DestinationSearch } from "./DestinationSearch";
import { useStore } from "@/store";
import { STATIONS } from "@/data/stations";
import { nearestFrom } from "@/lib/geo";

// Floating search trigger on the map. Opens a bottom sheet with the same
// destination search UI as Answer Mode, so the rider can plan a trip
// without going back to Answer Mode first.
export function MapSearchFAB() {
  const [open, setOpen] = useState(false);
  const {
    destinationStationId,
    setDestinationStation,
    setOriginStation,
    originStationId,
    userLocation,
  } = useStore();

  const handlePick = (id: string | null) => {
    if (id && !originStationId && userLocation) {
      const near = nearestFrom(userLocation, STATIONS);
      if (near) setOriginStation(near.item.id);
    }
    setDestinationStation(id);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute left-4 bottom-[calc(var(--safe-bottom)+12px)] z-20 rounded-full bg-ink-100/90 border border-ink-300 px-4 py-2 text-xs text-bone-200 no-select backdrop-blur flex items-center gap-2"
        aria-label="Plan a trip"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <span>Plan a trip</span>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Plan a trip">
        <div className="space-y-3 pt-2">
          <DestinationSearch
            value={destinationStationId}
            label="Destination"
            placeholder="Where to?"
            onPick={handlePick}
          />
          <p className="text-bone-300 text-[11px] numerals">
            Origin: {originStationId ? "selected" : "will use your nearest station"}
          </p>
        </div>
      </BottomSheet>
    </>
  );
}
