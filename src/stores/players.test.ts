import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlayersStore } from './players'
import { exec } from '../db/client'

vi.mock('../db/client', () => ({
  exec: vi.fn(),
}))

beforeEach(() => {
  usePlayersStore.setState({ players: [], loaded: false, loading: false })
  vi.clearAllMocks()
})

const teamId = 'team-1'

describe('players store', () => {
  it('starts empty', () => {
    const s = usePlayersStore.getState()
    expect(s.players).toEqual([])
    expect(s.loaded).toBe(false)
    expect(s.loading).toBe(false)
  })

  it('load() populates players for a team', async () => {
    const rows = [
      { id: 'p1', team_id: teamId, name: 'Alex', jersey_number: '10', is_active: 1 },
      { id: 'p2', team_id: teamId, name: 'Jordan', jersey_number: '7', is_active: 1 },
    ]
    vi.mocked(exec).mockResolvedValue(rows)

    await usePlayersStore.getState().load(teamId)

    const s = usePlayersStore.getState()
    expect(s.players).toHaveLength(2)
    expect(s.players[0]!.name).toBe('Alex')
    expect(s.players[1]!.jerseyNumber).toBe('7')
    expect(s.loaded).toBe(true)
  })

  it('load() handles empty result', async () => {
    vi.mocked(exec).mockResolvedValue([])

    await usePlayersStore.getState().load(teamId)

    expect(usePlayersStore.getState().players).toEqual([])
    expect(usePlayersStore.getState().loaded).toBe(true)
  })

  it('create() adds a player', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const player = await usePlayersStore.getState().create({
      teamId,
      name: 'Morgan',
      jerseyNumber: '5',
    })

    expect(player.name).toBe('Morgan')
    expect(player.jerseyNumber).toBe('5')
    expect(player.isActive).toBe(true)
    expect(player.id).toBeTruthy()

    const s = usePlayersStore.getState()
    expect(s.players).toHaveLength(1)
  })

  it('create() without jersey number', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const player = await usePlayersStore.getState().create({
      teamId,
      name: 'Taylor',
    })

    expect(player.jerseyNumber).toBe('')
  })

  it('update() modifies a player', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const player = await usePlayersStore.getState().create({ teamId, name: 'Sam', jerseyNumber: '3' })

    await usePlayersStore.getState().update(player.id, { name: 'Sam Updated', jerseyNumber: '99' })

    const s = usePlayersStore.getState()
    expect(s.players[0]!.name).toBe('Sam Updated')
    expect(s.players[0]!.jerseyNumber).toBe('99')
  })

  it('update() toggles active status', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const player = await usePlayersStore.getState().create({ teamId, name: 'Riley' })

    await usePlayersStore.getState().update(player.id, { isActive: false })

    const s = usePlayersStore.getState()
    expect(s.players[0]!.isActive).toBe(false)
  })

  it('remove() deletes a player', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const p1 = await usePlayersStore.getState().create({ teamId, name: 'A' })
    await usePlayersStore.getState().create({ teamId, name: 'B' })

    await usePlayersStore.getState().remove(p1.id)

    const s = usePlayersStore.getState()
    expect(s.players).toHaveLength(1)
    expect(s.players[0]!.name).toBe('B')
  })

  it('load() sets loading state', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const promise = usePlayersStore.getState().load(teamId)
    expect(usePlayersStore.getState().loading).toBe(true)

    await promise
    expect(usePlayersStore.getState().loading).toBe(false)
  })
})
