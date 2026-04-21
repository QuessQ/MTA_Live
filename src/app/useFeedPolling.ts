import { useEffect } from "react";
import { useStore } from "@/store";

const POLL_MS = 15_000;

// Polls MTA feeds every 15s while the document is visible. Backs off when
// backgrounded (PRD NFR-11 / §10.11).
export function useFeedPolling() {
  const refresh = useStore((s) => s.refreshFeeds);

  useEffect(() => {
    let id: number | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      refresh();
    };

    tick();
    id = window.setInterval(tick, POLL_MS);

    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      if (id != null) window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);
}
