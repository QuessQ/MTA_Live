import { useEffect, useState } from "react";
import { stalenessLabel } from "@/lib/time";
import { useStore } from "@/store";

export function StaleBadge() {
  const { arrivalsFetchedAt, feedStatus } = useStore();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  const label = stalenessLabel(arrivalsFetchedAt);
  if (feedStatus === "loading" && !arrivalsFetchedAt) {
    return (
      <span className="numerals text-[10px] text-bone-300 animate-staleness">
        • LIVE
      </span>
    );
  }
  if (feedStatus === "error" && !arrivalsFetchedAt) {
    return (
      <span className="numerals text-[10px] text-red-400">
        • OFFLINE
      </span>
    );
  }
  if (!label) {
    return (
      <span className="numerals text-[10px] text-emerald-400/80">
        • LIVE
      </span>
    );
  }
  return (
    <span className="numerals text-[10px] text-gold-soft/80 animate-staleness">
      • {label.toUpperCase()}
    </span>
  );
}
