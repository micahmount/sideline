import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from '../../test/router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTeamsStore } from '../../stores/teams'
import { usePlayersStore } from '../../stores/players'
import { usePositionsStore } from '../../stores/positions'
import { useProfilesStore } from '../../stores/profiles'
import { useGamesStore } from '../../stores/games'
import TeamDetail from '../TeamDetail'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useTeamsStore.setState({ teams: [], loaded: false, loading: false })
  usePlayersStore.setState({ players: [], loaded: false, loading: false })
  usePositionsStore.setState({ positions: [], loaded: false, loading: false })
  useProfilesStore.setState({ profiles: [], loaded: false, loading: false })
  useGamesStore.setState({ games: [], loaded: false, loading: false, currentRoster: [] })
  mockExec.mockReset()
  mockExec.mockImplementation(() => Promise.resolve([]))
})

function renderDetail(path = '/team/t1') {
  return render(
    <TestRouter initialEntries={[path]}>
      <Routes>
        <Route path="/team/:id" element={<TeamDetail />} />
      </Routes>
    </TestRouter>,
  )
}

describe('TeamDetail', () => {
  it('shows team name and format', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
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
      .mockResolvedValueOnce([])
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
      .mockResolvedValueOnce([])
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
      .mockResolvedValueOnce([])
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
      .mockResolvedValueOnce([])
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
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
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
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
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
      .mockResolvedValueOnce([])
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

  describe('roster tab delete', () => {
    it('shows delete button on each player row', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([
          { id: 'p1', team_id: 't1', name: 'Alex', jersey_number: '10', is_active: 1 },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Alex')).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/delete alex/i)).toBeInTheDocument()
    })

    it('deletes a player and shows undo toast', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([
          { id: 'p1', team_id: 't1', name: 'Alex', jersey_number: '10', is_active: 1 },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Alex')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByLabelText(/delete alex/i))

      await waitFor(() => {
        expect(screen.getByText(/player deleted/i)).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()

      const s = usePlayersStore.getState()
      expect(s.players).toHaveLength(0)
    })

    it('undo restores the deleted player', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([
          { id: 'p1', team_id: 't1', name: 'Alex', jersey_number: '10', is_active: 1 },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Alex')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByLabelText(/delete alex/i))

      await waitFor(() => {
        expect(screen.getByText(/player deleted/i)).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /undo/i }))

      await waitFor(() => {
        const s = usePlayersStore.getState()
        expect(s.players).toHaveLength(1)
        expect(s.players[0]!.name).toBe('Alex')
      })
    })
  })

  describe('positions tab', () => {
    it('shows empty positions state', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /positions/i }))

      await waitFor(() => {
        expect(screen.getByText(/no position slots/i)).toBeInTheDocument()
      })
    })

    it('renders position slots grouped by template', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'pt1', team_id: 't1', template_name: '4-3-3', slot_name: 'LB', category: 'DEF', field_x: 0.2, field_y: 0.3 },
          { id: 'pt2', team_id: 't1', template_name: '4-3-3', slot_name: 'ST', category: 'FWD', field_x: 0.5, field_y: 0.1 },
        ])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /positions/i }))

      await waitFor(() => {
        expect(screen.getByText('LB')).toBeInTheDocument()
        expect(screen.getByText('ST')).toBeInTheDocument()
        expect(screen.getByText('4-3-3')).toBeInTheDocument()
      })
    })

    it('adds a position slot', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /positions/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add slot/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /add slot/i }))
      await userEvent.type(screen.getByPlaceholderText(/template name/i), '4-4-2')
      await userEvent.type(screen.getByPlaceholderText(/slot name/i), 'CF')
      await userEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        const s = usePositionsStore.getState()
        expect(s.positions).toHaveLength(1)
        expect(s.positions[0]!.slotName).toBe('CF')
      })
    })

    it('deletes a position slot', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'pt1', team_id: 't1', template_name: '4-3-3', slot_name: 'LB', category: 'DEF', field_x: 0.2, field_y: 0.3 },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /positions/i }))

      await waitFor(() => {
        expect(screen.getByText('LB')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        const s = usePositionsStore.getState()
        expect(s.positions).toHaveLength(0)
      })
    })

    it('shows segmented control in positions tab', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /positions/i }))

      await waitFor(() => {
        expect(screen.getByText('Field')).toBeInTheDocument()
        expect(screen.getByText('List')).toBeInTheDocument()
      })
    })

    it('shows field view with slots when Field is clicked', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'pt1', team_id: 't1', template_name: '4-3-3', slot_name: 'LB', category: 'DEF', field_x: 0.2, field_y: 0.3 },
          { id: 'pt2', team_id: 't1', template_name: '4-3-3', slot_name: 'ST', category: 'FWD', field_x: 0.5, field_y: 0.1 },
        ])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /positions/i }))

      await waitFor(() => {
        expect(screen.getByText('Field')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /^Field$/i }))

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /soccer field/i })).toBeInTheDocument()
      })
    })
  })

  describe('profiles tab', () => {
    it('shows empty profiles state', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /profiles/i }))

      await waitFor(() => {
        expect(screen.getByText(/no profiles/i)).toBeInTheDocument()
      })
    })

    it('renders profile list', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'pr1', team_id: 't1', name: 'Equal Time', strategy: 'equal_time', config: '{}' },
        ])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /profiles/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /playing time profiles/i })).toBeInTheDocument()
      })
    })

    it('shows strategy label on profiles', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'pr1', team_id: 't1', name: 'Equal Time', strategy: 'equal_time', config: '{}' },
        ])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /profiles/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /playing time profiles/i })).toBeInTheDocument()
      })
    })

    it('hides delete button for Equal Time profile', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'pr1', team_id: 't1', name: 'Equal Time', strategy: 'equal_time', config: '{}' },
        ])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /profiles/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /playing time profiles/i })).toBeInTheDocument()
      })

      expect(screen.queryAllByRole('button', { name: /delete/i }).length).toBe(0)
    })

    it('adds a profile', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /profiles/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add profile/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /add profile/i }))
      await userEvent.type(screen.getByPlaceholderText(/profile name/i), 'My Custom')
      await userEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        const s = useProfilesStore.getState()
        expect(s.profiles).toHaveLength(1)
        expect(s.profiles[0]!.name).toBe('My Custom')
      })
    })

    it('deletes a non-Equal-Time profile', async () => {
      mockExec
        .mockResolvedValueOnce([{ id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'pr1', team_id: 't1', name: 'Custom', strategy: 'custom', config: '{}' },
        ])
        .mockResolvedValueOnce([])
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Thunder')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('tab', { name: /profiles/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /playing time profiles/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        const s = useProfilesStore.getState()
        expect(s.profiles).toHaveLength(0)
      })
    })
  })
})
