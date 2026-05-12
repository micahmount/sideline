import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSeasonsStore } from '../../stores/seasons'
import SeasonDetail from '../SeasonDetail'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useSeasonsStore.setState({ seasons: [], loaded: false, loading: false })
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
    mockExec.mockResolvedValue([
      { id: '1', coach_id: 'c1', name: 'Spring 2026', year: 2026, division: 'U12' },
    ])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Spring 2026')).toBeInTheDocument()
    })
  })

  it('shows season metadata', async () => {
    mockExec.mockResolvedValue([
      { id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' },
    ])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/2026/)).toBeInTheDocument()
      expect(screen.getByText(/U12/)).toBeInTheDocument()
    })
  })

  it('shows teams section placeholder', async () => {
    mockExec.mockResolvedValue([
      { id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' },
    ])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/no teams/i)).toBeInTheDocument()
    })
  })

  it('has edit link and delete button', async () => {
    mockExec.mockResolvedValue([
      { id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' },
    ])
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })
  })

  it('shows a back link', async () => {
    mockExec.mockResolvedValue([
      { id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' },
    ])
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
