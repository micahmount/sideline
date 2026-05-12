# AGENTS.md

## Ground truth

Read `spec/SPEC.md` and relevant ADRs (`spec/adr/`) before coding anything. The spec defines every screen, entity, and behavior.

## Commands

```bash
npm run dev        # Vite dev server (COOP/COEP headers in vite.config.ts)
npm run build      # tsc -b && vite build
npm run test       # vitest (jsdom, RTL, jest-dom via setup file)
npm run lint       # eslint (flat config)
```

## Architecture rules (non-negotiable)

- **Event sourcing (ADR-002):** Never mutate game state directly. Always append `GAME_EVENT` records. Current state is derived by replaying events.
- **SQLite in Web Worker only (ADR-001):** `@sqlite.org/sqlite-wasm` runs off the main thread. Never import it on the main thread. Communicate via `postMessage`.
- **COOP/COEP headers** required for SharedArrayBuffer (sqlite-wasm). Already set in `vite.config.ts` — don't remove.
- **No auto-execution (ADR-003, ADR-005):** Sub queue and suggestion engine surface info; the coach always confirms.
- **`@sqlite.org/sqlite-wasm` excluded from Vite pre-bundling** (`optimizeDeps.exclude` in vite.config.ts).
- **`GAME_EVENT` rows are append-only** — never UPDATE or DELETE. `events.ts` enforces this.

## Current state (v0.1.0-draft)

Slices 1-3 complete and merged. 11 tests passing (2 files).

| What | Files |
|---|---|
| Build configs | `tsconfig.json`, `tsconfig.node.json`, `eslint.config.js`, `vite.config.ts`, `index.html`, `.nvmrc` |
| CI | `.github/workflows/ci.yml` — build+test+lint on push/PR to trunk |
| DB worker | `src/db/worker.ts`, `client.ts`, `messages.ts` — sqlite-wasm in Worker |
| CRUD queries | `src/db/queries/` — 7 modules: seasons, teams, players, positions, profiles, games, events |
| Migration | `src/db/migrations/001_initial.sql` — full schema |
| Types | `src/types/index.ts` — all domain entities |
| Scaffold app | `src/main.tsx` (React root), `src/vite-env.d.ts` |

Testing approach: sqlite-wasm imported directly in tests (`:memory:` DB), bypassing Worker since jsdom/Node lacks `Worker` global.

## Slice 4 — next up

Branch: `feature/engine-pure-functions`

### `src/engine/replay.ts`
```typescript
export function replayEvents(events: GameEvent[], nowMs: number): GameState
```
Walk events in order. Handle per ADR-002/ADR-006:
- GAME_STARTED / PERIOD_STARTED → set period, start clock
- CLOCK_PAUSED → snapshot clock seconds, mark not running
- CLOCK_RESUMED → store wall-clock anchor `{ wallMs, gameSeconds }`
- STOPPAGE_ADDED → accumulate stoppage
- SUB_EXECUTED → close LineupSlot for playerOut, open new one for playerIn
- SUB_CORRECTED → mark prior event edited, apply correction
- LINEUP_ADJUSTED → change position without sub
- PERIOD_ENDED → close all open LineupSlots
- GAME_ENDED → close all open LineupSlots, mark game final

Clock: `anchor.gameSeconds + (nowMs - anchor.wallMs) / 1000` when running.

### `src/engine/playingTime.ts`
```typescript
export function calculateTargets(roster, seasonHistory, game, profile): Map<string, number>
export function calculateDeficits(targets, actualSeconds): Map<string, number>
```
Target math per SPEC §5.1: weighted blend of season deficit and game equal share.

### `src/engine/suggestions.ts`
```typescript
export function generateSuggestions(state, targets, players, positionTemplates): SubSuggestion[]
```
Up to 3 suggestions ranked by confidence (ADR-003). Lower confidence = lower rank.

### Tests (TDD first)
Co-located: `src/engine/replay.test.ts`, `playingTime.test.ts`, `suggestions.test.ts`
Pure function tests — no SQLite, pure Vitest. >90% coverage target.

### Git workflow
```
git checkout trunk && git pull origin trunk
git checkout -b feature/engine-pure-functions
# TDD: write test → implement → test → commit → push → PR
```

Tag commits with `(#issue-number)` in subject. Branch: `feature/<kebab-case>`.

## IDs

Use `crypto.randomUUID()` at the application layer. SQLite uses TEXT primary keys.

## Work style

Senior engineer — 1/2 of a two-person team. Always:
- **TDD:** test before implementation.
- **Thin vertical slices:** complete, tested end-to-end before the next.
- **Plan first:** outline before code.
- **Git hygiene:** clean tree before starting, branch per unit, commit often, only commit/push tested code.
- **Document as you go:** build on existing structure.
