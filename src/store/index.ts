import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LatLng } from "@/lib/geo";
import type { TransitMode } from "@/data/lines";
import type { Arrival } from "@/data/gtfs-rt/client";
import { fetchAllFeeds } from "@/data/gtfs-rt/client";
import type { Route } from "@/features/routing/planner";
import { planRoute } from "@/features/routing/planner";
import type { Alert } from "@/data/gtfs-rt/alerts";
import { fetchAlerts } from "@/data/gtfs-rt/alerts";

export type View = "answer" | "map";

export type FeedStatus = "idle" | "loading" | "ok" | "stale" | "error";

interface PersistedPrefs {
  modes: Record<TransitMode, boolean>;
  preferredMaps: "apple" | "google" | "auto";
  favorites: string[]; // station ids
  reducedMotion: boolean;
  stepFree: boolean;
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
  alerts: Alert[];
  alertsFetchedAt: number | null;
}

interface Actions {
  setView: (v: View) => void;
  setSelectedStation: (id: string | null) => void;
  setUserLocation: (loc: LatLng | null) => void;
  toggleMode: (m: TransitMode) => void;
  setPreferredMaps: (p: PersistedPrefs["preferredMaps"]) => void;
  setReducedMotion: (v: boolean) => void;
  setStepFree: (v: boolean) => void;
  toggleFavorite: (stationId: string) => void;
  clearAllLocalData: () => void;

  setOriginStation: (id: string | null) => void;
  setDestinationStation: (id: string | null) => void;
  clearRoute: () => void;

  refreshFeeds: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
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
      stepFree: false,

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
      alerts: [],
      alertsFetchedAt: null,

      setView: (view) => set({ view }),
      setSelectedStation: (selectedStationId) =>
        set({ selectedStationId, view: selectedStationId ? "map" : get().view }),
      setUserLocation: (userLocation) => set({ userLocation }),
      toggleMode: (m) =>
        set((s) => ({ modes: { ...s.modes, [m]: !s.modes[m] } })),
      setPreferredMaps: (preferredMaps) => set({ preferredMaps }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setStepFree: (stepFree) => {
        set({ stepFree });
        // Recompute active route with new filter.
        const s = get();
        if (s.originStationId && s.destinationStationId) {
          const route = planRoute(s.originStationId, s.destinationStationId, {
            stepFree,
          });
          set({ route });
        }
      },
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
          stepFree: false,
          originStationId: null,
          destinationStationId: null,
          route: null,
          selectedStationId: null,
        });
      },

      setOriginStation: (id) => {
        const { destinationStationId: dest, stepFree } = get();
        const route = id && dest ? planRoute(id, dest, { stepFree }) : null;
        set({ originStationId: id, route });
      },
      setDestinationStation: (id) => {
        const { originStationId: origin, stepFree } = get();
        const route = origin && id ? planRoute(origin, id, { stepFree }) : null;
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

      refreshAlerts: async () => {
        try {
          const alerts = await fetchAlerts();
          set({
            alerts: alerts.filter((a) => a.activeNow),
            alertsFetchedAt: Date.now(),
          });
        } catch {
          // alerts are non-critical; swallow and keep prior snapshot
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
        stepFree: s.stepFree,
      }),
    }
  )
);
