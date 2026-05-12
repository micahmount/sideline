# ADR-001: PWA + SQLite (via sqlite-wasm / Origin Private File System) for Offline-First Architecture

## Status
Accepted

## Context
The app must work reliably on a soccer field with no guaranteed connectivity. It needs to run on both iOS and Android without separate native builds. Data must persist across sessions (season history, game logs).

## Decision
Build as a Progressive Web App (PWA) using **SQLite via `@sqlite.org/sqlite-wasm`** running in a Web Worker, persisted to the **Origin Private File System (OPFS)** API.

- **No backend required** for v1. All data is local to the device.
- Service Worker caches the app shell for full offline support.
- SQLite-wasm gives us a real relational database with full query capability in the browser.
- OPFS provides a persistent, sandboxed file system that survives page reloads and browser restarts.

## Framework
**React** (with Vite) for UI. **Dexie.js** considered and rejected — it lacks relational query power needed for time calculations across LINEUP_SLOT and GAME_EVENT tables. Raw SQLite-wasm preferred.

## Consequences
- **Good:** True offline-first. No server costs. Full SQL expressiveness.
- **Good:** Single codebase, installable on iOS and Android home screen.
- **Bad:** OPFS is not available in all older browsers. We target Chrome 102+, Safari 15.2+, Firefox 111+.
- **Bad:** No cross-device sync in v1. Data lives on one device. (Addressed in future ADR when collaboration is scoped.)
- **Neutral:** SQLite-wasm requires a COOP/COEP header configuration on the host server for SharedArrayBuffer support.

## Alternatives Considered
- **Capacitor (native wrapper):** Adds build complexity. Deferred until cross-device sync requires it.
- **IndexedDB directly:** Poor query ergonomics for relational time-tracking data.
- **Dexie.js:** Good DX but insufficient for complex time aggregation queries.
