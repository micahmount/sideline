# ADR-002: Event-Sourced Game Log as Source of Truth

## Status
Accepted

## Context
The game day view requires a live clock, editable history, and accurate per-player time calculations. Coaches will make mistakes — wrong sub logged, wrong position assigned — and must be able to correct them without corrupting time totals.

## Decision
All game-day mutations are written as **immutable GAME_EVENT records** (event sourcing). Current state (who is on the field, in what position, for how long) is **derived by replaying events**, not stored directly.

Event types include:
- `GAME_STARTED`
- `PERIOD_STARTED`
- `PERIOD_ENDED`
- `CLOCK_PAUSED`
- `CLOCK_RESUMED`
- `SUB_EXECUTED` `{ player_out, player_in, position_id, clock_seconds }`
- `LINEUP_ADJUSTED` `{ player_id, position_id, clock_seconds }` (position change without sub)
- `GAME_ENDED`

Edits are handled by appending a **corrective event** (e.g. `SUB_CORRECTED`) rather than mutating prior events. The `is_edited` flag marks superseded events for UI display purposes.

## Consequences
- **Good:** Full audit trail. Coach can review and correct the entire game timeline.
- **Good:** Time calculations are always consistent — derived from the same event stream.
- **Good:** Undo/redo is straightforward (pop or append corrective events).
- **Bad:** Replay logic must be efficient. For typical game (< 50 events), this is trivial.
- **Neutral:** LINEUP_SLOT table is a **materialized cache** of the event replay, rebuilt on load. It is not the source of truth.

## Alternatives Considered
- **Mutable state updates:** Simpler writes but makes correction and audit nearly impossible.
- **Full CQRS with separate read models:** Overkill for single-device, low event volume app.
