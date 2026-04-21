import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ open, onClose, children, title }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-ink-50 border-t border-ink-300 shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="mx-auto w-10 h-1.5 rounded-full bg-ink-300 my-3 no-select" />
        {title && (
          <header className="px-5 pb-3 flex items-center justify-between">
            <h2 className="text-bone-0 font-semibold text-lg">{title}</h2>
            <button
              onClick={onClose}
              className="h-11 w-11 grid place-items-center text-bone-300 hover:text-bone-0"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </header>
        )}
        <div className="max-h-[75vh] overflow-y-auto px-5 pb-6">{children}</div>
      </section>
    </>
  );
}
