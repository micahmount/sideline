# ADR-005: Substitution Queue Design

## Status
Accepted

## Context
Coaches need to plan substitutions ahead of time during a game, with some notion of timing, while remaining flexible when the actual moment arrives. The queue must coexist with the suggestion engine output.

## Decision
The Sub Queue is an **ordered list of pending substitution intents**, each optionally associated with a target clock time.

### Queue Entry Schema
```
SUB_QUEUE_ENTRY {
  player_out_id       -- who comes off (may be null if "bring X on next")
  player_in_id        -- who comes on (may be null if "take X off next")
  position_id         -- target position (may be null / freestyle)
  queue_order         -- explicit coach ordering
  scheduled_seconds   -- optional target clock time (nullable)
  source              -- "coach" | "suggestion"
}
```

### Behavior
- **Time is a hint, not a trigger.** The app surfaces a nudge when the clock passes `scheduled_seconds` for a queued entry, but never auto-executes.
- **No strict enforcement.** Entries without a scheduled time sit in order and surface when the coach opens the queue.
- **Coach entries are pinned** above suggestion entries in display order.
- **Executing a sub** from the queue: coach taps entry → confirm dialog → `SUB_EXECUTED` event written → entry removed from queue.
- **Reordering** is supported via drag-and-drop on the queue list.
- **Partial entries allowed:** Coach can queue "bring on Jordan" without yet deciding who comes off.

### Nudge Behavior
When `game_clock >= scheduled_seconds` for a queued entry, the app fires a nudge. Nudge behavior is **fully configurable per coach** in app Settings:

| Channel | Options | Default |
|---|---|---|
| Visual | Queue entry highlight (always on) | On |
| Haptic | Off / Short pulse / Long pulse | Short pulse |
| Audio | Off / Subtle tone / Whistle | Subtle tone |

- Visual highlight is always active and cannot be disabled — it is the minimum signal.
- Haptic and audio are independently toggleable.
- **No modal interruption** regardless of configuration — coach is busy on the sideline.
- Settings are persisted locally and apply to all games.

### Nudge Settings Location
Coach-level settings screen (accessible from Home via gear icon), under **"Sub Reminders"** section.

## Consequences
- **Good:** Flexible planning without rigidity. Matches how coaches actually think ("around the 25 minute mark...").
- **Good:** Partial entries reduce friction — coach can plan incrementally.
- **Good:** Nudge preferences are per-coach, respecting different sideline environments (loud stadiums, quiet fields, phone in pocket).
- **Neutral:** Queue may become stale if game situation changes. Coach is responsible for pruning.
- **Bad:** Without strict time enforcement, coach may miss a planned sub. Mitigated by nudge system.
