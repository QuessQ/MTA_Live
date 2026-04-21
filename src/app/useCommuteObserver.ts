import { useEffect } from "react";
import { useStore } from "@/store";
import { STATIONS } from "@/data/stations";
import { nearestFrom } from "@/lib/geo";
import { observe } from "@/features/commute/observations";

// Records the nearest station once per session-launch and every 10 minutes
// thereafter while the app is foregrounded. Observation log is local-only
// (IndexedDB); see PRD §8.3.
export function useCommuteObserver() {
  const userLocation = useStore((s) => s.userLocation);

  useEffect(() => {
    if (!userLocation) return;
    const near = nearestFrom(userLocation, STATIONS);
    if (!near) return;
    observe(near.item.id).catch(() => {
      // best-effort; ignore write failures
    });
  }, [userLocation]);
}
