// Platform sniffing — used only for choosing the default maps deep-link scheme.

export type Platform = "ios" | "android" | "other";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) {
    return "ios";
  }
  if (/android/i.test(ua)) return "android";
  return "other";
}

export function supportsVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function vibrate(pattern: number | number[]): void {
  if (supportsVibrate()) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}
