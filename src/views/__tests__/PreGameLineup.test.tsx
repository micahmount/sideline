import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
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

const mockGame = { id: 'g1', teamId: 't1', profileId: 'p1', positionTemplateId: null, opponent: 'Wildcats', scheduledAt: '2026-04-01T10:00:00Z', periodCount: 2, periodLengthMinutes: 25, stoppageSeconds: 0, status: 'upcoming' as const }

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

describe('drag and drop', () => {
  const p1 = { id: 'p1', teamId: 't1', name: 'Alice', jerseyNumber: '10', isActive: true }
  const p2 = { id: 'p2', teamId: 't1', name: 'Bob', jerseyNumber: '5', isActive: true }
  const p3 = { id: 'p3', teamId: 't1', name: 'Charlie', jerseyNumber: '7', isActive: true }
  const p4 = { id: 'p4', teamId: 't1', name: 'Diana', jerseyNumber: '9', isActive: true }

  const pos1 = { id: 'pos1', teamId: 't1', templateName: '4-4-2', slotName: 'GK', category: 'GK' as const, fieldX: 0.5, fieldY: 0.05 }
  const pos2 = { id: 'pos2', teamId: 't1', templateName: '4-4-2', slotName: 'LB', category: 'DEF' as const, fieldX: 0.15, fieldY: 0.3 }
  const pos3 = { id: 'pos3', teamId: 't1', templateName: '4-4-2', slotName: 'RB', category: 'DEF' as const, fieldX: 0.85, fieldY: 0.3 }

  it('makes bench player chips draggable', async () => {
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: mockGame,
      state: { gameId: 'g1', currentPeriod: 0, clockSeconds: 0, isRunning: false, stoppageSeconds: 0, onField: [], bench: [], subQueue: [], clockAnchorWallMs: null, clockAnchorGameSeconds: 0 },
    })
    usePlayersStore.setState({ players: [p1, p2, p3, p4], loaded: true, loading: false })
    usePositionsStore.setState({ positions: [pos1, pos2, pos3], loaded: true, loading: false })

    renderPreGameLineup()

    await waitFor(() => {
      expect(screen.getByText(/pre-game lineup/i)).toBeInTheDocument()
    })

    const benchHeading = screen.getByText('Bench')
    const benchContainer = benchHeading.nextElementSibling as HTMLElement | null
    const chips = within(benchContainer!).queryAllByRole('button')
    expect(chips.length).toBe(4)
    chips.forEach((chip) => {
      expect(chip).toHaveAttribute('draggable')
    })
  })

  it('assigns player to slot via drop', async () => {
    useGameLiveStore.setState({
      gameId: 'g1', loading: false, game: mockGame,
      state: { gameId: 'g1', currentPeriod: 0, clockSeconds: 0, isRunning: false, stoppageSeconds: 0, onField: [], bench: [], subQueue: [], clockAnchorWallMs: null, clockAnchorGameSeconds: 0 },
    })
    usePlayersStore.setState({ players: [p1, p2, p3, p4], loaded: true, loading: false })
    usePositionsStore.setState({ positions: [pos1, pos2, pos3], loaded: true, loading: false })

    const { container } = renderPreGameLineup()

    await waitFor(() => {
      expect(screen.getByText(/0 players assigned/i)).toBeInTheDocument()
    })

    const svg = container.querySelector('svg[role="img"]')!
    const slotGroups = svg.querySelectorAll('g')
    expect(slotGroups.length).toBe(3)

    const firstSlot = slotGroups[0]
    expect(firstSlot).toBeTruthy()

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { getData: () => p1.id },
      writable: false,
    })
    fireEvent(firstSlot as unknown as HTMLElement, dropEvent)

    await waitFor(() => {
      expect(screen.getByText(/1 players assigned/)).toBeInTheDocument()
    })
  })
})
