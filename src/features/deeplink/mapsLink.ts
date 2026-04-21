import type { LatLng } from "@/lib/geo";
import { detectPlatform } from "@/lib/platform";

export type MapsApp = "apple" | "google" | "auto";

function apple(from: LatLng, to: LatLng): string {
  const saddr = `${from.lat},${from.lng}`;
  const daddr = `${to.lat},${to.lng}`;
  return `maps://?saddr=${saddr}&daddr=${daddr}&dirflg=w`;
}

function appleHttps(from: LatLng, to: LatLng): string {
  const saddr = `${from.lat},${from.lng}`;
  const daddr = `${to.lat},${to.lng}`;
  return `https://maps.apple.com/?saddr=${saddr}&daddr=${daddr}&dirflg=w`;
}

function google(from: LatLng, to: LatLng): string {
  const origin = `${from.lat},${from.lng}`;
  const destination = `${to.lat},${to.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
}

export function walkingDirectionsUrl(
  from: LatLng,
  to: LatLng,
  preferred: MapsApp = "auto"
): { primary: string; fallback: string } {
  const platform = detectPlatform();
  const prefer: "apple" | "google" =
    preferred === "auto" ? (platform === "ios" ? "apple" : "google") : preferred;

  return prefer === "apple"
    ? { primary: apple(from, to), fallback: appleHttps(from, to) }
    : { primary: google(from, to), fallback: google(from, to) };
}

export function openDirections(
  from: LatLng,
  to: LatLng,
  preferred: MapsApp = "auto"
): void {
  const { primary, fallback } = walkingDirectionsUrl(from, to, preferred);
  // Try the native scheme; if the page is still around after 1s the scheme
  // didn't resolve, so fall back to HTTPS.
  const start = Date.now();
  window.location.href = primary;
  setTimeout(() => {
    if (Date.now() - start < 1500 && document.visibilityState === "visible") {
      window.location.href = fallback;
    }
  }, 900);
}
