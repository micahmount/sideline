import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSeasonsStore } from '../../stores/seasons'
import { useTeamsStore } from '../../stores/teams'
import SeasonDetail from '../SeasonDetail'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useSeasonsStore.setState({ seasons: [], loaded: false, loading: false })
  useTeamsStore.setState({ teams: [], loaded: false, loading: false })
  mockExec.mockReset()
})

function renderDetail(path = '/season/1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/season/:id" element={<SeasonDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SeasonDetail', () => {
  it('shows season name', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: '1', coach_id: 'c1', name: 'Spring 2026', year: 2026, division: 'U12' }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Spring 2026')).toBeInTheDocument()
    })
  })

  it('shows season metadata', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/2026/)).toBeInTheDocument()
      expect(screen.getByText(/U12/)).toBeInTheDocument()
    })
  })

  it('shows teams section placeholder when no teams', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/no teams/i)).toBeInTheDocument()
    })
  })

  it('renders a list of teams', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' }])
      .mockResolvedValueOnce([
        { id: 't1', season_id: '1', name: 'Thunder', format: '7v7', field_player_count: 7 },
      ])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Thunder')).toBeInTheDocument()
    })
    expect(screen.getByText('7v7')).toBeInTheDocument()
  })

  it('has add team link', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add team/i })).toHaveAttribute('href', '/season/1/team/new')
    })
  })

  it('has edit link and delete button', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })
  })

  it('shows a back link', async () => {
    mockExec
      .mockResolvedValueOnce([{ id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' }])
      .mockResolvedValueOnce([])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument()
    })
  })

  it('shows not found for invalid id', async () => {
    mockExec.mockResolvedValue([])
    renderDetail('/season/nonexistent')

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })
})
