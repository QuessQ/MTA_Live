import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useStore } from "@/store";
import { STATIONS, STATION_BY_ID, type Station } from "@/data/stations";
import { lineColor } from "@/data/lines";
import type { Route } from "@/features/routing/planner";

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

const ROUTE_SOURCE_ID = "pulse-route";
const ROUTE_LAYER_ID = "pulse-route-line";
const ROUTE_GLOW_LAYER_ID = "pulse-route-glow";

function routeToGeoJSON(route: Route | null): GeoJSON.FeatureCollection {
  if (!route) return { type: "FeatureCollection", features: [] };
  const features: GeoJSON.Feature[] = [];
  for (const leg of route.legs) {
    const coords: [number, number][] = [];
    for (const stopId of leg.stops) {
      const s = STATION_BY_ID.get(stopId);
      if (s) coords.push([s.lng, s.lat]);
    }
    if (coords.length >= 2) {
      features.push({
        type: "Feature",
        properties: { color: lineColor[leg.line] },
        geometry: { type: "LineString", coordinates: coords },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<{ marker: Marker; mode: Station["mode"] }[]>([]);
  const { setSelectedStation, userLocation, view, route, modes } = useStore();

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
        markersRef.current.push({ marker: m, mode: station.mode });
      }

      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: ROUTE_GLOW_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 10,
          "line-opacity": 0.25,
          "line-blur": 4,
        },
      });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.marker.remove());
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
      if (route && route.legs.length > 0) {
        // Fit route bounds.
        const allStops = route.legs.flatMap((l) => l.stops);
        const coords = allStops
          .map((id) => STATION_BY_ID.get(id))
          .filter((s): s is Station => !!s);
        if (coords.length >= 2) {
          const bounds = new maplibregl.LngLatBounds();
          for (const c of coords) bounds.extend([c.lng, c.lat]);
          map.fitBounds(bounds, { padding: 80, duration: 450, maxZoom: 14 });
          return;
        }
      }
      if (userLocation) {
        map.easeTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 14,
          duration: 450,
        });
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [view, userLocation, route]);

  // Show/hide station markers based on the mode-filter chip state.
  useEffect(() => {
    for (const { marker, mode } of markersRef.current) {
      const el = marker.getElement();
      el.style.display = modes[mode] ? "" : "none";
    }
  }, [modes]);

  // Update route polyline whenever the route changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const source = map.getSource(ROUTE_SOURCE_ID) as
        | maplibregl.GeoJSONSource
        | undefined;
      if (source) source.setData(routeToGeoJSON(route));
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [route]);

  return <div ref={containerRef} className="h-full w-full" />;
}
