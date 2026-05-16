import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameLiveStore } from './gameLive'
import { exec } from '../db/client'

vi.mock('../db/client', () => ({
  exec: vi.fn(),
}))

beforeEach(() => {
  useGameLiveStore.setState({
    gameId: null, game: null, players: [], positionTemplates: [],
    targets: {}, suggestions: [], state: null, loading: false,
  })
  vi.clearAllMocks()
})

describe('gameLive store', () => {
  it('starts with no game', () => {
    const s = useGameLiveStore.getState()
    expect(s.gameId).toBeNull()
    expect(s.state).toBeNull()
  })

  it('init loads game data from DB', async () => {
    vi.mocked(exec)
      .mockResolvedValueOnce([{ id: 'g1', team_id: 't1', profile_id: 'p1', opponent: 'Test', scheduled_at: '2026-04-01T10:00:00Z', period_count: 2, period_length_minutes: 25, stoppage_seconds: 0, status: 'upcoming' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'p1', team_id: 't1', name: 'Ali', jersey_number: '10', is_active: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await useGameLiveStore.getState().init('g1')

    const s = useGameLiveStore.getState()
    expect(s.gameId).toBe('g1')
    expect(s.game).toBeTruthy()
    expect(s.game!.opponent).toBe('Test')
    expect(s.players).toHaveLength(1)
    expect(s.state).toBeTruthy()
  })

  it('init loads sub queue entries from DB', async () => {
    vi.mocked(exec)
      .mockResolvedValueOnce([{ id: 'g1', team_id: 't1', profile_id: 'p1', opponent: 'Test', scheduled_at: '2026-04-01T10:00:00Z', period_count: 2, period_length_minutes: 25, stoppage_seconds: 0, status: 'upcoming' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'p1', team_id: 't1', name: 'Ali', jersey_number: '10', is_active: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'q1', game_id: 'g1', player_out_id: 'p1', player_in_id: 'p2', position_id: null, queue_order: 0, scheduled_at_seconds: null, source: 'coach' },
        { id: 'q2', game_id: 'g1', player_out_id: 'p2', player_in_id: 'p3', position_id: null, queue_order: 1, scheduled_at_seconds: 600, source: 'suggestion' },
      ])
      .mockResolvedValueOnce([])

    await useGameLiveStore.getState().init('g1')

    const s = useGameLiveStore.getState()
    expect(s.state?.subQueue).toHaveLength(2)
    expect(s.state?.subQueue[0]?.playerOutId).toBe('p1')
    expect(s.state?.subQueue[0]?.playerInId).toBe('p2')
    expect(s.state?.subQueue[0]?.source).toBe('coach')
    expect(s.state?.subQueue[0]?.scheduledAtSeconds).toBeNull()
    expect(s.state?.subQueue[1]?.playerOutId).toBe('p2')
    expect(s.state?.subQueue[1]?.playerInId).toBe('p3')
    expect(s.state?.subQueue[1]?.source).toBe('suggestion')
    expect(s.state?.subQueue[1]?.scheduledAtSeconds).toBe(600)
  })

  it('init handles missing game', async () => {
    vi.mocked(exec).mockResolvedValueOnce([])

    await useGameLiveStore.getState().init('nonexistent')

    expect(useGameLiveStore.getState().game).toBeNull()
  })

  it('startGame writes events and sets state', async () => {
    vi.mocked(exec)
      .mockResolvedValueOnce([{ id: 'g1', team_id: 't1', profile_id: 'p1', opponent: 'Test', scheduled_at: '2026-04-01T10:00:00Z', period_count: 2, period_length_minutes: 25, stoppage_seconds: 0, status: 'upcoming' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'p1', team_id: 't1', name: 'Ali', jersey_number: '10', is_active: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await useGameLiveStore.getState().init('g1')

    vi.mocked(exec)
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([{ id: 'e1', game_id: 'g1', type: 'GAME_STARTED', payload: '{}', game_clock_seconds: 0, wall_time: new Date().toISOString(), is_edited: 0 }])

    await useGameLiveStore.getState().startGame([])

    const s = useGameLiveStore.getState()
    expect(s.state).toBeTruthy()
    expect(s.state!.currentPeriod).toBe(1)
  })

  it('cleanup resets state', () => {
    useGameLiveStore.setState({ gameId: 'g1', loading: true })
    useGameLiveStore.getState().cleanup()

    const s = useGameLiveStore.getState()
    expect(s.gameId).toBeNull()
    expect(s.loading).toBe(false)
  })

  it('executeSub writes sub event and updates state', async () => {
    vi.mocked(exec)
      .mockResolvedValueOnce([{ id: 'g1', team_id: 't1', profile_id: 'p1', opponent: 'Test', scheduled_at: '2026-04-01T10:00:00Z', period_count: 2, period_length_minutes: 25, stoppage_seconds: 0, status: 'in_progress' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'p1', team_id: 't1', name: 'Ali', jersey_number: '10', is_active: 1 }, { id: 'p2', team_id: 't1', name: 'Ben', jersey_number: '7', is_active: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await useGameLiveStore.getState().init('g1')

    useGameLiveStore.setState({
      state: {
        gameId: 'g1', currentPeriod: 1, clockSeconds: 300, isRunning: true, stoppageSeconds: 0,
        onField: [{ playerId: 'p1', positionId: null, positionName: null, secondsOnFieldThisPeriod: 300, secondsOnFieldThisGame: 300 }],
        bench: [{ playerId: 'p2', secondsOnFieldThisGame: 0, targetMinutes: 0, deficitSeconds: 0 }],
        subQueue: [],
        clockAnchorWallMs: null,
        clockAnchorGameSeconds: 0,
      },
    })

    vi.mocked(exec)
      .mockResolvedValue([])
      .mockResolvedValue([{ id: 'e1', game_id: 'g1', type: 'SUB_EXECUTED', payload: JSON.stringify({ playerOutId: 'p1', playerInId: 'p2', positionId: null }), game_clock_seconds: 300, wall_time: new Date().toISOString(), is_edited: 0 }])

    await useGameLiveStore.getState().executeSub('p1', 'p2', null)

    expect(useGameLiveStore.getState().state).toBeTruthy()
  })

  it('tick does nothing when clock not running', () => {
    useGameLiveStore.setState({
      state: { gameId: 'g1', currentPeriod: 1, clockSeconds: 100, isRunning: false, stoppageSeconds: 0, onField: [], bench: [], subQueue: [], clockAnchorWallMs: null, clockAnchorGameSeconds: 0 },
    })

    useGameLiveStore.getState().tick()

    expect(useGameLiveStore.getState().state!.clockSeconds).toBe(100)
  })

  it('tick advances clockSeconds when running', () => {
    const past = Date.now() - 500
    useGameLiveStore.setState({
      state: {
        gameId: 'g1', currentPeriod: 1, clockSeconds: 0, isRunning: true, stoppageSeconds: 0,
        onField: [], bench: [], subQueue: [],
        clockAnchorWallMs: past, clockAnchorGameSeconds: 0,
      },
    })

    useGameLiveStore.getState().tick()

    const elapsed = useGameLiveStore.getState().state!.clockSeconds
    expect(elapsed).toBeGreaterThan(0.4)
    expect(elapsed).toBeLessThan(1)
  })

  it('tick does nothing when clockAnchorWallMs is null even if isRunning', () => {
    useGameLiveStore.setState({
      state: { gameId: 'g1', currentPeriod: 1, clockSeconds: 50, isRunning: true, stoppageSeconds: 0, onField: [], bench: [], subQueue: [], clockAnchorWallMs: null, clockAnchorGameSeconds: 0 },
    })

    useGameLiveStore.getState().tick()

    expect(useGameLiveStore.getState().state!.clockSeconds).toBe(50)
  })
})
