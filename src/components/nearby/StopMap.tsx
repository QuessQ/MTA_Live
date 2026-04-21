import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TransitStop } from '@/types';
import type { Coordinates } from '@/services';

interface StopMapProps {
  coords: Coordinates;
  stops: TransitStop[];
  onSelectStop: (stop: TransitStop) => void;
}

const SUBWAY_ICON = L.divIcon({
  className: 'map-marker-subway',
  html: '<div class="marker-dot"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const USER_ICON = L.divIcon({
  className: 'map-marker-user',
  html: '<div class="marker-pulse"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function StopMap({ coords, stops, onSelectStop }: StopMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([coords.latitude, coords.longitude], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    map.setView([coords.latitude, coords.longitude], map.getZoom());
  }, [coords.latitude, coords.longitude]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    // User location marker
    L.marker([coords.latitude, coords.longitude], { icon: USER_ICON })
      .addTo(map)
      .bindPopup('You are here');

    // Stop markers
    for (const stop of stops) {
      const marker = L.marker([stop.latitude, stop.longitude], { icon: SUBWAY_ICON })
        .addTo(map)
        .bindPopup(`<b>${stop.name}</b><br/>${stop.routes.join(', ')}`);

      marker.on('click', () => onSelectStop(stop));
    }
  }, [coords, stops, onSelectStop]);

  return <div ref={mapRef} className="stop-map" />;
}
