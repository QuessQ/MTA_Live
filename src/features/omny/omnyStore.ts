// Local-only OMNY fare companion (PRD §6.10).
// We never talk to any OMNY account — there's no public API for that.
// The rider manually taps "I tapped in" when they board; we run a local
// 2-hour free-transfer countdown and track the rolling 7-day weekly cap.
// Every byte stays in localStorage. Off by default.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const TRANSFER_WINDOW_MS = 2 * 60 * 60 * 1000;
const WEEKLY_CAP_CENTS = 3400; // $34.00 (NYC subway weekly cap)
const FARE_CENTS = 290; // $2.90 per-tap
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface OmnyTap {
  at: number; // unix ms
  paid: boolean; // false if counted as free transfer or past weekly cap
  centsCharged: number; // actual cents charged (0, or FARE_CENTS)
}

interface OmnyState {
  enabled: boolean;
  taps: OmnyTap[];

  enable: (on: boolean) => void;
  tapIn: () => void;
  undoLast: () => void;
  clear: () => void;
}

function chargeFor(taps: OmnyTap[], now: number): { paid: boolean; cents: number } {
  const last = taps[taps.length - 1];
  // Free transfer if within 2 h of the prior paid tap.
  if (last && last.paid && now - last.at <= TRANSFER_WINDOW_MS) {
    return { paid: false, cents: 0 };
  }
  // Capped if total paid cents in last 7 d has reached the weekly cap.
  const sinceCutoff = now - WINDOW_MS;
  const weeklyPaid = taps
    .filter((t) => t.at >= sinceCutoff && t.paid)
    .reduce((s, t) => s + t.centsCharged, 0);
  if (weeklyPaid >= WEEKLY_CAP_CENTS) {
    return { paid: false, cents: 0 };
  }
  return { paid: true, cents: FARE_CENTS };
}

export const useOmny = create<OmnyState>()(
  persist(
    (set, get) => ({
      enabled: false,
      taps: [],
      enable: (enabled) => set({ enabled }),
      tapIn: () => {
        const now = Date.now();
        const { taps } = get();
        const { paid, cents } = chargeFor(taps, now);
        set({
          taps: [...taps, { at: now, paid, centsCharged: cents }].slice(-200),
        });
      },
      undoLast: () => {
        const t = get().taps.slice(0, -1);
        set({ taps: t });
      },
      clear: () => set({ taps: [] }),
    }),
    {
      name: "pulse-omny",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const OMNY = {
  TRANSFER_WINDOW_MS,
  WEEKLY_CAP_CENTS,
  FARE_CENTS,
  WINDOW_MS,
};

export function omnyStatus(taps: OmnyTap[], nowMs = Date.now()) {
  const lastPaid = [...taps].reverse().find((t) => t.paid);
  const transferWindowEnd = lastPaid ? lastPaid.at + TRANSFER_WINDOW_MS : null;
  const transferRemainingMs = transferWindowEnd
    ? Math.max(0, transferWindowEnd - nowMs)
    : 0;
  const sinceCutoff = nowMs - WINDOW_MS;
  const weeklyPaidCents = taps
    .filter((t) => t.at >= sinceCutoff && t.paid)
    .reduce((s, t) => s + t.centsCharged, 0);
  return {
    lastTapAt: taps.at(-1)?.at ?? null,
    inTransferWindow: transferRemainingMs > 0,
    transferRemainingMs,
    weeklyPaidCents,
    capReached: weeklyPaidCents >= WEEKLY_CAP_CENTS,
    remainingToCapCents: Math.max(0, WEEKLY_CAP_CENTS - weeklyPaidCents),
  };
}
