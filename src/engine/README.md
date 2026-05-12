# engine/

This directory contains pure functions for game state derivation and the suggestion engine. No React, no SQLite — just logic. Fully testable with Vitest.

## Files to implement

### `replay.ts`
Replays an array of `GameEvent[]` and returns a `GameState`.

```typescript
export function replayEvents(events: GameEvent[], nowMs: number): GameState
```

Walk the event array in order. Handle each event type per ADR-002 and ADR-006:
- `GAME_STARTED` / `PERIOD_STARTED` → set period, start clock
- `CLOCK_PAUSED` → snapshot clock seconds, mark not running
- `CLOCK_RESUMED` → store wall-clock anchor `{ wallMs, gameSeconds }`
- `STOPPAGE_ADDED` → accumulate stoppage
- `SUB_EXECUTED` → close current LineupSlot for playerOut, open new one for playerIn
- `SUB_CORRECTED` → mark prior event as edited, apply correction
- `LINEUP_ADJUSTED` → change position without sub
- `PERIOD_ENDED` → close all open LineupSlots
- `GAME_ENDED` → close all open LineupSlots, mark game final

Current clock = `anchor.gameSeconds + (nowMs - anchor.wallMs) / 1000` when running.

### `playingTime.ts`
Calculates target minutes and deficits.

```typescript
export function calculateTargets(
  roster: GameRoster[],
  seasonHistory: SeasonPlayerStats[],
  game: Game,
  profile: PlayingTimeProfile,
): Map<string, number> // playerId → targetMinutes
```

```typescript
export function calculateDeficits(
  targets: Map<string, number>,
  actualSeconds: Map<string, number>, // playerId → secondsPlayed
): Map<string, number> // playerId → deficitSeconds (positive = under target)
```

### `suggestions.ts`
Generates substitution suggestions from game state + playing time data.

```typescript
export function generateSuggestions(
  state: GameState,
  targets: Map<string, number>,
  players: Player[],
  positionTemplates: PositionTemplate[],
): SubSuggestion[]
```

Returns up to 3 suggestions, ranked by confidence. See ADR-003 for ranking logic.

## Testing

All engine functions should have comprehensive unit tests in `__tests__/`:
- `replay.test.ts` — event sequences, corrections, period transitions
- `playingTime.test.ts` — target calculations, edge cases (first game, absences)
- `suggestions.test.ts` — ranking, position affinity, edge cases
