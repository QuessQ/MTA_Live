import { useEffect, useState } from "react";
import { STATION_BY_ID } from "@/data/stations";
import { planRoute } from "@/features/routing/planner";
import { LineBullet } from "@/ui/LineBullet";
import type { SharePayload } from "./codec";
import { clearIncoming } from "./codec";

const GRACE_MS = 2 * 60 * 60 * 1000;

interface Props {
  payload: SharePayload;
  onDismiss: () => void;
}

export function RecipientView({ payload, onDismiss }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const origin = STATION_BY_ID.get(payload.o);
  const dest = STATION_BY_ID.get(payload.d);
  const route = origin && dest ? planRoute(payload.o, payload.d) : null;

  const arriveAt = payload.t + (route?.totalSeconds ?? 0) * 1000;
  const remainingMs = arriveAt - now;
  const expired = now > arriveAt + GRACE_MS;

  const who = payload.n?.slice(0, 24) || "Your rider";
  const arriveMin = Math.max(0, Math.round(remainingMs / 60_000));

  return (
    <section
      className="flex h-full flex-col px-6"
      style={{ paddingTop: "calc(var(--safe-top) + 16px)" }}
    >
      <header className="flex items-center justify-between pb-6 no-select">
        <span className="numerals font-bold text-gold tracking-tight text-sm">PULSE</span>
        <button
          onClick={() => {
            clearIncoming();
            onDismiss();
          }}
          className="text-[10px] numerals uppercase tracking-widest text-bone-300 hover:text-bone-0 h-11 px-3"
        >
          Exit
        </button>
      </header>

      <p className="text-[10px] numerals uppercase tracking-widest text-bone-300">
        Live ETA · shared link
      </p>
      <p className="text-bone-0 text-xl mt-1">{who} is on the way</p>

      {expired ? (
        <div className="mt-10 rounded-2xl border border-ink-300 bg-ink-100 p-6">
          <p className="text-bone-300 text-sm">This share has expired.</p>
        </div>
      ) : !origin || !dest || !route ? (
        <div className="mt-10 rounded-2xl border border-red-400/40 bg-red-500/10 p-6">
          <p className="text-red-300 text-sm">
            Can't reconstruct this route. The link may be from a newer version
            of PULSE, or the station isn't in this build's graph.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex items-end gap-3">
            <span className="numerals font-bold text-gold leading-none text-hero">
              {arriveMin}
            </span>
            <span className="numerals text-bone-200 pb-3 text-xl">min away</span>
          </div>
          <p className="text-bone-0 text-base mt-2">
            Arriving at {dest.name}
          </p>
          <p className="text-bone-300 text-sm mt-1">
            Started from {origin.name} at{" "}
            {new Date(payload.t).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>

          <ol className="mt-6 space-y-2">
            {route.legs.map((leg, i) => {
              const from = STATION_BY_ID.get(leg.from);
              const to = STATION_BY_ID.get(leg.to);
              if (!from || !to) return null;
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-ink-100 border border-ink-300 px-3 py-2"
                >
                  <LineBullet line={leg.line} size="sm" />
                  <span className="flex-1 text-bone-100 text-xs">
                    {from.name} → {to.name}
                  </span>
                  <span className="numerals text-bone-0 text-xs">
                    {Math.max(1, Math.round(leg.seconds / 60))}m
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <footer className="mt-auto py-4 text-[10px] numerals text-bone-300 uppercase tracking-widest">
        Self-contained link · no server tracks this ride
      </footer>
    </section>
  );
}
