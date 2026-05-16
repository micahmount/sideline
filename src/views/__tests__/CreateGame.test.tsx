import { render, screen, waitFor } from '@testing-library/react'
import { TestRouter } from '../../test/router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CreateGame from '../CreateGame'
import { useGamesStore } from '../../stores/games'
import { useTeamsStore } from '../../stores/teams'
import { usePlayersStore } from '../../stores/players'
import { useProfilesStore } from '../../stores/profiles'
import { usePositionsStore } from '../../stores/positions'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useGamesStore.setState({ games: [], loaded: false, loading: false, currentRoster: [] })
  useTeamsStore.setState({ teams: [], loaded: false, loading: false })
  usePlayersStore.setState({ players: [], loaded: false, loading: false })
  useProfilesStore.setState({ profiles: [], loaded: false, loading: false })
  usePositionsStore.setState({ positions: [], loaded: false, loading: false })
  mockExec.mockReset()
})

function renderCreateGame(teamId = 't1') {
  return render(
    <TestRouter initialEntries={[`/game/new?teamId=${teamId}`]}>
      <CreateGame />
    </TestRouter>,
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
    usePositionsStore.setState({ positions: [], loaded: true, loading: false })
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
    usePositionsStore.setState({ positions: [], loaded: true, loading: false })
    useTeamsStore.setState({ teams: [{ id: 't1', seasonId: 's1', name: 'Thunder', format: '7v7', fieldPlayerCount: 7 }], loaded: true, loading: false })
    usePlayersStore.setState({ players: [], loaded: true, loading: false })
    useProfilesStore.setState({ profiles: [{ id: 'pr1', teamId: 't1', name: 'Equal Time', strategy: 'equal_time', config: {} }], loaded: true, loading: false })

    renderCreateGame()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument()
    })
  })

  it('submit button is disabled with no opponent', async () => {
    usePositionsStore.setState({ positions: [], loaded: true, loading: false })
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
      <TestRouter initialEntries={['/game/new']}>
        <CreateGame />
      </TestRouter>,
    )
    expect(screen.getByText(/no team selected/i)).toBeInTheDocument()
  })

  it('renders position template picker with template names', async () => {
    useTeamsStore.setState({ teams: [{ id: 't1', seasonId: 's1', name: 'Thunder', format: '7v7', fieldPlayerCount: 7 }], loaded: true, loading: false })
    usePlayersStore.setState({ players: [], loaded: true, loading: false })
    useProfilesStore.setState({ profiles: [{ id: 'pr1', teamId: 't1', name: 'Equal Time', strategy: 'equal_time', config: {} }], loaded: true, loading: false })
    usePositionsStore.setState({
      positions: [
        { id: 's1', teamId: 't1', templateName: '4-3-3', slotName: 'Center Back', category: 'DEF' as const, fieldX: 0.5, fieldY: 0.3 },
        { id: 's2', teamId: 't1', templateName: '4-3-3', slotName: 'Left Mid', category: 'MID' as const, fieldX: 0.3, fieldY: 0.5 },
        { id: 's3', teamId: 't1', templateName: '3-4-3', slotName: 'Right Wing', category: 'FWD' as const, fieldX: 0.8, fieldY: 0.7 },
      ],
      loaded: true, loading: false,
    })

    renderCreateGame()

    await waitFor(() => {
      expect(screen.getByText('Position Template')).toBeInTheDocument()
    })

    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.getByText('4-3-3')).toBeInTheDocument()
    expect(screen.getByText('3-4-3')).toBeInTheDocument()
  })
})
