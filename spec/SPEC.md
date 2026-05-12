# Sideline — App Specification

**Version:** 0.1.0-draft  
**Status:** In Review  
**Last Updated:** 2026-04-29

---

## 1. Overview

**Sideline** is an offline-first Progressive Web App for youth soccer coaches. It helps coaches manage rosters, plan lineups, track substitutions in real time, and ensure fair playing time across a season.

### 1.1 Core Goals
- Make game-day substitution management fast and low-friction on a phone.
- Track per-player minutes by position across an entire season.
- Surface fair-playing-time suggestions without overriding coach judgment.
- Work reliably with no internet connection.

### 1.2 Out of Scope (v1)
- Multi-user / collaborative coaching
- Cloud sync or cross-device access
- Export or sharing of stats
- Parent-facing views
- Scorekeeping / match result tracking

---

## 2. User Roles

**v1 supports a single role: Coach.**

One coach owns all data on the device. Multi-coach collaboration is deferred to a future version (see ADR-001).

---

## 3. Domain Model

See `diagrams/domain-model.mermaid` for the full entity-relationship diagram.

### 3.1 Key Entities

#### Season
A named period of play (e.g. "Spring 2026"). Contains one or more teams.

#### Team
Belongs to a season. Has a configured game format (players per side), a roster, position templates, and playing time profiles.

**Game Formats (built-in):**
| Format | Field Players | Typical Age |
|---|---|---|
| 4v4 | 4 | U6–U8 |
| 7v7 | 7 | U8–U10 |
| 9v9 | 9 | U11–U12 |
| 11v11 | 11 | U13+ |

Custom formats are supported (coach sets field player count manually).

#### Player
Belongs to a team roster. Has name, jersey number, and active status. Tracks cumulative season minutes by position.

#### Position Template
A named formation saved per team (e.g. "4-3-3"). Defines slots with field coordinates and category (GK / DEF / MID / FWD). Multiple templates per team are supported.

#### Playing Time Profile
A strategy configuration that drives the suggestion engine. Built-in strategies:
- **Equal Time** (default): minimize variance in total minutes across all available players.
- **Position Aware**: equal time within GK and field player groups separately.
- **Custom**: per-player target minute overrides set by coach.

Profiles are saved per team and selected at game setup.

#### Game
A single match. References a team, a playing time profile, and a game roster (subset of team players marked available). Configures period count and length.

#### Game Event
Immutable log entry. The source of truth for all game-day state. See ADR-002.

---

## 4. Screen Inventory & UX Spec

See `diagrams/screen-flow.mermaid` for navigation flow.

### 4.1 Home
- List of seasons, sorted by year descending.
- Tap season → Season Detail.
- FAB: Create Season.

### 4.2 Season Detail
- Season name, year, division.
- List of teams in this season.
- Edit / delete season.
- FAB: Add Team.

### 4.3 Team Detail
- Team name, format.
- Four tab sections: **Roster**, **Positions**, **Profiles**, **Games**.

### 4.4 Roster Management
- List of players: name, jersey number, active toggle.
- Tap player → edit name / number / status.
- FAB: Add Player.
- Swipe to delete (with undo toast).

### 4.5 Position Configuration
**Two views, toggled via segmented control:**

**Field View:**
- Bird's-eye soccer field rendered as SVG.
- Existing template slots shown as labeled draggable circles.
- Tap blank field area → create new slot (name prompt).
- Drag slot to reposition.
- Tap slot → edit name, category, delete.

**List View:**
- Flat editable list of slots grouped by category.
- Reorder via drag handle.
- Inline name and category editing.

Multiple templates per team. Template selector at top of screen. "Add Template" creates a new blank or from a built-in formation.

### 4.6 Playing Time Profiles
- List of profiles for this team.
- Tap profile → edit strategy and config.
- Built-in "Equal Time" profile always present and non-deletable.
- FAB: Add Profile.

**Custom Profile Config:**
- Per-player target minutes input (or percentage of game).
- "Reset to Equal" shortcut.

### 4.7 Games List
- List of games: opponent, date, status (Upcoming / In Progress / Final).
- Tap game → Game Setup (if Upcoming) or Game Day View (if In Progress) or Game Summary (if Final).
- FAB: Schedule Game.

### 4.8 Game Setup
Fields:
- Opponent name
- Date / time
- Period count (default 2)
- Period length in minutes (default varies by format)
- Playing time profile (picker, defaults to team default)
- Position template (picker)

**Roster Availability:**
- Checklist of all active team players.
- Toggle availability for this game.
- Defaults to all active players available.

"Start Game" button transitions to Pre-Game Lineup.

### 4.9 Pre-Game Lineup
- Field view with template slots shown.
- Player chips shown in a bench rail below the field.
- Drag player chip onto a field slot to assign.
- Suggestion engine pre-populates suggestions (highlighted, not confirmed).
- Coach confirms or adjusts each slot.
- "Begin Game" button → writes `GAME_STARTED` + `PERIOD_STARTED` events, opens Game Day View.

### 4.10 Game Day View

The primary in-game screen. Four sections:

#### Clock Bar (top)
- Current period label (e.g. "1st Half")
- Game clock: MM:SS count-up
- Stoppage indicator if stoppage added
- Controls: Pause / Resume | + Stoppage | End Period

#### Field View (main)
- Live bird's-eye field with player name chips on their positions.
- Each chip shows: player name + minutes on field this period (small badge).
- Color coding:
  - **Green:** player is within target minutes range.
  - **Amber:** player is approaching their target (within 5 min).
  - **Red:** player has exceeded their target.
  - **Grey:** bench players shown in bench rail.
- Tap a chip → Player Detail overlay (season stats, quick sub shortcut).

#### Sub Queue Panel (bottom sheet, draggable up)
- Ordered list of pending sub entries.
- Each entry shows: OUT player → IN player → position → scheduled time (if set).
- Entries past their scheduled time are highlighted.
- Coach entries shown above suggestion entries.
- Drag to reorder.
- Tap entry → confirm sub or edit.
- "+" button → Add Sub to Queue (sub workflow).
- Suggestions marked with a wand icon; coach can accept or dismiss.

#### Player Bar (collapsed by default, swipe up to expand)
- Bench players listed with total minutes played this game.
- Sorted by playing time deficit (highest deficit first).

### 4.11 Sub Workflow
Triggered from queue entry or from tapping a field player.

Steps:
1. **Select Player Out** — defaults to tapped player if triggered from field.
2. **Select Player In** — list of available bench players, sorted by time deficit.
3. **Select Position** — defaults to outgoing player's position; can override.
4. **Set Scheduled Time** (optional) — clock time to be nudged.
5. **Confirm** — choice: "Execute Now" or "Add to Queue".

"Execute Now" writes `SUB_EXECUTED` event immediately.  
"Add to Queue" writes a `SUB_QUEUE_ENTRY` and returns to Game Day View.

### 4.12 Event Log
Accessible via a "Timeline" button on Game Day View.

- Chronological list of all game events.
- Each entry shows: clock time, event type, players/positions involved.
- Edited entries shown with strikethrough + correction inline.
- Tap any entry → edit dialog (appends corrective event, see ADR-002).
- Non-destructive: original record always preserved.

### 4.13 Settings
Accessible from Home via gear icon. Persisted locally, applies globally.

**Sub Reminders**
- Haptic: Off / Short pulse / Long pulse (default: Short pulse)
- Audio: Off / Subtle tone / Whistle (default: Subtle tone)
- Visual highlight of overdue queue entries is always active.

**Future settings placeholders** (non-functional in v1, shown greyed out):
- Account / Sync
- Share access

### 4.14 Game Summary
Shown when game status is Final.

- Per-player table: minutes played, positions played, sub count.
- Season cumulative minutes updated.
- Visual bar chart of minutes per player vs. target.
- "Back to Games" button.

---

## 5. Suggestion Engine

See ADR-003 for full design.

### 5.1 Target Minutes Calculation

```
season_minutes_per_player = sum(game_minutes) / active_roster_size  [per player, historical]
game_equal_share           = game_total_minutes * (available_count / field_player_count)
target_minutes             = weighted_blend(season_deficit, game_equal_share)
```

First game of season: target = `game_equal_share` only.

### 5.2 Suggestion Trigger
Re-evaluated on:
- Every 30-second clock tick
- Any `SUB_EXECUTED` event
- Any change to queue entries

### 5.3 Suggestion Output
Up to 3 suggestions surfaced in Sub Queue below coach entries.  
Each suggestion includes confidence score (not shown to user, used for ranking).  
Suggestions are dismissed if coach executes a manual sub involving the same players.

---

## 6. Data Architecture

See ADR-001 for technology choices.

### 6.1 Storage
- **SQLite via `@sqlite.org/sqlite-wasm`** running in a Web Worker.
- Persisted to **Origin Private File System (OPFS)**.
- Single database file per device.
- Migrations managed via versioned SQL scripts run at app startup.

### 6.2 Game State Derivation
Game day state is **always derived from the event log**, never stored as mutable fields.

On game load, the app replays all `GAME_EVENT` records to build:
- Current lineup (who is on, in what position, since when)
- Current bench (who is off, total minutes this game)
- Sub queue state
- Per-player minute totals

This replay is synchronous and fast for typical game sizes (< 100 events).

### 6.3 Schema Summary

See `diagrams/domain-model.mermaid` for full ERD.

Key tables:
- `seasons`, `teams`, `players`
- `position_templates`
- `playing_time_profiles`
- `games`, `game_rosters`
- `game_events` ← source of truth for all game-day state
- `lineup_slots` ← materialized cache, rebuilt from events
- `sub_queue_entries`

---

## 7. Technical Architecture

### 7.1 Stack
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| State | Zustand (UI state) + SQLite (persistent state) |
| Database | `@sqlite.org/sqlite-wasm` in Web Worker |
| Storage | OPFS (Origin Private File System) |
| Offline | Service Worker (Workbox) |
| Styling | Tailwind CSS |
| Field View | SVG (custom, no map library) |
| Testing | Vitest + React Testing Library |

### 7.2 Key Architectural Patterns
- **Event sourcing** for all game-day mutations (ADR-002).
- **Derived state** — game day UI state computed from event replay on load, then maintained in Zustand during active game.
- **Optimistic UI** — events written to SQLite synchronously in Web Worker; UI updates immediately.
- **Web Worker isolation** — all SQLite operations run off the main thread to prevent UI jank.

### 7.3 PWA Configuration
- App shell cached via Service Worker on first load.
- COOP/COEP headers required on host for SharedArrayBuffer (sqlite-wasm dependency).
- Installable: `manifest.json` with icons, `display: standalone`.
- Target browsers: Chrome 102+, Safari 15.2+, Firefox 111+.

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Offline support | 100% of features work with no connectivity |
| Game day UI responsiveness | Sub workflow completable in < 5 taps |
| Clock accuracy | ± 1 second (wall-clock anchored) |
| Event replay time | < 100ms for any realistic game |
| First load (cached) | < 1 second on mid-range mobile |
| Browser support | Chrome 102+, Safari 15.2+, Firefox 111+ |
| Screen sizes | 375px – 428px width primary; tablet supported |

---

## 9. Future Considerations (Not in Scope v1)

These are recorded to inform architectural decisions made now.

| Feature | Notes |
|---|---|
| Multi-coach collaboration | Will require a backend + conflict resolution strategy. ADR-001 chosen with this in mind (SQLite schema is portable). |
| Cloud sync | OPFS database file is exportable. Future: sync to Cloudflare R2 or Supabase. |
| Export / sharing | Event log is structured; CSV/PDF export is additive. |
| Assistant coach view | Second device read-only view of game state. Requires local network sync (mDNS / WebRTC). |
| Notifications | Web Push for sub reminders when app is backgrounded. |

---

## 10. ADR Index

| ADR | Title | Status |
|---|---|---|
| ADR-001 | PWA + SQLite (sqlite-wasm / OPFS) for Offline-First Architecture | Accepted |
| ADR-002 | Event-Sourced Game Log as Source of Truth | Accepted |
| ADR-003 | Playing Time Suggestion Engine | Accepted |
| ADR-004 | Position Template System with Game-Day Override | Accepted |
| ADR-005 | Substitution Queue Design | Accepted |
| ADR-006 | Game Clock and Period Management | Accepted |
