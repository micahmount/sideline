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

Slices 1-4 complete and merged. 33 tests passing (5 files).

| What | Files |
|---|---|
| Build configs | `tsconfig.json`, `tsconfig.node.json`, `eslint.config.js`, `vite.config.ts`, `index.html`, `.nvmrc` |
| CI | `.github/workflows/ci.yml` — build+test+lint on push/PR to trunk |
| DB worker | `src/db/worker.ts`, `client.ts`, `messages.ts` — sqlite-wasm in Worker |
| CRUD queries | `src/db/queries/` — 7 modules: seasons, teams, players, positions, profiles, games, events |
| Migration | `src/db/migrations/001_initial.sql` — full schema |
| Types | `src/types/index.ts` — all domain entities |
| Engine | `src/engine/replay.ts`, `playingTime.ts`, `suggestions.ts` — pure functions |
| Scaffold app | `src/main.tsx` (React root), `src/vite-env.d.ts` |

Testing approach: sqlite-wasm imported directly in tests (`:memory:` DB), bypassing Worker since jsdom/Node lacks `Worker` global.

## Slice 5 — Home Screen + Season CRUD

Branch: `feature/home-screen`

Wire up the React UI layer with Tailwind CSS, React Router, and Zustand. Build the Home and Season Detail screens with full CRUD for seasons.

### Files to create

| File | Purpose |
|---|---|
| `src/index.css` | Tailwind CSS import (`@import "tailwindcss"`) |
| `src/components/App.tsx` | Root layout — Router + DB init + suspense boundary |
| `src/stores/seasons.ts` | Zustand store wrapping `db/client.ts` + `queries/seasons.ts` |
| `src/views/Home.tsx` | List seasons, FAB to create |
| `src/views/SeasonDetail.tsx` | Season info, teams list placeholder, edit/delete |
| `src/views/CreateSeason.tsx` | Form dialog for new season |
| `src/views/__tests__/Home.test.tsx` | RTL test for Home screen |
| `src/views/__tests__/SeasonDetail.test.tsx` | RTL test for Season Detail screen |

### Architecture

- **Zustand store** (`seasons.ts`): holds `Season[]` in memory, exposes `load()`, `create()`, `update()`, `remove()` which call `db/client.ts`'s `exec()` through the query functions.
- **DB client** initialized once in `App.tsx` via `initDB()` before rendering children.
- **React Router** routes:
  - `/` → `Home`
  - `/season/:id` → `SeasonDetail`
- **Tailwind v4** already plugin-configured; just add `@import "tailwindcss"` to `src/index.css` and import in `main.tsx`.

### Tests

TDD: write tests first for the Zustand store (`seasons.test.ts`) and screen components (`Home.test.tsx`, `SeasonDetail.test.tsx`). Mock the DB client for RTL tests so they don't require Worker/sqlite-wasm.

### Git workflow
```
git checkout trunk && git pull origin trunk
git checkout -b feature/home-screen
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
