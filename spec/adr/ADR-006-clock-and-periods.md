# ADR-006: Game Clock and Period Management

## Status
Accepted

## Context
Soccer games have multiple periods (typically 2 halves, sometimes 4 quarters for younger divisions). The clock runs continuously within a period. Stoppage time may be added. At period transitions, the lineup carries forward without a reset.

## Decision

### Clock Model
- The game clock is a **monotonic count-up timer** (seconds elapsed in the current period).
- A **wall-clock anchor** is stored at each `CLOCK_RESUMED` event: `{ wall_time, game_seconds_at_resume }`.
- Current game time is always derived: `current_seconds = anchor.game_seconds + (now - anchor.wall_time)`.
- This makes the clock **crash-safe** — if the app is closed and reopened, current time is recoverable from the last anchor.

### Period Transitions
- Coach manually triggers `PERIOD_ENDED` → app pauses clock, shows period summary overlay.
- Coach triggers `PERIOD_STARTED` to begin next period — clock resets to 0 for that period.
- **Lineup carries forward.** Players on the field at end of period remain on field at start of next, in same positions.
- Coach may make substitutions during the break — these are logged as `SUB_EXECUTED` events with `game_clock_seconds = 0` for the new period.

### Stoppage Time
- Coach can add stoppage seconds at any point via a `+` control.
- `STOPPAGE_ADDED { seconds }` event appended to log.
- UI shows primary clock + stoppage indicator separately.
- Suggestion engine factors stoppage into remaining-time calculations.

### Clock Controls
| Action | Event Written |
|---|---|
| Start game | `GAME_STARTED`, `PERIOD_STARTED` |
| Pause | `CLOCK_PAUSED` |
| Resume | `CLOCK_RESUMED` |
| Add stoppage | `STOPPAGE_ADDED` |
| End period | `PERIOD_ENDED` |
| Start next period | `PERIOD_STARTED` |
| End game | `PERIOD_ENDED`, `GAME_ENDED` |

## Consequences
- **Good:** Clock is robust to app backgrounding, device sleep, crashes.
- **Good:** Lineup continuity across periods matches real soccer workflow.
- **Good:** Stoppage time is part of the record, not an afterthought.
- **Neutral:** Coach must manually manage period transitions — no auto-advance. This is intentional; game conditions vary.
