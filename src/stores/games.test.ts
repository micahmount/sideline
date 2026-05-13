import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGamesStore } from './games'
import { exec } from '../db/client'

vi.mock('../db/client', () => ({
  exec: vi.fn(),
}))

beforeEach(() => {
  useGamesStore.setState({ games: [], loaded: false, loading: false, currentRoster: [] })
  vi.clearAllMocks()
})

describe('games store', () => {
  it('starts empty', () => {
    const s = useGamesStore.getState()
    expect(s.games).toEqual([])
    expect(s.loaded).toBe(false)
  })

  it('load() populates games', async () => {
    const rows = [
      { id: 'g1', team_id: 't1', profile_id: 'p1', opponent: 'Wildcats', scheduled_at: '2026-04-01T10:00:00Z', period_count: 2, period_length_minutes: 25, stoppage_seconds: 0, status: 'upcoming' },
    ]
    vi.mocked(exec).mockResolvedValue(rows)

    await useGamesStore.getState().load('t1')

    const s = useGamesStore.getState()
    expect(s.games).toHaveLength(1)
    expect(s.games[0]!.opponent).toBe('Wildcats')
    expect(s.loaded).toBe(true)
  })

  it('create() adds a game', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const game = await useGamesStore.getState().create({
      teamId: 't1',
      profileId: 'p1',
      opponent: 'Tornadoes',
      scheduledAt: '2026-04-15T14:00:00Z',
      periodCount: 2,
      periodLengthMinutes: 25,
    })

    expect(game.opponent).toBe('Tornadoes')
    expect(game.status).toBe('upcoming')
    expect(game.id).toBeTruthy()
    const s = useGamesStore.getState()
    expect(s.games).toHaveLength(1)
  })

  it('update() modifies a game', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const game = await useGamesStore.getState().create({
      teamId: 't1', profileId: 'p1', opponent: 'Old', scheduledAt: '2026-04-01T10:00:00Z', periodCount: 2, periodLengthMinutes: 25,
    })

    await useGamesStore.getState().update(game.id, { opponent: 'Updated' })

    expect(useGamesStore.getState().games[0]!.opponent).toBe('Updated')
  })

  it('updateStatus() sets game status', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const game = await useGamesStore.getState().create({
      teamId: 't1', profileId: 'p1', opponent: 'Test', scheduledAt: '2026-04-01T10:00:00Z', periodCount: 2, periodLengthMinutes: 25,
    })

    await useGamesStore.getState().updateStatus(game.id, 'in_progress')

    expect(useGamesStore.getState().games[0]!.status).toBe('in_progress')
  })

  it('remove() deletes a game', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const g1 = await useGamesStore.getState().create({
      teamId: 't1', profileId: 'p1', opponent: 'A', scheduledAt: '2026-04-01T10:00:00Z', periodCount: 2, periodLengthMinutes: 25,
    })
    await useGamesStore.getState().create({
      teamId: 't1', profileId: 'p1', opponent: 'B', scheduledAt: '2026-04-01T10:00:00Z', periodCount: 2, periodLengthMinutes: 25,
    })

    await useGamesStore.getState().remove(g1.id)

    expect(useGamesStore.getState().games).toHaveLength(1)
    expect(useGamesStore.getState().games[0]!.opponent).toBe('B')
  })

  it('loadRoster() loads game roster', async () => {
    const rows = [
      { id: 'r1', game_id: 'g1', player_id: 'p1', available: 1, target_minutes: null },
      { id: 'r2', game_id: 'g1', player_id: 'p2', available: 1, target_minutes: null },
    ]
    vi.mocked(exec).mockResolvedValue(rows)

    await useGamesStore.getState().loadRoster('g1')

    expect(useGamesStore.getState().currentRoster).toHaveLength(2)
  })

  it('addToRoster() adds roster entry', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const entry = await useGamesStore.getState().addToRoster({
      gameId: 'g1', playerId: 'p1',
    })

    expect(entry.gameId).toBe('g1')
    expect(entry.playerId).toBe('p1')
    expect(entry.available).toBe(true)
  })

  it('updateRoster() toggles availability', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const entry = await useGamesStore.getState().addToRoster({ gameId: 'g1', playerId: 'p1' })

    await useGamesStore.getState().updateRoster(entry.id, { available: false })

    expect(useGamesStore.getState().currentRoster[0]!.available).toBe(false)
  })
})
