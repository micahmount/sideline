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
- **`GAME_EVENT` rows are append-only** — never UPDATE or DELETE.`events.ts` enforces this (no UPDATE/DELETE exported).

## Current state (v0.1.0-draft)

Slices 1-3 are complete and merged to `trunk`. Test count: 11 passing across 2 files.

| What | Files |
|---|---|
| Build configs | `tsconfig.json`, `tsconfig.node.json`, `eslint.config.js`, `vite.config.ts`, `index.html`, `.nvmrc` |
| CI | `.github/workflows/ci.yml` — runs build+test+lint on push/PR to trunk |
| DB worker | `src/db/worker.ts` (sqlite-wasm init), `src/db/client.ts` (promisified postMessage), `src/db/messages.ts` (protocol types) |
| CRUD queries | `src/db/queries/` — 7 modules: `seasons`, `teams`, `players`, `positions`, `profiles`, `games`, `events` |
| Migration | `src/db/migrations/001_initial.sql` — full schema |
| Types | `src/types/index.ts` — all domain entities |
| Scaffold app | `src/main.tsx` (React root), `src/vite-env.d.ts` |

Testing approach: sqlite-wasm imported directly in tests (in-memory `:memory:`), bypassing Worker since jsdom/Node lacks `Worker` global.

## Recovery plan

Next up: **Slice 4 — Engine pure functions + tests**. This is unblocked (no dep on Slice 3).

### Slice 4 plan

Create `src/engine/`:
1. `replay.ts` — `replayEvents(events, nowMs) → GameState`
   - Walk `GameEvent[]` in order per ADR-002/ADR-006
   - Handle: GAME_STARTED, PERIOD_STARTED/ENDED, CLOCK_PAUSED/RESUMED, STOPPAGE_ADDED, SUB_EXECUTED/CORRECTED, LINEUP_ADJUSTED, GAME_ENDED
   - Clock: `anchor.gameSeconds + (nowMs - anchor.wallMs) / 1000` when running

2. `playingTime.ts` — `calculateTargets()` and `calculateDeficits()`
   - Per SPEC section 5.1: target = weighted_blend(season_deficit, game_equal_share)

3. `suggestions.ts` — `generateSuggestions()` with confidence ranking (ADR-003)
   - Returns up to 3 suggestions, lower confidence = lower rank

Tests (TDD first): `replay.test.ts`, `playingTime.test.ts`, `suggestions.test.ts`
- Pure function tests — no SQLite needed, pure Vitest
- Coverage target: >90% on engine modules

### Git workflow for next session
```
git checkout trunk && git pull origin trunk
git checkout -b feature/engine-pure-functions
# TDD: write test → implement → test → commit → push → PR
```

### Open PRs (waiting for merge)
- #3 (CRUD queries) — PR #12

### GitHub context
- Remote: `git@github.com:micahmount/sideline.git` (SSH) or `https://github.com/micahmount/sideline.git` (HTTPS with gh token)
- `gh` is authenticated as `micahmount`
- Branch convention: `feature/<kebab-case-slice>`
- Tag commits with `(#issue-number)` in subject

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
