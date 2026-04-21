# PULSE

> NYC MTA commute optimizer. One glance, one answer. **Free forever.**

**PULSE** is a Progressive Web App built around a single insight: the commuter opening a transit app has ten seconds of attention, not sixty. So PULSE opens to **Answer Mode** — a single oversized answer to *"what do I do right now?"* — with the live map, alerts, and alternatives one swipe away, not in the way. Underneath: live positions of every MTA vehicle, a fully-offline in-browser routing engine, boarding intelligence, leave-now nudges, and accessibility-feed integration. No accounts, no tracking, no ads, no paywall — ever.

One codebase. Installable on iOS and Android via "Add to Home Screen." Zero recurring cost.

> Name is a working title — see PRD §14 OQ-01.

---

## Status

**v0 — most of the PRD scope is shipped.** The app opens, routes, plans
trips, and learns your commute. Still on the roadmap: WASM RAPTOR over
full static GTFS, the non-subway feeds (buses, LIRR, MNR, SIR), live
elevator/escalator status, crowding.

- ✅ Answer Mode default view + swipe to Map Mode
- ✅ Live subway map (MapLibre + OpenFreeMap)
- ✅ Station tap → arrivals sheet
- ✅ Mode filter chips (live-filters map markers)
- ✅ Live GTFS-RT integration (all 8 NYC subway feeds)
- ✅ Destination search + in-browser fastest-route router
- ✅ Route polyline + summary card in Answer Mode
- ✅ Service alerts feed + per-line badges + detail sheet
- ✅ Leave-now nudges with haptic tick
- ✅ Step-free routing filter (bundled accessibility data)
- ✅ Favorites + settings (preferred maps app, reduced motion, clear data)
- ✅ OMNY fare companion (local-only transfer timer + weekly cap)
- ✅ Shareable ETA links (self-contained, no server state)
- ✅ Commute inference (local-only, IndexedDB-backed)
- ✅ Home/Work quick-access chips during relevant hours
- ✅ Boarding intelligence — curated best-car hints per station pair
- ✅ First-launch onboarding explainer
- ✅ Deep-link handoff to Apple / Google Maps
- ✅ PWA manifest + service worker shell
- ✅ Cloudflare Worker relay for MTA GTFS-RT (CORS)
- ⏳ WASM RAPTOR over full static GTFS
- ⏳ Non-subway feeds (SIRI buses, LIRR, MNR, SIR GTFS-RT)
- ⏳ Live elevator/escalator feed
- ⏳ Crowding indicators
- ⏳ Haptic "your stop is next" (needs active-trip tracking)
- ⏳ Weather-aware routing (v2 per PRD)

---

## ✦ Features (target)

### Core
- **Answer Mode** — open the app, see your single best action in one glance
- **Leave-now nudges** — "Leave in 90s to catch the 3:42"
- **Live vehicle map** — subway, bus, LIRR, Metro-North, SIR, all on one map, 15s refresh
- **Mode filter chips** — show only the lines you ride
- **Fastest-route planning** — transfer-aware, runs fully offline in your browser
- **Step-free accessibility filter** — route only through stations with working elevators
- **Commute mode** — app learns your patterns locally, no account required
- **Deep-link handoff** — walking directions open in Apple Maps or Google Maps
- **Service alerts & elevator/escalator status** — on affected lines and stations

### Post-launch (v1.1)
- **Boarding intelligence** — which car to board for your transfer or exit
- **Exit guidance** — which exit puts you closest to your endpoint
- **Crowding indicators** — where data is published
- **OMNY fare companion** — local-only 2-hour transfer timer + weekly-cap tracker
- **Haptic stop alerts** — feel your stop approaching without watching the map
- **Shareable ETA** — one-link live ETA, expires on arrival
- **Favorites** — saved routes and stations
- **High-contrast and reduced-motion modes**

### Privacy
- Fully offline app shell and route planning
- Installable as a home-screen app on iOS and Android
- Zero third-party analytics, trackers, or cookies
- No accounts, ever

---

## ✦ Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Map engine | MapLibre GL JS |
| Basemap tiles | OpenFreeMap (fallback: self-hosted Protomaps on R2) |
| Routing engine | RAPTOR in Rust → WebAssembly (runs in-browser, works offline) |
| Styling | Tailwind CSS + custom dark-luxury tokens |
| Typography | JetBrains Mono + DM Sans |
| State | Zustand |
| Persistence | IndexedDB via Dexie |
| PWA | Vite PWA plugin (Workbox) |
| Haptics | Web Vibration API |
| Commute inference | DBSCAN clustering, client-side |
| Protobuf | `gtfs-realtime-bindings` |
| Feed relay | Cloudflare Worker |
| Hosting | Cloudflare Pages |
| CI | GitHub Actions + Lighthouse CI |

---

## ✦ Getting started

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9 (or npm)

### Install & run
```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173>.

### Build
```bash
pnpm build        # type-check + build production bundle to dist/
pnpm preview      # local preview of production build
```

### MTA relay (optional for local dev)
The browser can't hit MTA feeds directly (CORS + protobuf). In production, the Cloudflare Worker in `workers/mta-relay/` sits between. Locally, Vite's dev server proxies `/mta/*` to the MTA endpoints directly — see `vite.config.ts`.

To deploy the worker:
```bash
cd workers/mta-relay
npx wrangler deploy
```

Then set `VITE_MTA_RELAY_URL=https://<your-worker>.workers.dev` in `.env`.

---

## ✦ Project structure

```
pulse/
├── src/
│   ├── app/                    App shell, Answer↔Map toggle
│   ├── features/
│   │   ├── answer/             Answer Mode — the primary view
│   │   ├── map/                MapLibre integration, vehicle layer
│   │   ├── arrivals/           Station arrival cards
│   │   ├── filters/            Mode filter chips
│   │   └── deeplink/           Apple / Google Maps handoff
│   ├── data/
│   │   ├── stations.ts         Embedded NYC subway station reference
│   │   └── gtfs-rt/            Live feed client + protobuf decoders
│   ├── store/                  Zustand store
│   ├── ui/                     Design system primitives
│   └── lib/                    Utilities (geo, time, platform)
├── workers/
│   └── mta-relay/              Cloudflare Worker — GTFS-RT CORS proxy
├── public/                     Static assets (icons, manifest)
└── PRD.md                      Product requirements
```

---

## ✦ Data sources

All free, all public, zero keys required.

- **MTA GTFS-Realtime** — `api-endpoint.mta.info` (subway, LIRR, MNR, SIR)
- **MTA Bus Time** — `bustime.mta.info` (SIRI)
- **Static GTFS** — MTA Developer Portal (refreshed weekly via scheduled GitHub Action)
- **Service alerts feed** — MTA
- **Elevator/escalator status feed** — MTA
- **Basemap tiles** — OpenFreeMap / Protomaps

---

## ✦ Deep-link targets

```
iOS:      maps://?saddr=<lat>,<lng>&daddr=<lat>,<lng>&dirflg=w
Android:  https://www.google.com/maps/dir/?api=1
          &origin=<lat>,<lng>&destination=<lat>,<lng>&travelmode=walking
```

---

## ✦ Privacy

- No accounts. No logins. No passwords. Ever.
- No analytics, tracking pixels, or cookies.
- Location requested only for map centering and commute inference; never sent off-device.
- "Clear all local data" is a single-button action in settings.

---

## ✦ License

Tentative AGPL to protect the "free forever" thesis from freemium forks. See PRD OQ-03.

*Not affiliated with the MTA.*
