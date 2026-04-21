import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { BottomSheet } from "@/ui/BottomSheet";
import { LineBullet } from "@/ui/LineBullet";
import type { Alert } from "@/data/gtfs-rt/alerts";

interface Props {
  open: boolean;
  onClose: () => void;
}

const severityColor: Record<Alert["severity"], string> = {
  severe: "text-red-300 border-red-400/40 bg-red-500/10",
  warning: "text-amber-300 border-amber-400/40 bg-amber-500/10",
  info: "text-bone-200 border-ink-300 bg-ink-100",
};

export function AlertsSheet({ open, onClose }: Props) {
  const { alerts } = useStore();

  const sorted = useMemo(() => {
    const rank: Record<Alert["severity"], number> = { severe: 0, warning: 1, info: 2 };
    return [...alerts].sort((a, b) => rank[a.severity] - rank[b.severity]);
  }, [alerts]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Service alerts">
      {sorted.length === 0 ? (
        <p className="text-bone-300 text-sm py-6 text-center">
          No active service alerts.
        </p>
      ) : (
        <ul className="space-y-3 pt-2">
          {sorted.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const [open, setOpen] = useState(false);
  return (
    <li
      className={`rounded-xl border px-4 py-3 ${severityColor[alert.severity]}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {alert.lines.slice(0, 6).map((l) => (
            <LineBullet key={l} line={l} size="sm" />
          ))}
          <span className="numerals text-[10px] uppercase tracking-widest opacity-80 ml-1">
            {alert.effect}
          </span>
        </div>
      </header>
      <p className="text-bone-0 text-sm mt-2">{alert.header}</p>
      {alert.description && (
        <>
          {open && (
            <p className="text-bone-200 text-xs mt-2 whitespace-pre-wrap">
              {alert.description}
            </p>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="numerals text-[10px] uppercase tracking-widest text-bone-300 mt-2 hover:text-bone-0"
          >
            {open ? "Hide details" : "More"}
          </button>
        </>
      )}
    </li>
  );
}
