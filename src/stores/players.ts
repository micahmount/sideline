import { create } from 'zustand'
import type { Player } from '../types'
import { exec } from '../db/client'
import * as playerQueries from '../db/queries/players'

interface PlayersState {
  players: Player[]
  loaded: boolean
  loading: boolean
  load: (teamId: string) => Promise<void>
  create: (data: { teamId: string; name: string; jerseyNumber?: string }) => Promise<Player>
  update: (id: string, data: Partial<Pick<Player, 'name' | 'jerseyNumber' | 'isActive'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const usePlayersStore = create<PlayersState>((set, get) => ({
  players: [],
  loaded: false,
  loading: false,

  load: async (teamId) => {
    set({ loading: true })
    const players = await playerQueries.listPlayers(exec, teamId)
    set({ players, loaded: true, loading: false })
  },

  create: async (data) => {
    const player = await playerQueries.createPlayer(exec, data)
    set({ players: [...get().players, player] })
    return player
  },

  update: async (id, data) => {
    await playerQueries.updatePlayer(exec, id, data)
    set({
      players: get().players.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })
  },

  remove: async (id) => {
    await playerQueries.deletePlayer(exec, id)
    set({ players: get().players.filter((p) => p.id !== id) })
  },
}))
