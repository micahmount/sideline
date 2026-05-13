import { create } from 'zustand'
import type { Coach } from '../types'
import { exec } from '../db/client'
import * as coachQueries from '../db/queries/coaches'

interface CoachesState {
  coach: Coach | null
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
  create: (data: { name: string; email: string }) => Promise<Coach>
}

export const useCoachesStore = create<CoachesState>((set) => ({
  coach: null,
  loaded: false,
  loading: false,

  load: async () => {
    set({ loading: true })
    const coaches = await coachQueries.listCoaches(exec)
    const coach = coaches[0] ?? null
    set({ coach, loaded: true, loading: false })
  },

  create: async (data) => {
    const coach = await coachQueries.createCoach(exec, data)
    set({ coach, loaded: true })
    return coach
  },
}))
