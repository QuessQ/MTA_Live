import { useEffect, useState } from "react";
import { useOmny, omnyStatus, OMNY } from "./omnyStore";

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatMinSec(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function OmnyCard() {
  const { enabled, taps, tapIn, undoLast } = useOmny();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const status = omnyStatus(taps);

  return (
    <section className="mt-5 rounded-2xl border border-ink-300 bg-ink-100 px-4 py-3">
      <header className="flex items-center justify-between pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] numerals uppercase tracking-widest text-bone-300">
            OMNY
          </span>
          <span className="text-[10px] text-bone-300 numerals">
            {status.capReached
              ? "Capped · rides are free"
              : `${formatMoney(status.remainingToCapCents)} to weekly cap`}
          </span>
        </div>
        {taps.length > 0 && (
          <button
            onClick={undoLast}
            className="text-[10px] numerals uppercase tracking-widest text-bone-300 hover:text-bone-0"
          >
            Undo
          </button>
        )}
      </header>

      {status.inTransferWindow ? (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] numerals text-gold-soft uppercase tracking-widest">
              Free transfer window
            </p>
            <p className="numerals text-gold text-3xl font-bold leading-none mt-1">
              {formatMinSec(status.transferRemainingMs)}
            </p>
          </div>
          <button
            onClick={tapIn}
            className="rounded-lg border border-gold/60 text-gold-soft hover:bg-gold/10 px-3 py-2 text-xs numerals uppercase tracking-widest"
          >
            Tap in
          </button>
        </div>
      ) : (
        <button
          onClick={tapIn}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold ${
            status.capReached
              ? "bg-emerald-400/10 border border-emerald-400/40 text-emerald-200"
              : "bg-gold text-ink-0"
          }`}
        >
          {status.capReached ? "Free ride" : `Tap in · ${formatMoney(OMNY.FARE_CENTS)}`}
        </button>
      )}
    </section>
  );
}
