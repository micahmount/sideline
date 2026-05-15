import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTeamsStore } from './teams'
import { exec } from '../db/client'

vi.mock('../db/client', () => ({
  exec: vi.fn(),
}))

beforeEach(() => {
  useTeamsStore.setState({ teams: [], loaded: false, loading: false })
  vi.clearAllMocks()
})

const seasonId = 'season-1'

describe('teams store', () => {
  it('starts empty', () => {
    const s = useTeamsStore.getState()
    expect(s.teams).toEqual([])
    expect(s.loaded).toBe(false)
    expect(s.loading).toBe(false)
  })

  it('load() populates teams for a season', async () => {
    const rows = [
      { id: 't1', season_id: seasonId, name: 'Thunder', format: '7v7', field_player_count: 7 },
      { id: 't2', season_id: seasonId, name: 'Lightning', format: '9v9', field_player_count: 9 },
    ]
    vi.mocked(exec).mockResolvedValue(rows)

    await useTeamsStore.getState().load(seasonId)

    const s = useTeamsStore.getState()
    expect(s.teams).toHaveLength(2)
    expect(s.teams[0]!.name).toBe('Thunder')
    expect(s.teams[1]!.format).toBe('9v9')
    expect(s.loaded).toBe(true)
  })

  it('load() handles empty result', async () => {
    vi.mocked(exec).mockResolvedValue([])

    await useTeamsStore.getState().load(seasonId)

    expect(useTeamsStore.getState().teams).toEqual([])
    expect(useTeamsStore.getState().loaded).toBe(true)
  })

  it('create() adds a team', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const team = await useTeamsStore.getState().create({
      seasonId,
      name: 'Strikers',
      format: '11v11',
      fieldPlayerCount: 11,
    })

    expect(team.name).toBe('Strikers')
    expect(team.format).toBe('11v11')
    expect(team.fieldPlayerCount).toBe(11)
    expect(team.id).toBeTruthy()

    const s = useTeamsStore.getState()
    expect(s.teams).toHaveLength(1)
    expect(s.teams[0]!.name).toBe('Strikers')
  })

  it('create() with 5v5 format seeds Equal Time profile', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const team = await useTeamsStore.getState().create({
      seasonId,
      name: 'Mini',
      format: '5v5',
      fieldPlayerCount: 5,
    })

    expect(team.format).toBe('5v5')
    expect(team.fieldPlayerCount).toBe(5)
    expect(exec).toHaveBeenCalledTimes(2)
  })

  it('create() with custom format seeds Equal Time profile', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const team = await useTeamsStore.getState().create({
      seasonId,
      name: 'Custom',
      format: 'custom',
      fieldPlayerCount: 14,
    })

    expect(team.format).toBe('custom')
    expect(team.fieldPlayerCount).toBe(14)
    expect(exec).toHaveBeenCalledTimes(2)
  })

  it('update() modifies a team', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const team = await useTeamsStore.getState().create({
      seasonId, name: 'Old Name', format: '7v7', fieldPlayerCount: 7,
    })

    await useTeamsStore.getState().update(team.id, { name: 'New Name' })

    const s = useTeamsStore.getState()
    expect(s.teams[0]!.name).toBe('New Name')
  })

  it('remove() deletes a team', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const t1 = await useTeamsStore.getState().create({ seasonId, name: 'A', format: '7v7', fieldPlayerCount: 7 })
    await useTeamsStore.getState().create({ seasonId, name: 'B', format: '7v7', fieldPlayerCount: 7 })

    await useTeamsStore.getState().remove(t1.id)

    const s = useTeamsStore.getState()
    expect(s.teams).toHaveLength(1)
    expect(s.teams[0]!.name).toBe('B')
  })

  it('loadById() loads a single team', async () => {
    const row = { id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }
    vi.mocked(exec).mockResolvedValue([row])

    const team = await useTeamsStore.getState().loadById('t1')

    expect(team).toBeTruthy()
    expect(team!.name).toBe('Thunder')
    expect(useTeamsStore.getState().teams).toHaveLength(1)
    expect(useTeamsStore.getState().loaded).toBe(true)
  })

  it('loadById() returns null for missing team', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const team = await useTeamsStore.getState().loadById('nonexistent')

    expect(team).toBeNull()
  })

  it('load() sets loading state', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const promise = useTeamsStore.getState().load(seasonId)
    expect(useTeamsStore.getState().loading).toBe(true)

    await promise
    expect(useTeamsStore.getState().loading).toBe(false)
  })
})
