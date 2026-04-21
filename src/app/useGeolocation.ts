import { useEffect } from "react";
import { useStore } from "@/store";

// Single-shot + watch with low-accuracy default. Permission is requested on
// mount — the user can decline, in which case we fall back to Midtown.
export function useGeolocation() {
  const setUserLocation = useStore((s) => s.setUserLocation);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let watchId: number | null = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // denied or failed — leave location null, downstream uses Midtown.
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      undefined,
      { enableHighAccuracy: false, maximumAge: 60_000 }
    );

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [setUserLocation]);
}
