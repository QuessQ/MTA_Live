import { useStore } from "@/store";

interface Props {
  onOpen: () => void;
}

export function AlertsButton({ onOpen }: Props) {
  const { alerts } = useStore();
  const severe = alerts.filter((a) => a.severity === "severe").length;
  const total = alerts.length;

  if (total === 0) {
    return (
      <button
        onClick={onOpen}
        className="h-11 px-3 grid place-items-center text-bone-300 text-xs numerals uppercase tracking-widest hover:text-bone-0"
        aria-label="Service alerts"
      >
        <span className="flex items-center gap-1.5">
          <BellIcon />
          <span>No alerts</span>
        </span>
      </button>
    );
  }

  const color = severe > 0 ? "text-red-300" : "text-amber-300";

  return (
    <button
      onClick={onOpen}
      className={`h-11 px-3 flex items-center gap-1.5 text-xs numerals uppercase tracking-widest ${color}`}
      aria-label={`${total} service alert${total > 1 ? "s" : ""}`}
    >
      <BellIcon />
      <span>{total} alert{total > 1 ? "s" : ""}</span>
    </button>
  );
}

function BellIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <path
        d="M6 1a4 4 0 0 0-4 4v3L1 10h10L10 8V5a4 4 0 0 0-4-4zM4.5 11a1.5 1.5 0 0 0 3 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
