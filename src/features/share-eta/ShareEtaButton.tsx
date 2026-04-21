import { useState } from "react";
import { useStore } from "@/store";
import { encodeShare, shareUrl, type SharePayload } from "./codec";

export function ShareEtaButton() {
  const { originStationId, destinationStationId, route } = useStore();
  const [copied, setCopied] = useState(false);

  if (!originStationId || !destinationStationId || !route) return null;

  const handleShare = async () => {
    const payload: SharePayload = {
      v: 1,
      o: originStationId,
      d: destinationStationId,
      t: Date.now(),
    };
    const url = shareUrl(payload);

    // Prefer the native share sheet when available (iOS, Android).
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PULSE · Live ETA",
          text: "Tracking my trip — live ETA link",
          url,
        });
        return;
      } catch {
        // user cancelled; fall through to clipboard fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Last resort: prompt so the user can manually copy.
      prompt("Copy your share link:", url);
    }
    // Touch the encoder once to keep TS happy if navigator.share is missing.
    void encodeShare(payload);
  };

  return (
    <button
      onClick={handleShare}
      className="mt-3 w-full rounded-xl border border-ink-300 bg-ink-100 hover:bg-ink-200 py-2.5 text-xs numerals uppercase tracking-widest text-bone-200"
    >
      {copied ? "Link copied" : "Share live ETA"}
    </button>
  );
}
