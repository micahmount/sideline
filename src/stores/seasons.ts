import { create } from 'zustand'
import type { Season } from '../types'
import { exec } from '../db/client'
import * as seasonQueries from '../db/queries/seasons'

interface SeasonsState {
  seasons: Season[]
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
  create: (data: { coachId: string; name: string; year: number; division?: string }) => Promise<Season>
  update: (id: string, data: Partial<Pick<Season, 'name' | 'year' | 'division'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useSeasonsStore = create<SeasonsState>((set, get) => ({
  seasons: [],
  loaded: false,
  loading: false,

  load: async () => {
    set({ loading: true })
    const seasons = await seasonQueries.listSeasons(exec)
    set({ seasons, loaded: true, loading: false })
  },

  create: async (data) => {
    const season = await seasonQueries.createSeason(exec, data)
    set({ seasons: [...get().seasons, season] })
    return season
  },

  update: async (id, data) => {
    await seasonQueries.updateSeason(exec, id, data)
    set({
      seasons: get().seasons.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })
  },

  remove: async (id) => {
    await seasonQueries.deleteSeason(exec, id)
    set({ seasons: get().seasons.filter((s) => s.id !== id) })
  },
}))
