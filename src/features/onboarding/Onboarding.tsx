import { useEffect, useState } from "react";

const KEY = "pulse-seen-onboarding";

// One-screen explainer that shows on first launch only. Deliberately terse —
// the whole PRD thesis is that the rider wants answers, not onboarding.
// (PRD OQ-09 — we opted to include a minimal version.)
export function Onboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(KEY);
      if (!seen) setOpen(true);
    } catch {
      // localStorage blocked — skip
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink-0/95 backdrop-blur flex flex-col items-center justify-center px-8 text-center"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to PULSE"
    >
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-2xl bg-ink-100 border border-ink-300 grid place-items-center">
          <span className="h-10 w-10 rounded-full border-2 border-gold grid place-items-center">
            <span className="h-3.5 w-3.5 rounded-full bg-gold animate-pulsegold" />
          </span>
        </div>
        <span className="numerals font-bold text-gold tracking-tight text-base">
          PULSE
        </span>
      </div>

      <ol className="space-y-5 max-w-sm text-left">
        <Step
          num={1}
          title="One answer, one glance"
          body="We open to your next train. Not a map, not a menu."
        />
        <Step
          num={2}
          title="Swipe up for the live map"
          body="Every station you can reach, tap for arrivals."
        />
        <Step
          num={3}
          title="Search to plan a trip"
          body="Fastest route with transfer hints, plans entirely on your device."
        />
        <Step
          num={4}
          title="Free forever · no account"
          body="No tracking. No ads. Nothing leaves this device unless you share a link."
        />
      </ol>

      <button
        onClick={dismiss}
        className="mt-10 rounded-full bg-gold text-ink-0 px-8 py-3 text-sm font-semibold no-select"
      >
        Let's go
      </button>

      <p className="mt-6 text-[10px] numerals text-bone-300 uppercase tracking-widest">
        NYC MTA · subway live · not affiliated with the MTA
      </p>
    </div>
  );
}

function Step({ num, title, body }: { num: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0 h-7 w-7 rounded-full border border-gold/50 grid place-items-center numerals text-gold-soft text-xs">
        {num}
      </span>
      <div>
        <p className="text-bone-0 text-sm font-medium">{title}</p>
        <p className="text-bone-300 text-xs mt-0.5">{body}</p>
      </div>
    </li>
  );
}
