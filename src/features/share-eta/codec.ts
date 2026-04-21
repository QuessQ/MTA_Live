// Self-contained shareable ETA link. We encode:
//   - origin station id
//   - destination station id
//   - start timestamp (unix ms)
//   - optional sender label (free-form, max 24 chars)
// into a base64url string jammed into the URL hash. No server state.
// Recipient's browser re-plans the route deterministically via the same
// embedded station graph, so both ends compute the identical ETA.
//
// Links carry an implicit expiry: (startedAt + route.totalSeconds * 1000
// + 2 h grace). The recipient view enforces that.

export interface SharePayload {
  v: 1;
  o: string; // origin station id
  d: string; // destination station id
  t: number; // startedAt (unix ms)
  n?: string; // optional sender name
}

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return decodeURIComponent(
    escape(atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad))
  );
}

export function encodeShare(p: SharePayload): string {
  return b64urlEncode(JSON.stringify(p));
}

export function decodeShare(token: string): SharePayload | null {
  try {
    const obj = JSON.parse(b64urlDecode(token));
    if (obj && obj.v === 1 && typeof obj.o === "string" && typeof obj.d === "string" && typeof obj.t === "number") {
      return obj as SharePayload;
    }
  } catch {
    // fall through
  }
  return null;
}

export function shareUrl(p: SharePayload, base: string = window.location.origin): string {
  return `${base.replace(/\/$/, "")}/#/eta/${encodeShare(p)}`;
}

// Parse the current window's hash for an incoming ETA link.
export function parseIncoming(): SharePayload | null {
  const m = /^#\/eta\/([A-Za-z0-9_-]+)$/.exec(window.location.hash);
  if (!m) return null;
  return decodeShare(m[1]);
}

export function clearIncoming(): void {
  if (window.location.hash.startsWith("#/eta/")) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}
