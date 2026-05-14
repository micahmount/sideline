import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GameDay from '../GameDay'
import { useGameLiveStore } from '../../stores/gameLive'
import { usePlayersStore } from '../../stores/players'

const mockExec = vi.hoisted(() => vi.fn(() => Promise.resolve([])))

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useGameLiveStore.setState({
    gameId: null, game: null, players: [], positionTemplates: [],
    targets: {}, suggestions: [], state: null, loading: false,
  })
  usePlayersStore.setState({ players: [], loaded: false, loading: false })
})

function renderGameDay(gameId = 'g1') {
  return render(
    <MemoryRouter initialEntries={[`/game/${gameId}/live`]}>
      <Routes>
        <Route path="/game/:id/live" element={<GameDay />} />
      </Routes>
    </MemoryRouter>,
  )
}

const liveGame = { id: 'g1', teamId: 't1', profileId: 'p1', opponent: 'Wildcats', scheduledAt: '2026-04-01T10:00:00Z', periodCount: 2, periodLengthMinutes: 25, stoppageSeconds: 0, status: 'in_progress' as const }
const liveState = {
  gameId: 'g1', currentPeriod: 1, clockSeconds: 120, isRunning: true, stoppageSeconds: 0,
  onField: [{ playerId: 'p1', positionId: null, positionName: 'Forward', secondsOnFieldThisPeriod: 120, secondsOnFieldThisGame: 300 }],
  bench: [{ playerId: 'p2', secondsOnFieldThisGame: 0, targetMinutes: 15, deficitSeconds: 900 }],
  subQueue: [],
  clockAnchorWallMs: null,
  clockAnchorGameSeconds: 0,
}

describe('GameDay', () => {
  it('shows loading state', () => {
    renderGameDay()
    expect(screen.getByText(/loading game/i)).toBeInTheDocument()
  })

  it('shows the live game view', async () => {
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: liveGame, state: liveState,
      players: [{ id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true }],
    })
    usePlayersStore.setState({ players: [{ id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true }], loaded: true })

    renderGameDay()

    await waitFor(() => {
      expect(screen.getByText(/vs Wildcats/i)).toBeInTheDocument()
    })
  })

  it('shows the game clock', async () => {
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: liveGame, state: liveState,
      players: [{ id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true }],
    })
    usePlayersStore.setState({ players: [], loaded: true })

    renderGameDay()

    await waitFor(() => {
      expect(screen.getByText('02:00')).toBeInTheDocument()
    })
  })

  it('shows add sub button', async () => {
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: liveGame, state: liveState,
      players: [{ id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true }],
    })
    usePlayersStore.setState({ players: [], loaded: true })

    renderGameDay()

    await waitFor(() => {
      expect(screen.getByText(/add substitution/i)).toBeInTheDocument()
    })
  })

  it('shows timeline link', async () => {
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: liveGame, state: liveState,
      players: [{ id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true }],
    })
    usePlayersStore.setState({ players: [], loaded: true })

    renderGameDay()

    await waitFor(() => {
      expect(screen.getByText('Timeline')).toBeInTheDocument()
    })
  })

  it('sorts bench players by deficit descending in player bar', async () => {
    const stateWithBench = {
      ...liveState,
      bench: [
        { playerId: 'p3', secondsOnFieldThisGame: 0, targetMinutes: 15, deficitSeconds: 300 },
        { playerId: 'p2', secondsOnFieldThisGame: 0, targetMinutes: 15, deficitSeconds: 900 },
        { playerId: 'p4', secondsOnFieldThisGame: 0, targetMinutes: 15, deficitSeconds: 600 },
      ],
    }
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: liveGame, state: stateWithBench,
      players: [
        { id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true },
        { id: 'p2', teamId: 't1', name: 'Ben', jerseyNumber: '5', isActive: true },
        { id: 'p3', teamId: 't1', name: 'Cal', jerseyNumber: '7', isActive: true },
        { id: 'p4', teamId: 't1', name: 'Dex', jerseyNumber: '3', isActive: true },
      ],
    })
    usePlayersStore.setState({
      players: [
        { id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true },
        { id: 'p2', teamId: 't1', name: 'Ben', jerseyNumber: '5', isActive: true },
        { id: 'p3', teamId: 't1', name: 'Cal', jerseyNumber: '7', isActive: true },
        { id: 'p4', teamId: 't1', name: 'Dex', jerseyNumber: '3', isActive: true },
      ],
      loaded: true,
    })

    renderGameDay()

    const showBtn = await screen.findByText(/show player bar/i)
    showBtn.click()

    const items = await screen.findAllByText(/min played/)
    expect(items).toHaveLength(3)
    expect(items[0].previousElementSibling?.textContent).toBe('Ben')
    expect(items[1].previousElementSibling?.textContent).toBe('Dex')
    expect(items[2].previousElementSibling?.textContent).toBe('Cal')
  })

  it('uses dynamic targets for field chip colors', async () => {
    const stateWithTargets = {
      ...liveState,
      onField: [{ playerId: 'p1', positionId: null, positionName: 'Forward', secondsOnFieldThisPeriod: 600, secondsOnFieldThisGame: 600 }],
    }
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: liveGame, state: stateWithTargets,
      targets: { p1: 1200 },
      players: [{ id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true }],
    })
    usePlayersStore.setState({ players: [{ id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true }], loaded: true })

    renderGameDay()

    const field = await screen.findByRole('img', { name: /soccer field/i })
    expect(field).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Ali')).toBeInTheDocument()
    })
  })
})
