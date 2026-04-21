import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LatLng } from "@/lib/geo";
import type { TransitMode } from "@/data/lines";
import type { Arrival } from "@/data/gtfs-rt/client";
import { fetchAllFeeds } from "@/data/gtfs-rt/client";

export type View = "answer" | "map";

export type FeedStatus = "idle" | "loading" | "ok" | "stale" | "error";

interface PersistedPrefs {
  modes: Record<TransitMode, boolean>;
  preferredMaps: "apple" | "google" | "auto";
}

interface EphemeralState {
  view: View;
  userLocation: LatLng | null;
  selectedStationId: string | null;
  arrivals: Arrival[];
  arrivalsFetchedAt: number | null;
  feedStatus: FeedStatus;
  feedErrors: string[];
}

interface Actions {
  setView: (v: View) => void;
  setSelectedStation: (id: string | null) => void;
  setUserLocation: (loc: LatLng | null) => void;
  toggleMode: (m: TransitMode) => void;
  setPreferredMaps: (p: PersistedPrefs["preferredMaps"]) => void;
  refreshFeeds: () => Promise<void>;
}

type Store = PersistedPrefs & EphemeralState & Actions;

const defaultModes: Record<TransitMode, boolean> = {
  subway: true,
  bus: true,
  lirr: true,
  mnr: true,
  sir: true,
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // persisted
      modes: defaultModes,
      preferredMaps: "auto",

      // ephemeral
      view: "answer",
      userLocation: null,
      selectedStationId: null,
      arrivals: [],
      arrivalsFetchedAt: null,
      feedStatus: "idle",
      feedErrors: [],

      setView: (view) => set({ view }),
      setSelectedStation: (selectedStationId) =>
        set({ selectedStationId, view: selectedStationId ? "map" : get().view }),
      setUserLocation: (userLocation) => set({ userLocation }),
      toggleMode: (m) =>
        set((s) => ({ modes: { ...s.modes, [m]: !s.modes[m] } })),
      setPreferredMaps: (preferredMaps) => set({ preferredMaps }),

      refreshFeeds: async () => {
        set({ feedStatus: "loading" });
        try {
          const snap = await fetchAllFeeds();
          set({
            arrivals: snap.arrivals,
            arrivalsFetchedAt: snap.fetchedAt,
            feedErrors: snap.errors,
            feedStatus: snap.errors.length > 0 && snap.arrivals.length === 0
              ? "error"
              : snap.errors.length > 0
                ? "stale"
                : "ok",
          });
        } catch (err) {
          set({
            feedStatus: "error",
            feedErrors: [String(err)],
          });
        }
      },
    }),
    {
      name: "pulse-prefs",
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedPrefs => ({
        modes: s.modes,
        preferredMaps: s.preferredMaps,
      }),
    }
  )
);
