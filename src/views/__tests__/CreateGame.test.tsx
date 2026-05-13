import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CreateGame from '../CreateGame'
import { useGamesStore } from '../../stores/games'
import { useTeamsStore } from '../../stores/teams'
import { usePlayersStore } from '../../stores/players'
import { useProfilesStore } from '../../stores/profiles'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

const teamRow = { id: 't1', season_id: 's1', name: 'Thunder', format: '7v7', field_player_count: 7 }
const profileRow = { id: 'pr1', team_id: 't1', name: 'Equal Time', strategy: 'equal_time', config: '{}' }
const playerRows = [
  { id: 'p1', team_id: 't1', name: 'Ali', jersey_number: '10', is_active: 1 },
  { id: 'p2', team_id: 't1', name: 'Ben', jersey_number: '7', is_active: 1 },
]

beforeEach(() => {
  useGamesStore.setState({ games: [], loaded: false, loading: false, currentRoster: [] })
  useTeamsStore.setState({ teams: [], loaded: false, loading: false })
  usePlayersStore.setState({ players: [], loaded: false, loading: false })
  useProfilesStore.setState({ profiles: [], loaded: false, loading: false })
  mockExec.mockReset()
})

function renderCreateGame(teamId = 't1') {
  return render(
    <MemoryRouter initialEntries={[`/game/new?teamId=${teamId}`]}>
      <CreateGame />
    </MemoryRouter>,
  )
}

describe('CreateGame', () => {
  it('shows loading while data loads', () => {
    mockExec.mockResolvedValue([])
    renderCreateGame()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the form after loading', async () => {
    mockExec.mockResolvedValue([])
    await useTeamsStore.getState().loadById('t1')
    mockExec.mockReset()
    mockExec.mockResolvedValue([])
    await useProfilesStore.getState().load('t1')

    useTeamsStore.setState({ teams: [{ id: 't1', seasonId: 's1', name: 'Thunder', format: '7v7', fieldPlayerCount: 7 }], loaded: true, loading: false })
    usePlayersStore.setState({ players: [], loaded: true, loading: false })
    useProfilesStore.setState({ profiles: [{ id: 'pr1', teamId: 't1', name: 'Equal Time', strategy: 'equal_time', config: {} }], loaded: true, loading: false })

    renderCreateGame()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/opponent/i)).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
  })

  it('shows roster availability checklist', async () => {
    useTeamsStore.setState({ teams: [{ id: 't1', seasonId: 's1', name: 'Thunder', format: '7v7', fieldPlayerCount: 7 }], loaded: true, loading: false })
    usePlayersStore.setState({
      players: [{ id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true }, { id: 'p2', teamId: 't1', name: 'Ben', jerseyNumber: '7', isActive: true }],
      loaded: true, loading: false,
    })
    useProfilesStore.setState({ profiles: [{ id: 'pr1', teamId: 't1', name: 'Equal Time', strategy: 'equal_time', config: {} }], loaded: true, loading: false })

    renderCreateGame()

    await waitFor(() => {
      expect(screen.getByText('Ali')).toBeInTheDocument()
    })

    expect(screen.getByText('Ben')).toBeInTheDocument()
    expect(screen.getByText(/2 of 2/i)).toBeInTheDocument()
  })

  it('renders back link', async () => {
    useTeamsStore.setState({ teams: [{ id: 't1', seasonId: 's1', name: 'Thunder', format: '7v7', fieldPlayerCount: 7 }], loaded: true, loading: false })
    usePlayersStore.setState({ players: [], loaded: true, loading: false })
    useProfilesStore.setState({ profiles: [{ id: 'pr1', teamId: 't1', name: 'Equal Time', strategy: 'equal_time', config: {} }], loaded: true, loading: false })

    renderCreateGame()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument()
    })
  })

  it('submit button is disabled with no opponent', async () => {
    useTeamsStore.setState({ teams: [{ id: 't1', seasonId: 's1', name: 'Thunder', format: '7v7', fieldPlayerCount: 7 }], loaded: true, loading: false })
    usePlayersStore.setState({ players: [], loaded: true, loading: false })
    useProfilesStore.setState({ profiles: [{ id: 'pr1', teamId: 't1', name: 'Equal Time', strategy: 'equal_time', config: {} }], loaded: true, loading: false })

    renderCreateGame()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start game/i })).toBeDisabled()
    })
  })

  it('shows no team message when teamId missing', () => {
    render(
      <MemoryRouter initialEntries={['/game/new']}>
        <CreateGame />
      </MemoryRouter>,
    )
    expect(screen.getByText(/no team selected/i)).toBeInTheDocument()
  })
})
