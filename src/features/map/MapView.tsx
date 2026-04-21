import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useStore } from "@/store";
import { STATIONS, type Station } from "@/data/stations";
import { lineColor } from "@/data/lines";

const DEFAULT_STYLE =
  import.meta.env.VITE_TILE_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/liberty";

const MIDTOWN: [number, number] = [-73.984, 40.7549];

function buildStationMarker(station: Station): HTMLElement {
  const el = document.createElement("button");
  el.className =
    "no-select pulse-station-marker flex items-center justify-center rounded-full border transition-transform duration-150 hover:scale-110";
  el.style.width = station.lines.length > 4 ? "22px" : "16px";
  el.style.height = el.style.width;
  el.style.backgroundColor = "#0A0A0B";
  el.style.borderColor = lineColor[station.lines[0]] ?? "#D4A13E";
  el.style.borderWidth = "2px";
  el.style.cursor = "pointer";
  el.setAttribute("aria-label", station.name);
  // Inner dot
  const dot = document.createElement("span");
  dot.style.width = "6px";
  dot.style.height = "6px";
  dot.style.borderRadius = "999px";
  dot.style.backgroundColor = lineColor[station.lines[0]] ?? "#D4A13E";
  el.appendChild(dot);
  return el;
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const { setSelectedStation, userLocation, view } = useStore();

  // Init map once. We intentionally don't depend on userLocation here — the
  // recenter effect below handles location updates. Re-initializing the map
  // when the rider moves would be catastrophic.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE,
      center: MIDTOWN,
      zoom: 12.5,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      for (const station of STATIONS) {
        const m = new maplibregl.Marker({ element: buildStationMarker(station) })
          .setLngLat([station.lng, station.lat])
          .addTo(map);
        m.getElement().addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedStation(station.id);
        });
        markersRef.current.push(m);
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when view flips to map or location updates.
  useEffect(() => {
    if (view !== "map") return;
    const map = mapRef.current;
    if (!map) return;
    // Resize after the shell finishes its translate transition.
    const id = window.setTimeout(() => {
      map.resize();
      if (userLocation) {
        map.easeTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 14,
          duration: 450,
        });
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [view, userLocation]);

  return <div ref={containerRef} className="h-full w-full" />;
}
