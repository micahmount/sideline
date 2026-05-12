import { create } from 'zustand'
import type { GameFormat, Team } from '../types'
import { exec } from '../db/client'
import * as teamQueries from '../db/queries/teams'

interface TeamsState {
  teams: Team[]
  loaded: boolean
  loading: boolean
  load: (seasonId: string) => Promise<void>
  loadById: (id: string) => Promise<Team | null>
  create: (data: { seasonId: string; name: string; format: GameFormat; fieldPlayerCount: number }) => Promise<Team>
  update: (id: string, data: Partial<Pick<Team, 'name' | 'format' | 'fieldPlayerCount'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  teams: [],
  loaded: false,
  loading: false,

  load: async (seasonId) => {
    set({ loading: true })
    const teams = await teamQueries.listTeams(exec, seasonId)
    set({ teams, loaded: true, loading: false })
  },

  loadById: async (id) => {
    set({ loading: true })
    const team = await teamQueries.getTeam(exec, id)
    set({ teams: team ? [team] : [], loaded: true, loading: false })
    return team
  },

  create: async (data) => {
    const team = await teamQueries.createTeam(exec, data)
    set({ teams: [...get().teams, team] })
    return team
  },

  update: async (id, data) => {
    await teamQueries.updateTeam(exec, id, data)
    set({
      teams: get().teams.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })
  },

  remove: async (id) => {
    await teamQueries.deleteTeam(exec, id)
    set({ teams: get().teams.filter((t) => t.id !== id) })
  },
}))
