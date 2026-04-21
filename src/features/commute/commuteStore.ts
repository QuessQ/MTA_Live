import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface SavedCommute {
  id: string;
  home: string; // station id
  work: string; // station id
  createdAt: number;
}

interface CommuteState {
  commutes: SavedCommute[];
  dismissedSuggestionIds: string[]; // so we don't keep asking
  add: (home: string, work: string) => void;
  remove: (id: string) => void;
  dismissSuggestion: (key: string) => void;
  clear: () => void;
}

export const useCommute = create<CommuteState>()(
  persist(
    (set) => ({
      commutes: [],
      dismissedSuggestionIds: [],
      add: (home, work) =>
        set((s) => {
          const id = `${home}__${work}`;
          if (s.commutes.some((c) => c.id === id)) return s;
          return {
            commutes: [
              ...s.commutes,
              { id, home, work, createdAt: Date.now() },
            ],
          };
        }),
      remove: (id) =>
        set((s) => ({ commutes: s.commutes.filter((c) => c.id !== id) })),
      dismissSuggestion: (key) =>
        set((s) => ({
          dismissedSuggestionIds: [...s.dismissedSuggestionIds, key],
        })),
      clear: () => set({ commutes: [], dismissedSuggestionIds: [] }),
    }),
    {
      name: "pulse-commutes",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
