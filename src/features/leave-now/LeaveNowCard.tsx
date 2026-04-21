import { useEffect, useRef, useState } from "react";
import { vibrate } from "@/lib/platform";
import { LineBullet } from "@/ui/LineBullet";
import type { Arrival } from "@/data/gtfs-rt/client";

interface Props {
  arrival: Arrival | null;
  walkSeconds: number;
  stationName: string;
}

// The leave-now nudge fires when the rider's walk time is within a ±30s
// window of the arrival's ETA. We recompute every second so the countdown
// is live; we only haptic-tick once per arrival so we don't nag.
export function LeaveNowCard({ arrival, walkSeconds, stationName }: Props) {
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const vibratedFor = useRef<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      1000
    );
    return () => window.clearInterval(id);
  }, []);

  if (!arrival) return null;
  const etaSec = Math.round(arrival.etaAt / 1000) - nowSec;
  const leaveIn = etaSec - walkSeconds;

  const inWindow = leaveIn >= -30 && leaveIn <= 90;
  if (!inWindow) return null;

  // Fire haptic once per trip as the window opens.
  const key = `${arrival.tripId}-${arrival.etaAt}`;
  if (vibratedFor.current !== key && leaveIn >= 0 && leaveIn <= 60) {
    vibratedFor.current = key;
    vibrate([40, 20, 40]);
  }

  const display =
    leaveIn <= 0
      ? "Leave now"
      : leaveIn < 60
        ? `Leave in ${leaveIn}s`
        : `Leave in ${Math.round(leaveIn / 60)}m`;

  const urgency = leaveIn <= 0 ? "urgent" : leaveIn < 30 ? "soon" : "queued";

  return (
    <section
      className={`mt-4 rounded-2xl border p-4 relative overflow-hidden ${
        urgency === "urgent"
          ? "border-gold/80 bg-gold/10 animate-pulsegold"
          : urgency === "soon"
            ? "border-gold/60 bg-ink-100"
            : "border-ink-300 bg-ink-100"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] numerals uppercase tracking-widest text-gold-soft">
            Nudge
          </p>
          <p
            className={`numerals font-bold mt-1 ${
              urgency === "urgent" ? "text-gold text-3xl" : "text-bone-0 text-2xl"
            }`}
          >
            {display}
          </p>
          <p className="text-bone-300 text-xs mt-1">
            to catch the {arrival.line} at {stationName}
          </p>
        </div>
        <LineBullet line={arrival.line} size="lg" />
      </div>
    </section>
  );
}
