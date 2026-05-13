import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import PreGameLineup from '../PreGameLineup'
import { useGameLiveStore } from '../../stores/gameLive'
import { usePlayersStore } from '../../stores/players'
import { usePositionsStore } from '../../stores/positions'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useGameLiveStore.setState({
    gameId: null, game: null, players: [], positionTemplates: [],
    targets: {}, suggestions: [], state: null, loading: false,
  })
  usePlayersStore.setState({ players: [], loaded: false, loading: false })
  usePositionsStore.setState({ positions: [], loaded: false, loading: false })
  mockExec.mockReset()
  mockExec.mockImplementation(() => Promise.resolve([]))
})

function renderPreGameLineup(gameId = 'g1') {
  return render(
    <MemoryRouter initialEntries={[`/game/${gameId}/lineup`]}>
      <Routes>
        <Route path="/game/:id/lineup" element={<PreGameLineup />} />
      </Routes>
    </MemoryRouter>,
  )
}

const mockGame = { id: 'g1', teamId: 't1', profileId: 'p1', opponent: 'Wildcats', scheduledAt: '2026-04-01T10:00:00Z', periodCount: 2, periodLengthMinutes: 25, stoppageSeconds: 0, status: 'upcoming' as const }

describe('PreGameLineup', () => {
  it('shows loading state', () => {
    renderPreGameLineup()
    expect(screen.getByText(/loading game/i)).toBeInTheDocument()
  })

  it('shows lineup view when game and roster loaded', async () => {
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: mockGame,
      state: { gameId: 'g1', currentPeriod: 0, clockSeconds: 0, isRunning: false, stoppageSeconds: 0, onField: [], bench: [], subQueue: [], clockAnchorWallMs: null, clockAnchorGameSeconds: 0 },
    })
    usePlayersStore.setState({ players: [], loaded: true, loading: false })
    usePositionsStore.setState({ positions: [], loaded: true, loading: false })

    renderPreGameLineup()

    await waitFor(() => {
      expect(screen.getByText(/pre-game lineup/i)).toBeInTheDocument()
    })
  })

  it('shows Begin Game button when game is ready', async () => {
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: mockGame,
      state: { gameId: 'g1', currentPeriod: 0, clockSeconds: 0, isRunning: false, stoppageSeconds: 0, onField: [], bench: [], subQueue: [], clockAnchorWallMs: null, clockAnchorGameSeconds: 0 },
    })
    usePlayersStore.setState({ players: [], loaded: true, loading: false })
    usePositionsStore.setState({ positions: [], loaded: true, loading: false })

    renderPreGameLineup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /begin game/i })).toBeInTheDocument()
    })
  })
})
