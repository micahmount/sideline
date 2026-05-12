# ADR-003: Playing Time Suggestion Engine

## Status
Accepted

## Context
The app should suggest substitutions to help coaches achieve fair/equal playing time. Suggestions must be non-enforced — the coach is always in control. The engine must account for season history, not just the current game.

## Decision
Implement a **suggestion engine** that runs reactively whenever the game clock ticks or a sub is executed. It outputs an ordered list of suggested next substitutions, displayed in the Sub Queue UI as "recommended" entries distinct from coach-placed queue entries.

### Target Minutes Calculation
```
season_minutes_target = total_season_game_minutes / roster_size
game_minutes_target   = game_length_minutes * (available_players / field_players)
adjusted_target       = weighted blend of season target and game target
```

### Playing Time Profile Strategies
Profiles are stored as `{ strategy, config }` JSON. Built-in strategies:

| Strategy | Description |
|---|---|
| `equal_time` | Minimize variance in total minutes across available players |
| `position_aware` | Equal time within position groups (GK separate from field) |
| `custom` | Coach-defined per-player target minute overrides |

### Suggestion Logic
1. At each clock tick, compute `deficit = target_minutes - actual_minutes` per player.
2. Rank bench players by highest deficit.
3. For each field player approaching or exceeding their share, flag as sub-out candidate.
4. Emit ranked `(player_out, player_in, position)` tuples as suggestions.
5. Surface top N suggestions in the Sub Queue with a distinct visual treatment.

### Suggestion vs. Queue
- Coach-placed queue entries take precedence and are pinned.
- Engine suggestions fill remaining queue slots below coach entries.
- Coach can accept, dismiss, or reorder any suggestion.

## Consequences
- **Good:** Fairness goal is surfaced without being prescriptive.
- **Good:** Season-level history prevents one-game overcompensation.
- **Neutral:** Suggestion quality depends on accurate clock and event data.
- **Bad:** First game of season has no history — falls back to game-length equal time.
