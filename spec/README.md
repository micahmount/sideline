# Sideline — Spec Repository

This repository contains the full product and technical specification for **Sideline**, a PWA for youth soccer coaches to manage rosters, lineups, and substitutions with fair playing time tracking.

## Repository Structure

```
spec/
├── README.md               ← this file
├── SPEC.md                 ← master app specification
├── adr/
│   ├── ADR-001-pwa-sqlite-offline-first.md
│   ├── ADR-002-event-sourced-game-log.md
│   ├── ADR-003-playing-time-suggestion-engine.md
│   ├── ADR-004-position-system.md
│   ├── ADR-005-substitution-queue.md
│   └── ADR-006-clock-and-periods.md
└── diagrams/
    ├── domain-model.mermaid
    └── screen-flow.mermaid
```

## How to Read This Spec

1. Start with **SPEC.md** for the full product, UX, and technical overview.
2. Read **ADRs** for the reasoning behind key technical decisions.
3. Refer to **diagrams/** for visual references — render with any Mermaid-compatible viewer (GitHub, VS Code extension, mermaid.live).

## Key Decisions at a Glance

| Decision | Choice |
|---|---|
| Platform | PWA (installable, offline-first) |
| Database | SQLite-wasm via OPFS |
| Game state | Event sourcing |
| Sub fairness | Suggestion engine (non-enforced) |
| Position system | Template + game-day override |
| Clock model | Wall-clock anchored, crash-safe |

## Status

**v0.1.0-draft** — spec complete, ready for engineering kickoff.

Open questions / decisions deferred to implementation:
- Specific haptic/audio library for sub nudge notifications
- SVG field asset source (custom draw vs. licensed asset)
- CI/CD and hosting platform (affects COOP/COEP header configuration)
