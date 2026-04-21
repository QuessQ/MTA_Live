import express from 'express';
import cors from 'cors';
import { findNearbyStations } from './stationData.js';
import { getSubwayArrivals } from './subwayFeed.js';
import { getBusArrivals } from './busFeed.js';
import { getAlerts } from './alertsFeed.js';
import { planRoutes } from './routePlanner.js';
import { geocode } from './geocode.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const BUS_API_KEY = process.env.MTA_BUS_API_KEY ?? '';

app.use(cors());
app.use(express.json());

app.get('/api/nearby-stops', (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius = parseInt(req.query.radius as string, 10) || 800;

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: 'lat and lon are required' });
    return;
  }

  const stops = findNearbyStations(lat, lon, radius);
  res.json(stops);
});

app.get('/api/stops/:stopId/arrivals', async (req, res) => {
  try {
    const { stopId } = req.params;
    const type = req.query.type as string | undefined;

    if (type === 'bus') {
      const arrivals = await getBusArrivals(stopId, BUS_API_KEY);
      res.json(arrivals);
    } else {
      const arrivals = await getSubwayArrivals(stopId);
      res.json(arrivals);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const routesParam = req.query.routes as string | undefined;
    const routeIds = routesParam ? routesParam.split(',').map((r) => r.trim()) : undefined;
    const alerts = await getAlerts(routeIds);
    res.json(alerts);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
});

app.get('/api/route-plan', async (req, res) => {
  try {
    const originLat = parseFloat(req.query.originLat as string);
    const originLon = parseFloat(req.query.originLon as string);
    const destLat = parseFloat(req.query.destLat as string);
    const destLon = parseFloat(req.query.destLon as string);

    if ([originLat, originLon, destLat, destLon].some(isNaN)) {
      res.status(400).json({ error: 'originLat, originLon, destLat, destLon are required' });
      return;
    }

    const options = await planRoutes(originLat, originLon, destLat, destLon);
    res.json(options);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
});

app.get('/api/lines', (_req, res) => {
  const lines = [
    { id: '1', name: '1', shortName: '1', type: 'subway', color: '#EE352E' },
    { id: '2', name: '2', shortName: '2', type: 'subway', color: '#EE352E' },
    { id: '3', name: '3', shortName: '3', type: 'subway', color: '#EE352E' },
    { id: '4', name: '4', shortName: '4', type: 'subway', color: '#00933C' },
    { id: '5', name: '5', shortName: '5', type: 'subway', color: '#00933C' },
    { id: '6', name: '6', shortName: '6', type: 'subway', color: '#00933C' },
    { id: '7', name: '7', shortName: '7', type: 'subway', color: '#B933AD' },
    { id: 'A', name: 'A', shortName: 'A', type: 'subway', color: '#0039A6' },
    { id: 'C', name: 'C', shortName: 'C', type: 'subway', color: '#0039A6' },
    { id: 'E', name: 'E', shortName: 'E', type: 'subway', color: '#0039A6' },
    { id: 'B', name: 'B', shortName: 'B', type: 'subway', color: '#FF6319' },
    { id: 'D', name: 'D', shortName: 'D', type: 'subway', color: '#FF6319' },
    { id: 'F', name: 'F', shortName: 'F', type: 'subway', color: '#FF6319' },
    { id: 'M', name: 'M', shortName: 'M', type: 'subway', color: '#FF6319' },
    { id: 'G', name: 'G', shortName: 'G', type: 'subway', color: '#6CBE45' },
    { id: 'J', name: 'J', shortName: 'J', type: 'subway', color: '#996633' },
    { id: 'Z', name: 'Z', shortName: 'Z', type: 'subway', color: '#996633' },
    { id: 'L', name: 'L', shortName: 'L', type: 'subway', color: '#A7A9AC' },
    { id: 'N', name: 'N', shortName: 'N', type: 'subway', color: '#FCCC0A' },
    { id: 'Q', name: 'Q', shortName: 'Q', type: 'subway', color: '#FCCC0A' },
    { id: 'R', name: 'R', shortName: 'R', type: 'subway', color: '#FCCC0A' },
    { id: 'W', name: 'W', shortName: 'W', type: 'subway', color: '#FCCC0A' },
    { id: 'S', name: 'S', shortName: 'S', type: 'subway', color: '#808183' },
    { id: 'SIR', name: 'Staten Island Railway', shortName: 'SIR', type: 'subway', color: '#0039A6' },
  ];
  res.json(lines);
});

app.get('/api/geocode', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({ error: 'q parameter is required' });
      return;
    }
    const results = await geocode(q);
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`NYC Transit proxy server running on http://localhost:${PORT}`);
  if (!BUS_API_KEY) {
    console.log('Note: MTA_BUS_API_KEY not set — bus arrivals will be unavailable');
  }
});
