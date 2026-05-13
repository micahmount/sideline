import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCoachesStore } from './coaches'
import { exec } from '../db/client'

vi.mock('../db/client', () => ({
  exec: vi.fn(),
}))

beforeEach(() => {
  useCoachesStore.setState({ coach: null, loaded: false, loading: false })
  vi.clearAllMocks()
})

describe('coaches store', () => {
  it('starts empty', () => {
    const s = useCoachesStore.getState()
    expect(s.coach).toBeNull()
    expect(s.loaded).toBe(false)
    expect(s.loading).toBe(false)
  })

  it('load() sets coach from db', async () => {
    vi.mocked(exec).mockResolvedValue([
      { id: 'c1', name: 'Micah', email: 'micah@example.com' },
    ])

    await useCoachesStore.getState().load()

    const s = useCoachesStore.getState()
    expect(s.coach).not.toBeNull()
    expect(s.coach!.name).toBe('Micah')
    expect(s.coach!.email).toBe('micah@example.com')
    expect(s.loaded).toBe(true)
  })

  it('load() sets coach to null when no coach exists', async () => {
    vi.mocked(exec).mockResolvedValue([])

    await useCoachesStore.getState().load()

    const s = useCoachesStore.getState()
    expect(s.coach).toBeNull()
    expect(s.loaded).toBe(true)
  })

  it('create() adds a coach', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const coach = await useCoachesStore.getState().create({
      name: 'Alice',
      email: 'a@b.com',
    })

    expect(coach.name).toBe('Alice')
    expect(coach.email).toBe('a@b.com')
    expect(coach.id).toBeTruthy()

    const s = useCoachesStore.getState()
    expect(s.coach).not.toBeNull()
    expect(s.coach!.name).toBe('Alice')
  })

  it('load() sets loading state', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const promise = useCoachesStore.getState().load()
    expect(useCoachesStore.getState().loading).toBe(true)

    await promise
    expect(useCoachesStore.getState().loading).toBe(false)
  })
})
