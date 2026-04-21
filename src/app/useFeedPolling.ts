import { useEffect } from "react";
import { useStore } from "@/store";

const ARRIVALS_MS = 15_000;
const ALERTS_MS = 60_000;

// Polls MTA feeds while the document is visible. Arrivals every 15s,
// alerts every 60s. Backs off when backgrounded (PRD NFR-11 / §10.11).
export function useFeedPolling() {
  const refresh = useStore((s) => s.refreshFeeds);
  const refreshAlerts = useStore((s) => s.refreshAlerts);

  useEffect(() => {
    let cancelled = false;
    const arrivalsTick = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      refresh();
    };
    const alertsTick = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      refreshAlerts();
    };

    arrivalsTick();
    alertsTick();
    const aId = window.setInterval(arrivalsTick, ARRIVALS_MS);
    const alId = window.setInterval(alertsTick, ALERTS_MS);

    const onVis = () => {
      if (document.visibilityState === "visible") {
        refresh();
        refreshAlerts();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(aId);
      window.clearInterval(alId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh, refreshAlerts]);
}
