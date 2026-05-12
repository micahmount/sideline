# AGENTS.md

## Ground truth

Read `spec/SPEC.md` and relevant ADRs (`spec/adr/`) before coding anything. The spec defines every screen, entity, and behavior.

## Commands

```bash
npm run dev        # Vite dev server (needs COOP/COEP headers — already in vite.config.ts)
npm run build      # tsc -b && vite build (will fail until tsconfig.json exists)
npm run test       # vitest (no config yet — run `vitest` directly with inline config)
npm run lint       # eslint (no config yet)
```

## Architecture rules (non-negotiable)

- **Event sourcing (ADR-002):** Never mutate game state directly. Always append `GAME_EVENT` records. Current state is derived by replaying events.
- **SQLite in Web Worker only (ADR-001):** `@sqlite.org/sqlite-wasm` runs off the main thread. Never import it on the main thread. Communicate via `postMessage`.
- **COOP/COEP headers** required for SharedArrayBuffer (sqlite-wasm). Already set in `vite.config.ts` — don't remove.
- **No auto-execution (ADR-003, ADR-005):** Sub queue and suggestion engine surface info; the coach always confirms.
- **`@sqlite.org/sqlite-wasm` excluded from Vite pre-bundling** (`optimizeDeps.exclude` in vite.config.ts).
- **`GAME_EVENT` rows are append-only** — never UPDATE or DELETE.

## Current state (v0.1.0-draft)

Repo has types and DB migration only. No components, hooks, stores, routes, workers, tests, or configs beyond `vite.config.ts`. Missing configs that must be created before building:
- `tsconfig.json` + `tsconfig.node.json` (needed by `tsc -b`)
- Vitest config (run `vitest` with `jsdom` environment + React Testing Library setup)
- ESLint config (needed by `npm run lint`)

## Structure at a glance

| Path | What |
|---|---|
| `src/types/` | Domain types (`GameEvent`, `LineupSlot`, etc.) |
| `src/db/migrations/` | Versioned SQL migrations (start with `001_initial.sql`) |
| `src/db/queries/` | Per-domain CRUD query modules |
| `src/db/worker.ts` | Web Worker entry point (sqlite-wasm init) |
| `src/engine/` | Pure functions: `replay.ts`, `playingTime.ts`, `suggestions.ts` |
| `src/components/field/` | SVG field view |
| `src/components/game/` | Game day view components |
| `src/components/roster/` | Roster & team management |
| `src/components/ui/` | Shared UI primitives |
| `src/hooks/` | Custom React hooks |
| `src/store/` | Zustand stores |
| `src/routes/` | React Router page components |
| `src/workers/` | Web Worker source |

## Build order

1. Scaffold missing configs (tsconfig, vitest, eslint)
2. SQLite Web Worker + migrations
3. CRUD queries
4. Engine pure functions (`replay.ts`, `playingTime.ts`, `suggestions.ts`) + tests
5. Setup screens (seasons → teams → roster → positions → profiles)
6. Game day screens (lineup → clock → field view → sub workflow)
7. Polish (PWA manifest, service worker, settings)

## Tests

Co-locate with source — `src/engine/replay.test.ts` etc. Focus on engine logic (replay correctness, target math, suggestion ranking). UI tests are secondary. No test config exists yet.

## IDs

Use `crypto.randomUUID()` at the application layer. SQLite uses TEXT primary keys.

## Work style

You are a senior software engineer — 1/2 of a two-person dev team. Always:
- **TDD:** write or update the test before the implementation.
- **Thin vertical slices:** ship a complete, tested end-to-end slice before moving to the next.
- **Plan first:** outline the approach before writing any code.
- **Git hygiene:** ensure a clean working tree before starting, branch for each unit of work, commit often, and only commit/push tested code.
- **Document as you go:** build on the existing structure, don't start over.

## Existing instruction sources

This file supersedes `.claude/CLAUDE.md`. Delete that file once migrated.
