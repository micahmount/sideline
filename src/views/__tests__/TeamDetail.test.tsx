import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTeamsStore } from '../../stores/teams'
import { usePlayersStore } from '../../stores/players'
import TeamDetail from '../TeamDetail'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useTeamsStore.setState({ teams: [], loaded: false, loading: false })
  usePlayersStore.setState({ players: [], loaded: false, loading: false })
  mockExec.mockReset()
})

function renderDetail(path = '/team/t1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/team/:id" element={<TeamDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TeamDetail', () => {
  it('shows team name and format', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Thunder')).toBeInTheDocument()
    })
    expect(screen.getByText('7v7')).toBeInTheDocument()
  })

  it('shows not found for invalid id', async () => {
    mockExec.mockResolvedValue([])
    renderDetail('/team/nonexistent')

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  it('shows roster tab by default', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /roster/i })).toBeInTheDocument()
    })
  })

  it('shows placeholder tabs for Positions, Profiles, Games', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /roster/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /positions/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /profiles/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /games/i })).toBeInTheDocument()
    })
  })

  it('switches tabs', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /roster/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /positions/i }))
    expect(screen.getByRole('heading', { name: /position templates/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /profiles/i }))
    expect(screen.getByRole('heading', { name: /playing time profiles/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /games/i }))
    expect(screen.getByRole('heading', { name: /game schedule/i })).toBeInTheDocument()
  })

  it('shows empty roster state', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/no players/i)).toBeInTheDocument()
    })
  })

  it('renders player list in roster tab', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([
        { id: 'p1', team_id: 't1', name: 'Alex', jersey_number: '10', is_active: 1 },
        { id: 'p2', team_id: 't1', name: 'Jordan', jersey_number: '7', is_active: 1 },
      ])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeInTheDocument()
    })
    expect(screen.getByText('#10')).toBeInTheDocument()
    expect(screen.getByText('Jordan')).toBeInTheDocument()
    expect(screen.getByText('#7')).toBeInTheDocument()
  })

  it('shows inactive badge for inactive players', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([
        { id: 'p1', team_id: 't1', name: 'Alex', jersey_number: '10', is_active: 0 },
      ])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/inactive/i)).toBeInTheDocument()
    })
  })

  it('adds a player via inline form', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add player/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add player/i }))

    const nameInput = screen.getByPlaceholderText(/player name/i)
    await userEvent.type(nameInput, 'Sam')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      const s = usePlayersStore.getState()
      expect(s.players).toHaveLength(1)
      expect(s.players[0]!.name).toBe('Sam')
    })
  })

  it('toggles player active status', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([
        { id: 'p1', team_id: 't1', name: 'Alex', jersey_number: '10', is_active: 1 },
      ])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    await userEvent.click(screen.getByRole('checkbox'))

    await waitFor(() => {
      const s = usePlayersStore.getState()
      expect(s.players[0]!.isActive).toBe(false)
    })
  })
})
