import { create } from 'zustand'
import type { Game, GameState, Player, PositionTemplate, SubSuggestion, FieldAssignment, GameEventType } from '../types'
import { exec } from '../db/client'
import * as gameQueries from '../db/queries/games'
import * as eventQueries from '../db/queries/events'
import { getProfile } from '../db/queries/profiles'
import { replayEvents } from '../engine/replay'
import { calculateTargets, type SeasonPlayerStats } from '../engine/playingTime'
import { generateSuggestions } from '../engine/suggestions'
import type { GameRoster } from '../types'

function makeMinimalGameState(gameId: string): GameState {
  return {
    gameId,
    currentPeriod: 0,
    clockSeconds: 0,
    isRunning: false,
    stoppageSeconds: 0,
    onField: [],
    bench: [],
    subQueue: [],
  }
}

interface GameLiveState {
  gameId: string | null
  game: Game | null
  players: Player[]
  positionTemplates: PositionTemplate[]
  targets: Record<string, number>
  suggestions: SubSuggestion[]
  state: GameState | null
  loading: boolean

  init: (gameId: string) => Promise<void>
  startGame: (initialLineup: FieldAssignment[]) => Promise<void>
  tick: () => void
  executeSub: (playerOutId: string, playerInId: string, positionId: string | null) => Promise<void>
  addToQueue: (entry: {
    playerOutId: string | null
    playerInId: string | null
    positionId: string | null
    queueOrder: number
    scheduledAtSeconds: number | null
    source: 'coach' | 'suggestion'
  }) => Promise<void>
  removeFromQueue: (entryId: string) => Promise<void>
  reorderQueue: (entryIds: string[]) => Promise<void>
  addStoppage: (seconds: number) => Promise<void>
  pauseClock: () => Promise<void>
  resumeClock: () => Promise<void>
  endPeriod: () => Promise<void>
  endGame: () => Promise<void>
  editEvent: (eventId: string, payload: Record<string, unknown>) => Promise<void>
  cleanup: () => void

  // Internal helpers
  _replay: () => Promise<void>
  _writeEvent: (type: GameEventType, payload: Record<string, unknown>) => Promise<string>
}

export const useGameLiveStore = create<GameLiveState>((set, get) => ({
  gameId: null,
  game: null,
  players: [],
  positionTemplates: [],
  targets: {},
  suggestions: [],
  state: null,
  loading: false,

  init: async (gameId) => {
    set({ loading: true })
    const game = await gameQueries.getGame(exec, gameId)
    if (!game) { set({ loading: false }); return }

    const events = await eventQueries.listEvents(exec, gameId)
    const roster = await gameQueries.listGameRoster(exec, gameId) as GameRoster[]

    const playerRows = await exec(
      'SELECT * FROM players WHERE team_id = ? AND is_active = 1',
      [game.teamId],
    )
    const players = (playerRows as unknown as Player[]).map(r => ({
      ...r,
      isActive: !!(r as unknown as Record<string, unknown>).isActive,
    }))

    const posRows = await exec(
      'SELECT * FROM position_templates WHERE team_id = ?',
      [game.teamId],
    )
    const positionTemplates = posRows as unknown as PositionTemplate[]

    const state = events.length > 0
      ? replayEvents(events, Date.now())
      : makeMinimalGameState(gameId)

    const profile = await getProfile(exec, game.profileId)
    const history: SeasonPlayerStats[] = []
    const targetEntries = calculateTargets(roster, history, game, profile ?? { id: game.profileId, teamId: game.teamId, name: '', strategy: 'equal_time', config: {} })
    const targetsMap: Record<string, number> = {}
    for (const [playerId, seconds] of targetEntries) {
      targetsMap[playerId] = seconds
    }

    const suggestions = generateSuggestions(state, targetsMap, players, positionTemplates)

    set({
      gameId,
      game,
      players,
      positionTemplates,
      targets: targetsMap,
      suggestions,
      state,
      loading: false,
    })
  },

  startGame: async (initialLineup) => {
    const { gameId, game } = get()
    if (!gameId || !game) return

    const nowMs = Date.now()
    const wallTime = new Date(nowMs).toISOString()

    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'GAME_STARTED',
      payload: {},
      gameClockSeconds: 0,
      wallTime,
    })

    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'PERIOD_STARTED',
      payload: { period: 1 },
      gameClockSeconds: 0,
      wallTime,
    })

    await gameQueries.updateGame(exec, gameId, { status: 'in_progress' })

    const events = await eventQueries.listEvents(exec, gameId)
    const state = replayEvents(events, nowMs, initialLineup)

    set({ state })
  },

  tick: () => {
    const { state } = get()
    if (!state || !state.isRunning) return
    set({ state: { ...state, clockSeconds: state.clockSeconds } })
  },

  executeSub: async (playerOutId, playerInId, positionId) => {
    const { gameId, state, game } = get()
    if (!gameId || !state || !game) return

    const nowMs = Date.now()
    const wallTime = new Date(nowMs).toISOString()
    const clockSeconds = state.isRunning
      ? state.clockSeconds
      : state.clockSeconds

    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'SUB_EXECUTED',
      payload: { playerOutId, playerInId, positionId },
      gameClockSeconds: Math.round(clockSeconds),
      wallTime,
    })

    const events = await eventQueries.listEvents(exec, gameId)
    const newState = replayEvents(events, nowMs)
    const { targets, players, positionTemplates } = get()
    const suggestions = generateSuggestions(newState, targets, players, positionTemplates)

    set({ state: newState, suggestions })
  },

  addToQueue: async (entry) => {
    const { gameId } = get()
    if (!gameId) return

    const queueOrder = entry.queueOrder ?? Date.now()
    const id = crypto.randomUUID()
    await exec(
      `INSERT INTO sub_queue_entries (id, game_id, player_out_id, player_in_id, position_id, queue_order, scheduled_at_seconds, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, gameId, entry.playerOutId, entry.playerInId, entry.positionId, queueOrder, entry.scheduledAtSeconds, entry.source],
    )

    await get()._replay()
  },

  removeFromQueue: async (entryId) => {
    const { gameId } = get()
    if (!gameId) return
    await exec('DELETE FROM sub_queue_entries WHERE id = ?', [entryId])
    await get()._replay()
  },

  reorderQueue: async (entryIds) => {
    const { gameId } = get()
    if (!gameId) return
    for (let i = 0; i < entryIds.length; i++) {
      await exec('UPDATE sub_queue_entries SET queue_order = ? WHERE id = ? AND game_id = ?', [i, entryIds[i]!, gameId])
    }
    await get()._replay()
  },

  addStoppage: async (seconds) => {
    const { gameId, state } = get()
    if (!gameId || !state) return
    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'STOPPAGE_ADDED',
      payload: { seconds },
      gameClockSeconds: Math.round(state.clockSeconds),
    })
    const events = await eventQueries.listEvents(exec, gameId)
    const newState = replayEvents(events, Date.now())
    set({ state: newState })
  },

  pauseClock: async () => {
    const { gameId, state } = get()
    if (!gameId || !state) return
    const nowMs = Date.now()
    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'CLOCK_PAUSED',
      payload: {},
      gameClockSeconds: Math.round(state.clockSeconds),
      wallTime: new Date(nowMs).toISOString(),
    })
    const events = await eventQueries.listEvents(exec, gameId)
    const newState = replayEvents(events, nowMs)
    set({ state: newState })
  },

  resumeClock: async () => {
    const { gameId, state } = get()
    if (!gameId || !state) return
    const nowMs = Date.now()
    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'CLOCK_RESUMED',
      payload: {},
      gameClockSeconds: Math.round(state.clockSeconds),
      wallTime: new Date(nowMs).toISOString(),
    })
    const events = await eventQueries.listEvents(exec, gameId)
    const newState = replayEvents(events, nowMs)
    set({ state: newState })
  },

  endPeriod: async () => {
    const { gameId, state } = get()
    if (!gameId || !state) return
    const nowMs = Date.now()
    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'PERIOD_ENDED',
      payload: {},
      gameClockSeconds: Math.round(state.clockSeconds),
      wallTime: new Date(nowMs).toISOString(),
    })
    const events = await eventQueries.listEvents(exec, gameId)
    const newState = replayEvents(events, nowMs)
    set({ state: newState })
  },

  endGame: async () => {
    const { gameId, state } = get()
    if (!gameId || !state) return
    const nowMs = Date.now()
    if (state.isRunning) {
      await eventQueries.appendEvent(exec, {
        gameId,
        type: 'CLOCK_PAUSED',
        payload: {},
        gameClockSeconds: Math.round(state.clockSeconds),
        wallTime: new Date(nowMs).toISOString(),
      })
    }
    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'GAME_ENDED',
      payload: {},
      gameClockSeconds: Math.round(state.clockSeconds),
      wallTime: new Date(nowMs).toISOString(),
    })
    await gameQueries.updateGame(exec, gameId, { status: 'final' })
    const events = await eventQueries.listEvents(exec, gameId)
    const newState = replayEvents(events, nowMs)
    set({ state: newState })
  },

  editEvent: async (eventId, payload) => {
    const { gameId, state, game } = get()
    if (!gameId || !state || !game) return
    await exec(
      'UPDATE game_events SET is_edited = 1 WHERE id = ? AND game_id = ?',
      [eventId, gameId],
    )
    await eventQueries.appendEvent(exec, {
      gameId,
      type: 'SUB_CORRECTED',
      payload: { ...payload, correctsEventId: eventId },
      gameClockSeconds: Math.round(state.clockSeconds),
    })
    const events = await eventQueries.listEvents(exec, gameId)
    const newState = replayEvents(events, Date.now())
    set({ state: newState })
  },

  cleanup: () => {
    set({
      gameId: null,
      game: null,
      players: [],
      positionTemplates: [],
      targets: {},
      suggestions: [],
      state: null,
      loading: false,
    })
  },

  _replay: async () => {
    const { gameId } = get()
    if (!gameId) return
    const events = await eventQueries.listEvents(exec, gameId)
    const newState = replayEvents(events, Date.now())
    const { targets, players, positionTemplates } = get()
    const suggestions = generateSuggestions(newState, targets, players, positionTemplates)
    set({ state: newState, suggestions })
  },

  _writeEvent: async (type, payload) => {
    const { gameId, state } = get()
    if (!gameId || !state) return ''
    const evt = await eventQueries.appendEvent(exec, {
      gameId,
      type,
      payload,
      gameClockSeconds: Math.round(state.clockSeconds),
    })
    return evt.id
  },
}))
