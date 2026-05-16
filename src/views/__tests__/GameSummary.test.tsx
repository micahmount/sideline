import { render, screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from '../../test/router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GameSummary from '../GameSummary'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  mockExec.mockReset()
})

function renderSummary(gameId = 'g1') {
  return render(
    <TestRouter initialEntries={[`/game/${gameId}/summary`]}>
      <Routes>
        <Route path="/game/:id/summary" element={<GameSummary />} />
      </Routes>
    </TestRouter>,
  )
}

describe('GameSummary', () => {
  it('shows loading state', () => {
    mockExec.mockImplementation(() => new Promise(() => {}))
    renderSummary()
    expect(screen.getByText(/loading summary/i)).toBeInTheDocument()
  })

  it('shows not found for missing game', async () => {
    mockExec.mockResolvedValue([])
    renderSummary('nonexistent')

    await waitFor(() => {
      expect(screen.getByText(/game not found/i)).toBeInTheDocument()
    })
  })

  it('shows game info', async () => {
    mockExec
      .mockResolvedValueOnce([{
        id: 'g1', team_id: 't1', profile_id: 'p1',
        opponent: 'Tornadoes', scheduled_at: '2026-05-01T10:00:00Z',
        period_count: 2, period_length_minutes: 25,
        stoppage_seconds: 0, status: 'final',
      }])
      .mockResolvedValueOnce([])
    renderSummary()

    await waitFor(() => {
      expect(screen.getByText(/tornadoes/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/final/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('shows empty player minutes when no events', async () => {
    mockExec
      .mockResolvedValueOnce([{
        id: 'g1', team_id: 't1', profile_id: 'p1',
        opponent: 'Tornadoes', scheduled_at: '2026-05-01T10:00:00Z',
        period_count: 2, period_length_minutes: 25,
        stoppage_seconds: 0, status: 'final',
      }])
      .mockResolvedValueOnce([])
    renderSummary()

    await waitFor(() => {
      expect(screen.getByText(/no player data/i)).toBeInTheDocument()
    })
  })

  it('shows player minutes from event replay', async () => {
    mockExec
      .mockResolvedValueOnce([{
        id: 'g1', team_id: 't1', profile_id: 'p1',
        opponent: 'Tornadoes', scheduled_at: '2026-05-01T10:00:00Z',
        period_count: 1, period_length_minutes: 10,
        stoppage_seconds: 0, status: 'final',
      }])
      .mockResolvedValueOnce([
        {
          id: 'e1', game_id: 'g1', type: 'GAME_STARTED',
          payload: '{}', game_clock_seconds: 0, wall_time: '2026-05-01T10:00:00Z', is_edited: 0,
        },
        {
          id: 'e2', game_id: 'g1', type: 'PERIOD_STARTED',
          payload: '{"period":1}', game_clock_seconds: 0, wall_time: '2026-05-01T10:00:01Z', is_edited: 0,
        },
        {
          id: 'e3', game_id: 'g1', type: 'GAME_ENDED',
          payload: '{}', game_clock_seconds: 0, wall_time: '2026-05-01T10:10:00Z', is_edited: 0,
        },
      ])
      .mockResolvedValue([
        { id: 'p1', team_id: 't1', name: 'Alex', jersey_number: '10', is_active: 1 },
        { id: 'p2', team_id: 't1', name: 'Jordan', jersey_number: '7', is_active: 1 },
      ])
    renderSummary()

    await waitFor(() => {
      expect(screen.getByText(/player minutes/i)).toBeInTheDocument()
    })
  })

  it('links to event log', async () => {
    mockExec
      .mockResolvedValueOnce([{
        id: 'g1', team_id: 't1', profile_id: 'p1',
        opponent: 'Tornadoes', scheduled_at: '2026-05-01T10:00:00Z',
        period_count: 2, period_length_minutes: 25,
        stoppage_seconds: 0, status: 'final',
      }])
      .mockResolvedValueOnce([])
    renderSummary()

    await waitFor(() => {
      expect(screen.getByText(/view event log/i)).toBeInTheDocument()
    })
  })
})
