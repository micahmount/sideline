-- Migration: 001_initial
-- Full schema for Sideline v1

CREATE TABLE IF NOT EXISTS _migrations (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

-- ─── Core entities ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coaches (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seasons (
  id        TEXT PRIMARY KEY,
  coach_id  TEXT NOT NULL REFERENCES coaches(id),
  name      TEXT NOT NULL,
  year      INTEGER NOT NULL,
  division  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS teams (
  id                TEXT PRIMARY KEY,
  season_id         TEXT NOT NULL REFERENCES seasons(id),
  name              TEXT NOT NULL,
  format            TEXT NOT NULL DEFAULT '11v11',
  field_player_count INTEGER NOT NULL DEFAULT 11
);

CREATE TABLE IF NOT EXISTS players (
  id             TEXT PRIMARY KEY,
  team_id        TEXT NOT NULL REFERENCES teams(id),
  name           TEXT NOT NULL,
  jersey_number  TEXT NOT NULL DEFAULT '',
  is_active      INTEGER NOT NULL DEFAULT 1
);

-- ─── Position templates ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS position_templates (
  id            TEXT PRIMARY KEY,
  team_id       TEXT NOT NULL REFERENCES teams(id),
  template_name TEXT NOT NULL,  -- e.g. "4-3-3"
  slot_name     TEXT NOT NULL,  -- e.g. "Left Back"
  category      TEXT NOT NULL,  -- GK | DEF | MID | FWD
  field_x       REAL NOT NULL DEFAULT 0.5,
  field_y       REAL NOT NULL DEFAULT 0.5
);

-- ─── Playing time profiles ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS playing_time_profiles (
  id        TEXT PRIMARY KEY,
  team_id   TEXT NOT NULL REFERENCES teams(id),
  name      TEXT NOT NULL,
  strategy  TEXT NOT NULL DEFAULT 'equal_time',
  config    TEXT NOT NULL DEFAULT '{}'  -- JSON
);

-- ─── Games ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS games (
  id                     TEXT PRIMARY KEY,
  team_id                TEXT NOT NULL REFERENCES teams(id),
  profile_id             TEXT NOT NULL REFERENCES playing_time_profiles(id),
  position_template_id   TEXT REFERENCES position_templates(id),
  opponent               TEXT NOT NULL DEFAULT '',
  scheduled_at           TEXT NOT NULL,  -- ISO 8601
  period_count           INTEGER NOT NULL DEFAULT 2,
  period_length_minutes  INTEGER NOT NULL DEFAULT 40,
  stoppage_seconds       INTEGER NOT NULL DEFAULT 0,
  status                 TEXT NOT NULL DEFAULT 'upcoming'  -- upcoming | in_progress | final
);

CREATE TABLE IF NOT EXISTS game_rosters (
  id             TEXT PRIMARY KEY,
  game_id        TEXT NOT NULL REFERENCES games(id),
  player_id      TEXT NOT NULL REFERENCES players(id),
  available      INTEGER NOT NULL DEFAULT 1,
  target_minutes INTEGER,  -- NULL = calculated by engine
  UNIQUE(game_id, player_id)
);

-- ─── Game events (append-only, source of truth) ───────────────────────────────

CREATE TABLE IF NOT EXISTS game_events (
  id                  TEXT PRIMARY KEY,
  game_id             TEXT NOT NULL REFERENCES games(id),
  type                TEXT NOT NULL,
  payload             TEXT NOT NULL DEFAULT '{}',  -- JSON
  game_clock_seconds  INTEGER NOT NULL DEFAULT 0,
  wall_time           TEXT NOT NULL,  -- ISO 8601
  is_edited           INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_wall_time ON game_events(game_id, wall_time);

-- ─── Lineup slots (materialized cache — rebuilt from event replay) ─────────────

CREATE TABLE IF NOT EXISTS lineup_slots (
  id                   TEXT PRIMARY KEY,
  game_id              TEXT NOT NULL REFERENCES games(id),
  position_template_id TEXT REFERENCES position_templates(id),  -- NULL = freestyle
  player_id            TEXT NOT NULL REFERENCES players(id),
  period               INTEGER NOT NULL DEFAULT 1,
  started_at_seconds   INTEGER NOT NULL DEFAULT 0,
  ended_at_seconds     INTEGER  -- NULL = still on field
);

CREATE INDEX IF NOT EXISTS idx_lineup_slots_game_id ON lineup_slots(game_id);

-- ─── Sub queue ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sub_queue_entries (
  id                   TEXT PRIMARY KEY,
  game_id              TEXT NOT NULL REFERENCES games(id),
  player_out_id        TEXT REFERENCES players(id),
  player_in_id         TEXT REFERENCES players(id),
  position_id          TEXT REFERENCES position_templates(id),
  queue_order          INTEGER NOT NULL DEFAULT 0,
  scheduled_at_seconds INTEGER,  -- NULL = unscheduled
  source               TEXT NOT NULL DEFAULT 'coach'  -- coach | suggestion
);

CREATE INDEX IF NOT EXISTS idx_sub_queue_game_id ON sub_queue_entries(game_id);

-- ─── Settings (single row) ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  id           INTEGER PRIMARY KEY DEFAULT 1,
  nudge_haptic TEXT NOT NULL DEFAULT 'short',   -- off | short | long
  nudge_audio  TEXT NOT NULL DEFAULT 'tone',    -- off | tone | whistle
  CHECK (id = 1)  -- enforce single row
);

INSERT OR IGNORE INTO settings (id) VALUES (1);
