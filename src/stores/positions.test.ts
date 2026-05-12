import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePositionsStore } from './positions'
import { exec } from '../db/client'

vi.mock('../db/client', () => ({
  exec: vi.fn(),
}))

beforeEach(() => {
  usePositionsStore.setState({ positions: [], loaded: false, loading: false })
  vi.clearAllMocks()
})

const teamId = 'team-1'

describe('positions store', () => {
  it('starts empty', () => {
    const s = usePositionsStore.getState()
    expect(s.positions).toEqual([])
    expect(s.loaded).toBe(false)
    expect(s.loading).toBe(false)
  })

  it('load() populates positions for a team', async () => {
    const rows = [
      { id: 'pt1', team_id: teamId, template_name: '4-3-3', slot_name: 'LB', category: 'DEF', field_x: 0.2, field_y: 0.3 },
      { id: 'pt2', team_id: teamId, template_name: '4-3-3', slot_name: 'RB', category: 'DEF', field_x: 0.8, field_y: 0.3 },
    ]
    vi.mocked(exec).mockResolvedValue(rows)

    await usePositionsStore.getState().load(teamId)

    const s = usePositionsStore.getState()
    expect(s.positions).toHaveLength(2)
    expect(s.positions[0]!.slotName).toBe('LB')
    expect(s.positions[1]!.templateName).toBe('4-3-3')
    expect(s.loaded).toBe(true)
  })

  it('load() handles empty result', async () => {
    vi.mocked(exec).mockResolvedValue([])

    await usePositionsStore.getState().load(teamId)

    expect(usePositionsStore.getState().positions).toEqual([])
    expect(usePositionsStore.getState().loaded).toBe(true)
  })

  it('create() adds a position slot', async () => {
    vi.mocked(exec).mockResolvedValue([])

    const pt = await usePositionsStore.getState().create({
      teamId, templateName: '4-3-3', slotName: 'ST', category: 'FWD', fieldX: 0.5, fieldY: 0.1,
    })

    expect(pt.slotName).toBe('ST')
    expect(pt.category).toBe('FWD')
    expect(pt.templateName).toBe('4-3-3')
    expect(pt.id).toBeTruthy()

    const s = usePositionsStore.getState()
    expect(s.positions).toHaveLength(1)
  })

  it('update() modifies a position slot', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const pt = await usePositionsStore.getState().create({
      teamId, templateName: '4-3-3', slotName: 'LB', category: 'DEF', fieldX: 0.2, fieldY: 0.3,
    })

    await usePositionsStore.getState().update(pt.id, { slotName: 'RB' })

    const s = usePositionsStore.getState()
    expect(s.positions[0]!.slotName).toBe('RB')
  })

  it('remove() deletes a position slot', async () => {
    vi.mocked(exec).mockResolvedValue([])
    const pt1 = await usePositionsStore.getState().create({
      teamId, templateName: '4-3-3', slotName: 'LB', category: 'DEF', fieldX: 0.2, fieldY: 0.3,
    })
    await usePositionsStore.getState().create({
      teamId, templateName: '4-3-3', slotName: 'RB', category: 'DEF', fieldX: 0.8, fieldY: 0.3,
    })

    await usePositionsStore.getState().remove(pt1.id)

    const s = usePositionsStore.getState()
    expect(s.positions).toHaveLength(1)
    expect(s.positions[0]!.slotName).toBe('RB')
  })
})
