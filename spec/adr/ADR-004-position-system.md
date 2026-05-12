# ADR-004: Position Template System with Game-Day Override

## Status
Accepted

## Context
Coaches need to configure positions for their team format (7v7, 9v9, 11v11, etc.) and use those as a starting point during games. However, live soccer is fluid — positions shift and coaches need freedom to assign players to non-template slots without friction.

## Decision
Positions operate in two layers:

### Layer 1: Position Template (Setup Time)
- Defined per team, stored as `POSITION_TEMPLATE` records.
- Each template slot has: `name`, `category` (GK / Defender / Midfielder / Forward), and `(field_x, field_y)` coordinates on a normalized 0–1 field grid.
- Configured via a drag-and-drop field view (bird's-eye) OR a flat list view. Both are editable; they are two views of the same data.
- Multiple templates can be saved per team (e.g. "4-3-3", "3-4-2") and selected at game setup.

### Layer 2: Live Lineup (Game Time)
- At game start, template slots are pre-populated into the live lineup as a suggestion.
- Coach can:
  - Accept the suggested assignment (tap to confirm)
  - Drag a different player to any slot
  - Create an ad-hoc position slot not in the template (freestyle)
  - Leave a template slot empty
- Live assignments are written as `LINEUP_SLOT` records derived from the event log.
- The suggestion engine uses template `category` to prefer positionally appropriate subs (e.g. prefer a midfielder to replace a midfielder), but this is advisory only.

## Consequences
- **Good:** Structure for coaches who want it; flexibility for those who don't.
- **Good:** Field view works for visual thinkers; list view works during fast-moving game situations.
- **Neutral:** Ad-hoc positions have no `position_template_id` — nullable FK is acceptable.
- **Bad:** Coaches who never set up a template start with a blank field. Mitigated by shipping built-in templates for common formats (7v7, 9v9, 11v11).
