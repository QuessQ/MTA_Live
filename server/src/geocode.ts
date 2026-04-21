export interface GeocodedPlace {
  name: string;
  latitude: number;
  longitude: number;
}

// Uses OpenStreetMap Nominatim (free, no API key, 1 req/sec rate limit)
export async function geocode(query: string): Promise<GeocodedPlace[]> {
  const bounded = `${query}, New York City`;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', bounded);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('viewbox', '-74.26,40.50,-73.70,40.92');
  url.searchParams.set('bounded', '1');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'NYCTransitCompanion/1.0' },
  });

  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);

  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  return data.map((item) => ({
    name: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  }));
}
