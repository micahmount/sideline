# Sideline

An offline-first Progressive Web App for youth soccer coaches. Manage rosters, plan lineups, track substitutions in real time, and ensure fair playing time across a season.

## Quick Start

```bash
npm install
npm run dev
```

## Docs

- [`spec/SPEC.md`](spec/SPEC.md) — full product and technical specification
- [`spec/adr/`](spec/adr/) — architecture decision records
- [`spec/diagrams/`](spec/diagrams/) — domain model and screen flow (Mermaid)

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| State | Zustand |
| Database | SQLite-wasm (OPFS) |
| Offline | Workbox Service Worker |
| Styling | Tailwind CSS |
| Testing | Vitest + React Testing Library |

## Project Structure

```
sideline/
├── spec/                   # Product & technical spec (read this first)
│   ├── SPEC.md
│   ├── adr/
│   └── diagrams/
├── src/
│   ├── db/                 # SQLite-wasm setup, migrations, queries
│   ├── engine/             # Game event replay + suggestion engine
│   ├── components/         # React components
│   │   ├── field/          # SVG field view components
│   │   ├── game/           # Game day view components
│   │   ├── roster/         # Roster & team management
│   │   └── ui/             # Shared UI primitives
│   ├── hooks/              # Custom React hooks
│   ├── routes/             # React Router page components
│   ├── store/              # Zustand stores
│   ├── types/              # TypeScript types/interfaces
│   └── workers/            # Web Worker (SQLite)
├── public/
│   └── sw.js               # Service Worker (Workbox generated)
├── .claude/
│   └── CLAUDE.md           # Claude Code instructions
└── vite.config.ts
```

## Key Concepts

**Everything important is in the spec.** Before writing any code, Claude Code (or any engineer) should read `spec/SPEC.md` and the relevant ADRs.

- Game state is **event-sourced** — never mutate, always append (ADR-002)
- The substitution queue is **advisory**, never auto-executed (ADR-005)
- The playing time engine **suggests**, never enforces (ADR-003)
- All data is **local-only** in v1 — no backend, no sync (ADR-001)
