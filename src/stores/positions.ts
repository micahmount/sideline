import { create } from 'zustand'
import type { PositionCategory, PositionTemplate } from '../types'
import { exec } from '../db/client'
import * as positionQueries from '../db/queries/positions'

interface PositionsState {
  positions: PositionTemplate[]
  loaded: boolean
  loading: boolean
  load: (teamId: string) => Promise<void>
  create: (data: {
    teamId: string; templateName: string; slotName: string; category: PositionCategory; fieldX: number; fieldY: number
  }) => Promise<PositionTemplate>
  update: (id: string, data: Partial<Pick<PositionTemplate, 'slotName' | 'category' | 'fieldX' | 'fieldY'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: [],
  loaded: false,
  loading: false,

  load: async (teamId) => {
    set({ loading: true })
    const positions = await positionQueries.listPositionTemplates(exec, teamId)
    set({ positions, loaded: true, loading: false })
  },

  create: async (data) => {
    const pt = await positionQueries.createPositionTemplate(exec, data)
    set({ positions: [...get().positions, pt] })
    return pt
  },

  update: async (id, data) => {
    await positionQueries.updatePositionTemplate(exec, id, data)
    set({
      positions: get().positions.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })
  },

  remove: async (id) => {
    await positionQueries.deletePositionTemplate(exec, id)
    set({ positions: get().positions.filter((p) => p.id !== id) })
  },
}))
