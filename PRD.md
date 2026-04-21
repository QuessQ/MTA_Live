# PULSE — Product Requirements Document

> Working title. See §14 OQ-01.

| | |
|---|---|
| **Status** | Draft v0.2 |
| **Owner** | Quess |
| **Last updated** | April 20, 2026 |
| **Platform** | Progressive Web App (installable on iOS + Android) |
| **License model** | Free forever — architecturally enforced, not marketing copy |

---

## 1. Executive Summary

**PULSE** is a real-time NYC MTA commute optimizer for riders who measure their day in minutes saved. Unlike conventional transit apps that open to a map and force the rider to interpret it, PULSE opens to **Answer Mode** — a single, oversized answer to *"what do I do right now?"* rendered in one glance, before any tap. The map, alerts, and alternatives are one swipe away, not the default.

Underneath the glance lives a full live-map of every MTA vehicle (subway, bus, LIRR, Metro-North, SIR), a fully-offline in-browser routing engine, platform-and-car boarding intelligence, leave-now nudges, exit guidance, accessibility-feed integration, crowding data, and deep-link handoff to Apple Maps or Google Maps for walking directions.

Shipped as a Progressive Web App — one codebase, installable on iOS and Android, no app store friction, zero recurring infrastructure cost, zero third-party API fees. No accounts, no tracking, no ads, no subscriptions. Free forever by architecture, not by promise.

---

## 2. Problem Statement

Existing NYC transit apps fail the time-optimizing commuter in at least one of three ways:

- **They open to interpretation, not answers.** Maps, route lists, and schedule grids require decoding. The Sprint Commuter has ≤10 seconds of attention, not 60.
- **They ignore the last 50 feet.** Which car to board, which exit to take, which platform end to stand at — these decisions save 30–90 seconds per trip, every trip. No major app surfaces them.
- **They're freemium or ad-supported.** Transit and Citymapper gate the best features. Google Maps monetizes attention. MYmta is functional but visually and functionally anemic.

The commuter's real questions are narrow: *"Should I run? Which car? Which exit? Leave now or in two minutes?"* PULSE is built around answering exactly those questions first, and everything else second.

---

## 3. Goals & Non-Goals

### 3.1 Primary Goals
- **G1** — One-glance answer: open the app, see the single most relevant action, zero taps.
- **G2** — Display real-time positions of all MTA vehicles on an interactive map, refreshed ≤15s.
- **G3** — Compute fastest route entirely client-side, working offline, using live feed data when available.
- **G4** — Surface last-50-feet intelligence: which car, which exit, which platform end, which transfer.
- **G5** — Hand off walking navigation to the rider's preferred native maps app via deep link.
- **G6** — Zero ongoing cost to rider **and** operator — enforced by architecture.

### 3.2 Secondary Goals
- **G7** — Work offline for static data, basemap tiles, and full route planning.
- **G8** — Installable to home screen on iOS and Android.
- **G9** — Accountless commute inference — learn the rider's patterns locally, never server-side.
- **G10** — Respect privacy absolutely — no accounts, no analytics, no third-party trackers.
- **G11** — Accessibility as a first-class feature, not a compliance checkbox.

### 3.3 Non-Goals
- **NG1** — Not multi-city. NYC MTA only, ever. Multi-city forks become worse NYC apps.
- **NG2** — Not a turn-by-turn navigation engine. Walking/driving deep-links out.
- **NG3** — No social features, reviews, or user-generated content.
- **NG4** — No ride-hailing, bike-share, or scooter integration in v1.
- **NG5** — No native iOS/Android shells in v1. PWA only.
- **NG6** — No accounts, ever — not v1, not v10.

---

## 4. Target Users

### 4.1 Primary persona — "The Sprint Commuter"
- NYC resident, daily rider, 25–55.
- Opens app with ≤10 seconds of attention in Answer Mode, ≤60 seconds when planning.
- Needs the answer in one glance — not three taps, not a map to interpret.
- Distrusts apps that demand signup, dislikes ads, values speed above all.

### 4.2 Secondary persona — "The Occasional Rider"
- Visitor or infrequent rider.
- Needs more hand-holding on route selection.
- Benefits from map-first orientation and exit guidance.

### 4.3 Tertiary persona — "The Mobility-Conscious Rider"
- Relies on elevators, escalators, or step-free paths.
- Needs live station-accessibility status, not a list of "accessible stations."
- A broken elevator is a route-changer, not a minor inconvenience.

---

## 5. User Stories

| ID | As a… | I want to… | So that… |
|----|-------|------------|----------|
| US-01 | commuter | open the app and see my single best action in one glance | I don't lose time decoding a UI |
| US-02 | commuter | get a "leave now" nudge when my train's arrival matches my walk time | I don't miss it or arrive 5 min early |
| US-03 | commuter | know which car to board | my next transfer or exit is closest |
| US-04 | commuter | know which exit puts me nearest my destination | I don't walk two avenues the wrong way |
| US-05 | commuter | see live train positions on a map | I know whether to run for the next one |
| US-06 | commuter | filter the map by transit mode | I don't see noise I don't care about |
| US-07 | commuter | tap a station to see next arrivals with confidence intervals | I know whether "4 min" means 4±1 or 4±5 |
| US-08 | commuter | enter a destination and see the fastest route end-to-end | I optimize total travel time, not just the next leg |
| US-09 | commuter | open walking directions in my native maps app | I use turn-by-turn I already trust |
| US-10 | commuter | install the app to my home screen | I launch it in one tap |
| US-11 | commuter | use the app offline for schedules, map, and route planning | I don't get stuck in dead zones or tunnels |
| US-12 | commuter | have the app learn my commute without an account | I don't retype home and work every morning |
| US-13 | commuter | see service alerts on my affected lines | I reroute before hitting a delay |
| US-14 | commuter | see elevator/escalator status for my stations | I don't get stuck on a platform I can't leave |
| US-15 | commuter | see crowding on my next train | I pick a less-packed car or wait for the next |
| US-16 | commuter | see my OMNY free-transfer window and weekly cap | I know when my next tap is free |
| US-17 | commuter | share my live ETA with one contact via a link | they know when to meet me without a chat back-and-forth |
| US-18 | commuter | get haptic feedback as my stop approaches | I can read or listen without watching the map |
| US-19 | occasional rider | search by address or landmark | I don't need to know the nearest station by name |
| US-20 | mobility-conscious rider | filter routes by step-free accessibility | the fastest route is also one I can actually use |

---

*(See repository PRD for full functional, non-functional, architecture, risk, and scope sections.)*
