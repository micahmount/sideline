# db/

This directory contains all SQLite-wasm database code.

## Structure

```
db/
├── migrations/
│   └── 001_initial.sql     # Full schema — implement this first
├── queries/
│   ├── seasons.ts           # CRUD for seasons
│   ├── teams.ts             # CRUD for teams
│   ├── players.ts           # CRUD for players
│   ├── positions.ts         # CRUD for position templates
│   ├── profiles.ts          # CRUD for playing time profiles
│   ├── games.ts             # CRUD for games + game rosters
│   └── events.ts            # Append + fetch game events
└── worker.ts                # Web Worker entry point (sqlite-wasm init)
```

## Key Rules

- All queries run **inside the Web Worker** (`worker.ts`), never on the main thread.
- Main thread communicates via a typed message-passing interface.
- Use `crypto.randomUUID()` at the application layer for IDs.
- Migrations run sequentially on worker init. Track applied migrations in a `_migrations` table.
- `GAME_EVENT` rows are append-only. Never UPDATE or DELETE them.
