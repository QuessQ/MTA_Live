import { lazy, Suspense, useRef } from "react";
import { useStore } from "@/store";
import { AnswerMode } from "@/features/answer/AnswerMode";
import { ModeChips } from "@/features/filters/ModeChips";
import { StationSheet } from "@/features/arrivals/StationSheet";

// MapLibre is heavy (~700 KB). Defer it until the rider asks for the map.
const MapView = lazy(() =>
  import("@/features/map/MapView").then((m) => ({ default: m.MapView }))
);

const SWIPE_THRESHOLD = 64;

export function Shell() {
  const { view, setView } = useStore();
  const touchStart = useRef<{ y: number; t: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStart.current = { y: e.touches[0].clientY, t: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const endY = e.changedTouches[0]?.clientY ?? start.y;
    const dy = endY - start.y;
    const dt = Date.now() - start.t;
    // Fast flicks also count, even below threshold.
    const fastFlick = dt < 300 && Math.abs(dy) > 30;

    if (view === "answer" && (dy < -SWIPE_THRESHOLD || (fastFlick && dy < 0))) {
      setView("map");
    } else if (view === "map" && (dy > SWIPE_THRESHOLD || (fastFlick && dy > 0))) {
      setView("answer");
    }
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-ink-0"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Two stacked panels; we translate the inner container to switch. */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: view === "map" ? "translateY(-100%)" : "translateY(0)",
        }}
      >
        <section className="absolute inset-0">
          <AnswerMode />
        </section>
        <section className="absolute left-0 top-full h-full w-full">
          <Suspense
            fallback={
              <div className="h-full w-full grid place-items-center text-bone-300 text-sm">
                Loading map…
              </div>
            }
          >
            {view === "map" && <MapView />}
          </Suspense>
          <ModeChips />
          <button
            onClick={() => setView("answer")}
            className="absolute left-1/2 -translate-x-1/2 bottom-[calc(var(--safe-bottom)+12px)] z-20 rounded-full bg-ink-100/90 border border-ink-300 px-4 py-2 text-xs text-bone-200 no-select backdrop-blur"
            aria-label="Back to Answer Mode"
          >
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
                <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Answer
            </span>
          </button>
        </section>
      </div>

      <StationSheet />
    </div>
  );
}
