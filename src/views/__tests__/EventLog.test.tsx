import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import EventLog from '../EventLog'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  mockExec.mockReset()
  mockExec.mockImplementation(() => Promise.resolve([]))
})

function renderEventLog(gameId = 'g1') {
  return render(
    <MemoryRouter initialEntries={[`/game/${gameId}/events`]}>
      <Routes>
        <Route path="/game/:id/events" element={<EventLog />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EventLog', () => {
  it('shows loading state', () => {
    mockExec.mockImplementation(() => new Promise(() => {}))
    renderEventLog()
    expect(screen.getByText(/loading events/i)).toBeInTheDocument()
  })

  it('shows empty state when no events', async () => {
    renderEventLog()
    await waitFor(() => {
      expect(screen.getByText(/no events yet/i)).toBeInTheDocument()
    })
  })

  it('renders a list of events', async () => {
    mockExec.mockImplementation(() => Promise.resolve([
      { id: 'e1', game_id: 'g1', type: 'GAME_STARTED', payload: '{}', game_clock_seconds: 0, wall_time: '2026-04-01T10:00:00Z', is_edited: 0 },
      { id: 'e2', game_id: 'g1', type: 'PERIOD_STARTED', payload: JSON.stringify({ period: 1 }), game_clock_seconds: 0, wall_time: '2026-04-01T10:00:01Z', is_edited: 0 },
      { id: 'e3', game_id: 'g1', type: 'SUB_EXECUTED', payload: JSON.stringify({ playerOutId: 'p1', playerInId: 'p2', positionId: null }), game_clock_seconds: 300, wall_time: '2026-04-01T10:05:00Z', is_edited: 0 },
    ]))
    renderEventLog()

    await waitFor(() => {
      expect(screen.getByText('Game Started')).toBeInTheDocument()
    })
    expect(screen.getByText('Substitution')).toBeInTheDocument()
  })

  it('shows back link to game', async () => {
    renderEventLog()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to game/i })).toBeInTheDocument()
    })
  })
})
