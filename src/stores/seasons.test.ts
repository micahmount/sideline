import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSeasonsStore } from './seasons'
import { exec } from '../db/client'

vi.mock('../db/client', () => ({
  exec: vi.fn(),
}))

beforeEach(() => {
  useSeasonsStore.setState({ seasons: [], loaded: false, loading: false })
  vi.clearAllMocks()
})

describe('seasons store', () => {
  it('starts empty', () => {
    const s = useSeasonsStore.getState()
    expect(s.seasons).toEqual([])
    expect(s.loaded).toBe(false)
    expect(s.loading).toBe(false)
  })

  it('load() populates seasons', async () => {
    const rows = [
      { id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' },
      { id: '2', coach_id: 'c1', name: 'Fall', year: 2025, division: 'U10' },
    ]
    vi.mocked(exec).mockResolvedValue(rows)

    await useSeasonsStore.getState().load()

    const s = useSeasonsStore.getState()
    expect(s.seasons).toHaveLength(2)
    expect(s.seasons[0]!.name).toBe('Spring')
    expect(s.seasons[1]!.division).toBe('U10')
    expect(s.loaded).toBe(true)
  })

  it('load() handles empty result', async () => {
    vi.mocked(exec).mockResolvedValue([])

    await useSeasonsStore.getState().load()

    expect(useSeasonsStore.getState().seasons).toEqual([])
    expect(useSeasonsStore.getState().loaded).toBe(true)
  })

  it('create() adds a season', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const season = await useSeasonsStore.getState().create({
      coachId: 'c1',
      name: 'Summer',
      year: 2026,
      division: 'U14',
    })

    expect(season.name).toBe('Summer')
    expect(season.coachId).toBe('c1')
    expect(season.id).toBeTruthy()

    const s = useSeasonsStore.getState()
    expect(s.seasons).toHaveLength(1)
    expect(s.seasons[0]!.name).toBe('Summer')
  })

  it('create() with default division', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const season = await useSeasonsStore.getState().create({
      coachId: 'c1', name: 'Spring', year: 2026,
    })

    expect(season.division).toBe('')
  })

  it('update() modifies a season', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const season = await useSeasonsStore.getState().create({
      coachId: 'c1', name: 'Old', year: 2026,
    })

    await useSeasonsStore.getState().update(season.id, { name: 'Updated' })

    const s = useSeasonsStore.getState()
    expect(s.seasons[0]!.name).toBe('Updated')
  })

  it('remove() deletes a season', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const s1 = await useSeasonsStore.getState().create({ coachId: 'c1', name: 'A', year: 2026 })
    await useSeasonsStore.getState().create({ coachId: 'c1', name: 'B', year: 2026 })

    await useSeasonsStore.getState().remove(s1.id)

    const s = useSeasonsStore.getState()
    expect(s.seasons).toHaveLength(1)
    expect(s.seasons[0]!.name).toBe('B')
  })

  it('load() sets loading state', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const promise = useSeasonsStore.getState().load()
    expect(useSeasonsStore.getState().loading).toBe(true)

    await promise
    expect(useSeasonsStore.getState().loading).toBe(false)
  })
})
