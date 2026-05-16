import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from '../../test/router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTeamsStore } from '../../stores/teams'
import CreateTeam from '../CreateTeam'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useTeamsStore.setState({ teams: [], loaded: false, loading: false })
  mockExec.mockReset()
})

function renderCreate(seasonId = 'season-1') {
  return render(
    <TestRouter initialEntries={[`/season/${seasonId}/team/new`]}>
      <Routes>
        <Route path="/season/:seasonId/team/new" element={<CreateTeam />} />
      </Routes>
    </TestRouter>,
  )
}

describe('CreateTeam', () => {
  it('renders the form', () => {
    renderCreate()
    expect(screen.getByLabelText(/team name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/format/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('submits the form and creates a team', async () => {
    mockExec.mockResolvedValue([])
    renderCreate()

    await userEvent.type(screen.getByLabelText(/team name/i), 'Thunder')
    await userEvent.selectOptions(screen.getByLabelText(/format/i), '7v7')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(useTeamsStore.getState().teams).toHaveLength(1)
    })
    const team = useTeamsStore.getState().teams[0]!
    expect(team.name).toBe('Thunder')
    expect(team.format).toBe('7v7')
    expect(team.fieldPlayerCount).toBe(7)
  })

  it('shows field player count input for custom format', async () => {
    renderCreate()

    await userEvent.selectOptions(screen.getByLabelText(/format/i), 'custom')

    await waitFor(() => {
      expect(screen.getByLabelText(/field players/i)).toBeInTheDocument()
    })
  })

  it('hides field player count for preset formats', () => {
    renderCreate()

    expect(screen.queryByLabelText(/field players/i)).not.toBeInTheDocument()
  })

  it('shows validation error for empty name', async () => {
    renderCreate()
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/name.*required/i)).toBeInTheDocument()
    })
  })

  it('has a back link', () => {
    renderCreate('season-1')
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/season/season-1')
  })
})
