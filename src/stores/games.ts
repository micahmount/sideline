import { create } from 'zustand'
import type { Game, GameRoster, GameStatus } from '../types'
import { exec } from '../db/client'
import * as gameQueries from '../db/queries/games'

interface GamesState {
  games: Game[]
  loaded: boolean
  loading: boolean
  currentRoster: GameRoster[]
  load: (teamId: string) => Promise<void>
  loadById: (id: string) => Promise<Game | null>
  create: (data: {
    teamId: string
    profileId: string
    positionTemplateId?: string | null
    opponent: string
    scheduledAt: string
    periodCount: number
    periodLengthMinutes: number
  }) => Promise<Game>
  update: (id: string, data: Partial<Pick<Game, 'opponent' | 'scheduledAt' | 'periodCount' | 'periodLengthMinutes' | 'status' | 'positionTemplateId'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  loadRoster: (gameId: string) => Promise<void>
  addToRoster: (data: { gameId: string; playerId: string; available?: boolean }) => Promise<GameRoster>
  updateRoster: (id: string, data: Partial<Pick<GameRoster, 'available' | 'targetMinutes'>>) => Promise<void>
  removeFromRoster: (id: string) => Promise<void>
  updateStatus: (id: string, status: GameStatus) => Promise<void>
}

export const useGamesStore = create<GamesState>((set, get) => ({
  games: [],
  loaded: false,
  loading: false,
  currentRoster: [],

  load: async (teamId) => {
    set({ loading: true })
    const games = await gameQueries.listGames(exec, teamId)
    set({ games, loaded: true, loading: false })
  },

  loadById: async (id) => {
    set({ loading: true })
    const game = await gameQueries.getGame(exec, id)
    set({ loaded: true, loading: false })
    return game
  },

  create: async (data) => {
    const game = await gameQueries.createGame(exec, data)
    set({ games: [...get().games, game] })
    return game
  },

  update: async (id, data) => {
    await gameQueries.updateGame(exec, id, data)
    set({
      games: get().games.map((g) => (g.id === id ? { ...g, ...data } : g)),
    })
  },

  remove: async (id) => {
    await gameQueries.deleteGame(exec, id)
    set({ games: get().games.filter((g) => g.id !== id) })
  },

  loadRoster: async (gameId) => {
    const currentRoster = await gameQueries.listGameRoster(exec, gameId)
    set({ currentRoster })
  },

  addToRoster: async (data) => {
    const entry = await gameQueries.addToGameRoster(exec, data)
    set({ currentRoster: [...get().currentRoster, entry] })
    return entry
  },

  updateRoster: async (id, data) => {
    await gameQueries.updateGameRoster(exec, id, data)
    set({
      currentRoster: get().currentRoster.map((r) =>
        r.id === id ? { ...r, ...data } : r,
      ),
    })
  },

  removeFromRoster: async (id) => {
    await gameQueries.removeFromGameRoster(exec, id)
    set({ currentRoster: get().currentRoster.filter((r) => r.id !== id) })
  },

  updateStatus: async (id, status) => {
    await get().update(id, { status })
  },
}))
