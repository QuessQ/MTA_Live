import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LatLng } from "@/lib/geo";
import type { TransitMode } from "@/data/lines";
import type { Arrival } from "@/data/gtfs-rt/client";
import { fetchAllFeeds } from "@/data/gtfs-rt/client";
import type { Route } from "@/features/routing/planner";
import { planRoute } from "@/features/routing/planner";

export type View = "answer" | "map";

export type FeedStatus = "idle" | "loading" | "ok" | "stale" | "error";

interface PersistedPrefs {
  modes: Record<TransitMode, boolean>;
  preferredMaps: "apple" | "google" | "auto";
  favorites: string[]; // station ids
  reducedMotion: boolean;
}

interface EphemeralState {
  view: View;
  userLocation: LatLng | null;
  selectedStationId: string | null;
  originStationId: string | null; // for routing; null = infer from location
  destinationStationId: string | null;
  route: Route | null;
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
  setReducedMotion: (v: boolean) => void;
  toggleFavorite: (stationId: string) => void;
  clearAllLocalData: () => void;

  setOriginStation: (id: string | null) => void;
  setDestinationStation: (id: string | null) => void;
  clearRoute: () => void;

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
      favorites: [],
      reducedMotion: false,

      // ephemeral
      view: "answer",
      userLocation: null,
      selectedStationId: null,
      originStationId: null,
      destinationStationId: null,
      route: null,
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
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      toggleFavorite: (stationId) =>
        set((s) => ({
          favorites: s.favorites.includes(stationId)
            ? s.favorites.filter((id) => id !== stationId)
            : [...s.favorites, stationId],
        })),
      clearAllLocalData: () => {
        try {
          localStorage.removeItem("pulse-prefs");
        } catch {
          // ignore
        }
        set({
          modes: defaultModes,
          preferredMaps: "auto",
          favorites: [],
          reducedMotion: false,
          originStationId: null,
          destinationStationId: null,
          route: null,
          selectedStationId: null,
        });
      },

      setOriginStation: (id) => {
        const dest = get().destinationStationId;
        const origin = id;
        const route = origin && dest ? planRoute(origin, dest) : null;
        set({ originStationId: origin, route });
      },
      setDestinationStation: (id) => {
        const origin = get().originStationId;
        const route = origin && id ? planRoute(origin, id) : null;
        set({ destinationStationId: id, route });
      },
      clearRoute: () =>
        set({ originStationId: null, destinationStationId: null, route: null }),

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
        favorites: s.favorites,
        reducedMotion: s.reducedMotion,
      }),
    }
  )
);
