// ─── Enums / Literals ────────────────────────────────────────────────────────

export type GameFormat = '4v4' | '5v5' | '7v7' | '9v9' | '11v11' | 'custom'
export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'FWD'
export type GameStatus = 'upcoming' | 'in_progress' | 'final'
export type PlayingTimeStrategy = 'equal_time' | 'position_aware' | 'custom'
export type SubQueueSource = 'coach' | 'suggestion'
export type NudgeHaptic = 'off' | 'short' | 'long'
export type NudgeAudio = 'off' | 'tone' | 'whistle'

export type GameEventType =
  | 'GAME_STARTED'
  | 'PERIOD_STARTED'
  | 'PERIOD_ENDED'
  | 'CLOCK_PAUSED'
  | 'CLOCK_RESUMED'
  | 'STOPPAGE_ADDED'
  | 'SUB_EXECUTED'
  | 'SUB_CORRECTED'
  | 'LINEUP_ADJUSTED'
  | 'GAME_ENDED'

// ─── Domain Entities ──────────────────────────────────────────────────────────

export interface Coach {
  id: string
  name: string
  email: string
}

export interface Season {
  id: string
  coachId: string
  name: string
  year: number
  division: string
}

export interface Team {
  id: string
  seasonId: string
  name: string
  format: GameFormat
  fieldPlayerCount: number // derived from format, or custom value
}

export interface Player {
  id: string
  teamId: string
  name: string
  jerseyNumber: string
  isActive: boolean
}

export interface PositionTemplate {
  id: string
  teamId: string
  templateName: string // e.g. "4-3-3"
  slotName: string     // e.g. "Left Back"
  category: PositionCategory
  fieldX: number       // 0–1 normalized
  fieldY: number       // 0–1 normalized
}

export interface PlayingTimeProfile {
  id: string
  teamId: string
  name: string
  strategy: PlayingTimeStrategy
  config: Record<string, unknown> // strategy-specific config
}

export interface Game {
  id: string
  teamId: string
  profileId: string
  opponent: string
  scheduledAt: string  // ISO 8601
  periodCount: number
  periodLengthMinutes: number
  stoppageSeconds: number
  status: GameStatus
}

export interface GameRoster {
  id: string
  gameId: string
  playerId: string
  available: boolean
  targetMinutes: number | null // null = calculated by engine
}

export interface LineupSlot {
  id: string
  gameId: string
  positionTemplateId: string | null // null = freestyle position
  playerId: string
  period: number
  startedAtSeconds: number
  endedAtSeconds: number | null // null = still on field
}

export interface SubQueueEntry {
  id: string
  gameId: string
  playerOutId: string | null
  playerInId: string | null
  positionId: string | null
  queueOrder: number
  scheduledAtSeconds: number | null
  source: SubQueueSource
}

export interface GameEvent {
  id: string
  gameId: string
  type: GameEventType
  payload: Record<string, unknown>
  gameClockSeconds: number
  wallTime: string  // ISO 8601
  isEdited: boolean
}

// ─── Event Payloads ───────────────────────────────────────────────────────────

export interface SubExecutedPayload {
  playerOutId: string
  playerInId: string
  positionId: string | null
}

export interface SubCorrectedPayload extends SubExecutedPayload {
  correctsEventId: string
}

export interface LineupAdjustedPayload {
  playerId: string
  positionId: string | null
}

export interface StoppageAddedPayload {
  seconds: number
}

export interface PeriodStartedPayload {
  period: number
}

// ─── Derived / Game State ─────────────────────────────────────────────────────

/** Result of replaying a game's event log */
export interface GameState {
  gameId: string
  currentPeriod: number
  clockSeconds: number       // seconds elapsed in current period
  isRunning: boolean
  stoppageSeconds: number
  onField: FieldAssignment[] // current players on field
  bench: BenchPlayer[]       // current bench
  subQueue: SubQueueEntry[]
  /** Wall-clock timestamp (ms) of the last clock start/resume, null when paused */
  clockAnchorWallMs: number | null
  /** Game seconds at the point of the last clock start/resume */
  clockAnchorGameSeconds: number
}

export interface FieldAssignment {
  playerId: string
  positionId: string | null
  positionName: string | null
  secondsOnFieldThisPeriod: number
  secondsOnFieldThisGame: number
}

export interface BenchPlayer {
  playerId: string
  secondsOnFieldThisGame: number
  targetMinutes: number
  deficitSeconds: number     // positive = under target, negative = over
}

// ─── Suggestion Engine ────────────────────────────────────────────────────────

export interface SubSuggestion {
  playerOutId: string
  playerInId: string
  positionId: string | null
  confidence: number         // 0–1, used for ranking (not shown to user)
  reason: string             // e.g. "Ali has played 8 min over target"
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  nudgeHaptic: NudgeHaptic
  nudgeAudio: NudgeAudio
}
