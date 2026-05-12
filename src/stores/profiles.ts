import { create } from 'zustand'
import type { PlayingTimeProfile, PlayingTimeStrategy } from '../types'
import { exec } from '../db/client'
import * as profileQueries from '../db/queries/profiles'

interface ProfilesState {
  profiles: PlayingTimeProfile[]
  loaded: boolean
  loading: boolean
  load: (teamId: string) => Promise<void>
  create: (data: {
    teamId: string; name: string; strategy: PlayingTimeStrategy; config?: Record<string, unknown>
  }) => Promise<PlayingTimeProfile>
  update: (id: string, data: Partial<Pick<PlayingTimeProfile, 'name' | 'strategy' | 'config'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: [],
  loaded: false,
  loading: false,

  load: async (teamId) => {
    set({ loading: true })
    const profiles = await profileQueries.listProfiles(exec, teamId)
    set({ profiles, loaded: true, loading: false })
  },

  create: async (data) => {
    const pr = await profileQueries.createProfile(exec, data)
    set({ profiles: [...get().profiles, pr] })
    return pr
  },

  update: async (id, data) => {
    await profileQueries.updateProfile(exec, id, data)
    set({
      profiles: get().profiles.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })
  },

  remove: async (id) => {
    await profileQueries.deleteProfile(exec, id)
    set({ profiles: get().profiles.filter((p) => p.id !== id) })
  },
}))
