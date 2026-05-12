import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProfilesStore } from './profiles'
import { exec } from '../db/client'

vi.mock('../db/client', () => ({
  exec: vi.fn(),
}))

beforeEach(() => {
  useProfilesStore.setState({ profiles: [], loaded: false, loading: false })
  vi.clearAllMocks()
})

const teamId = 'team-1'

describe('profiles store', () => {
  it('starts empty', () => {
    const s = useProfilesStore.getState()
    expect(s.profiles).toEqual([])
    expect(s.loaded).toBe(false)
    expect(s.loading).toBe(false)
  })

  it('load() populates profiles for a team', async () => {
    const rows = [
      { id: 'pr1', team_id: teamId, name: 'Equal', strategy: 'equal_time', config: '{}' },
      { id: 'pr2', team_id: teamId, name: 'Position Aware', strategy: 'position_aware', config: '{}' },
    ]
    vi.mocked(exec).mockResolvedValue(rows)

    await useProfilesStore.getState().load(teamId)

    const s = useProfilesStore.getState()
    expect(s.profiles).toHaveLength(2)
    expect(s.profiles[0]!.name).toBe('Equal')
    expect(s.profiles[1]!.strategy).toBe('position_aware')
    expect(s.loaded).toBe(true)
  })

  it('load() handles empty result', async () => {
    vi.mocked(exec).mockResolvedValue([])

    await useProfilesStore.getState().load(teamId)

    expect(useProfilesStore.getState().profiles).toEqual([])
    expect(useProfilesStore.getState().loaded).toBe(true)
  })

  it('create() adds a profile', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const pr = await useProfilesStore.getState().create({
      teamId, name: 'Custom', strategy: 'custom', config: {},
    })

    expect(pr.name).toBe('Custom')
    expect(pr.strategy).toBe('custom')
    expect(pr.config).toEqual({})
    expect(pr.id).toBeTruthy()

    const s = useProfilesStore.getState()
    expect(s.profiles).toHaveLength(1)
  })

  it('create() with defaults', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const pr = await useProfilesStore.getState().create({
      teamId, name: 'Equal Time', strategy: 'equal_time',
    })

    expect(pr.name).toBe('Equal Time')
    expect(pr.strategy).toBe('equal_time')
    expect(pr.config).toEqual({})
  })

  it('update() modifies a profile', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const pr = await useProfilesStore.getState().create({ teamId, name: 'Old', strategy: 'equal_time' })

    await useProfilesStore.getState().update(pr.id, { name: 'Updated', strategy: 'custom' })

    const s = useProfilesStore.getState()
    expect(s.profiles[0]!.name).toBe('Updated')
    expect(s.profiles[0]!.strategy).toBe('custom')
  })

  it('remove() deletes a profile', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const pr1 = await useProfilesStore.getState().create({ teamId, name: 'A', strategy: 'equal_time' })
    await useProfilesStore.getState().create({ teamId, name: 'B', strategy: 'equal_time' })

    await useProfilesStore.getState().remove(pr1.id)

    const s = useProfilesStore.getState()
    expect(s.profiles).toHaveLength(1)
    expect(s.profiles[0]!.name).toBe('B')
  })
})
