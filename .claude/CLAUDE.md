# CLAUDE.md — Instructions for Claude Code

## Read the Spec First

Before writing any code, read these documents in order:

1. `spec/SPEC.md` — full product, UX, and technical specification
2. `spec/adr/ADR-001-pwa-sqlite-offline-first.md` — why PWA + SQLite-wasm
3. `spec/adr/ADR-002-event-sourced-game-log.md` — game state architecture (critical)
4. `spec/adr/ADR-003-playing-time-suggestion-engine.md` — fairness engine
5. `spec/adr/ADR-004-position-system.md` — position templates
6. `spec/adr/ADR-005-substitution-queue.md` — sub queue design
7. `spec/adr/ADR-006-clock-and-periods.md` — clock model

## Project Setup

This is a React 18 + TypeScript + Vite PWA. Initialize the project with:

```bash
npm create vite@latest . -- --template react-ts
npm install
```

Then install additional dependencies:

```bash
# Routing
npm install react-router-dom

# State
npm install zustand

# SQLite (offline database)
npm install @sqlite.org/sqlite-wasm

# PWA / Service Worker
npm install -D vite-plugin-pwa workbox-window

# Styling
npm install -D tailwindcss @tailwindcss/vite

# Testing
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

## Critical Architecture Rules

### 1. Event Sourcing (ADR-002)
**Never update game state directly.** All game-day changes are written as immutable `GAME_EVENT` records. Current state is always derived by replaying events.

```typescript
// ✅ Correct
await appendEvent({ type: 'SUB_EXECUTED', payload: { playerOut, playerIn, positionId }, clockSeconds })

// ❌ Wrong
await db.run('UPDATE lineup_slots SET player_id = ? WHERE ...', [playerIn])
```

Corrections append a new corrective event — they never mutate existing events.

### 2. SQLite in a Web Worker
All SQLite operations must run in a Web Worker (`src/workers/db.worker.ts`). Never import sqlite-wasm directly on the main thread. Communicate via `postMessage`.

### 3. COOP/COEP Headers
SQLite-wasm requires SharedArrayBuffer. The Vite dev server must be configured with:

```typescript
// vite.config.ts
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  }
}
```

### 4. No Auto-Execution
The sub queue and suggestion engine **never** auto-execute substitutions. They surface information and nudge — the coach always confirms.

### 5. Derived State Pattern
On game load, replay all `GAME_EVENT` records to derive current state. Store derived state in Zustand for reactive UI. Write new events to SQLite synchronously, then update Zustand.

## Build Order Recommendation

Work in this order to build a solid foundation before UI:

### Phase 1 — Foundation
- [ ] Vite + React + TypeScript scaffold
- [ ] Tailwind CSS config
- [ ] React Router setup with route stubs for all screens
- [ ] SQLite Web Worker setup (`src/workers/db.worker.ts`)
- [ ] Database schema + migrations (`src/db/migrations/`)
- [ ] TypeScript types for all domain entities (`src/types/`)

### Phase 2 — Data Layer
- [ ] CRUD queries for seasons, teams, players (`src/db/queries/`)
- [ ] CRUD queries for position templates and playing time profiles
- [ ] Game setup queries (create game, set roster availability)
- [ ] Game event append + replay engine (`src/engine/replay.ts`)
- [ ] Playing time calculation functions (`src/engine/playingTime.ts`)

### Phase 3 — Setup Screens
- [ ] Home screen (seasons list)
- [ ] Season detail
- [ ] Team detail (tabbed)
- [ ] Roster management
- [ ] Position configuration (field view + list view)
- [ ] Playing time profiles
- [ ] Game setup + roster availability

### Phase 4 — Game Day
- [ ] Pre-game lineup screen
- [ ] Game clock (Zustand store + wall-clock anchor)
- [ ] Game day view layout
- [ ] Field view (SVG, live player chips)
- [ ] Sub workflow
- [ ] Sub queue panel
- [ ] Event log + editing
- [ ] Suggestion engine (`src/engine/suggestions.ts`)

### Phase 5 — Polish
- [ ] Game summary screen
- [ ] Settings screen (nudge preferences)
- [ ] PWA manifest + service worker
- [ ] Offline testing
- [ ] Color coding (green/amber/red playing time indicators)
- [ ] Haptic + audio nudges

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g. `FieldView.tsx`)
- Hooks: `useCamelCase.ts` (e.g. `useGameClock.ts`)
- Queries: `camelCase.ts` grouped by domain (e.g. `src/db/queries/games.ts`)
- Types: defined in `src/types/index.ts` or split by domain
- Tests: colocated, `ComponentName.test.tsx`

## TypeScript Types (bootstrap)

Start with these core types in `src/types/index.ts`:

```typescript
export type GameFormat = '4v4' | '7v7' | '9v9' | '11v11' | 'custom'
export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'FWD'
export type GameStatus = 'upcoming' | 'in_progress' | 'final'
export type GameEventType =
  | 'GAME_STARTED'
  | 'PERIOD_STARTED'
  | 'PERIOD_ENDED'
  | 'CLOCK_PAUSED'
  | 'CLOCK_RESUMED'
  | 'STOPPAGE_ADDED'
  | 'SUB_EXECUTED'
  | 'SUB_CORRECTED'
  | 'LINEUP_ADJUSTED'
  | 'GAME_ENDED'

export type PlayingTimeStrategy = 'equal_time' | 'position_aware' | 'custom'
export type SubQueueSource = 'coach' | 'suggestion'
export type NudgeHaptic = 'off' | 'short' | 'long'
export type NudgeAudio = 'off' | 'tone' | 'whistle'
```

## Database Schema

The full entity model is in `spec/diagrams/domain-model.mermaid`. Implement as versioned SQL migrations in `src/db/migrations/001_initial.sql`. Use integer primary keys internally; expose UUIDs generated via `crypto.randomUUID()` at the application layer.

## SVG Field View

The field is rendered as a normalized coordinate space (0–1 in both axes). Position template slots store `field_x` and `field_y` as floats in this space. The SVG component scales these to the actual rendered dimensions. Field is always rendered portrait (top-to-bottom attack direction).

## Testing Priorities

Focus tests on:
1. Event replay engine — correctness of derived state
2. Playing time calculations — target minutes math
3. Suggestion engine — ranking logic
4. Clock model — wall-clock anchor derivation

UI tests are secondary; the above logic is where bugs will hide.
