import { render, screen, waitFor } from '@testing-library/react'
import { TestRouter } from '../../test/router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSeasonsStore } from '../../stores/seasons'
import Home from '../Home'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useSeasonsStore.setState({ seasons: [], loaded: false, loading: false })
  mockExec.mockReset()
})

function renderHome() {
  return render(
    <TestRouter>
      <Home />
    </TestRouter>,
  )
}

describe('Home', () => {
  it('shows empty state when no seasons', async () => {
    mockExec.mockResolvedValue([])
    renderHome()

    await waitFor(() => {
      expect(screen.getByText(/no seasons/i)).toBeInTheDocument()
    })
  })

  it('renders a list of seasons', async () => {
    mockExec.mockResolvedValue([
      { id: '1', coach_id: 'c1', name: 'Spring 2026', year: 2026, division: 'U12' },
      { id: '2', coach_id: 'c1', name: 'Fall 2025', year: 2025, division: 'U10' },
    ])
    renderHome()

    await waitFor(() => {
      expect(screen.getByText('Spring 2026')).toBeInTheDocument()
    })
    expect(screen.getByText('Fall 2025')).toBeInTheDocument()
  })

  it('has a create link', async () => {
    mockExec.mockResolvedValue([])
    renderHome()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /create/i })).toBeInTheDocument()
    })
  })

  it('create link points to /season/new', async () => {
    mockExec.mockResolvedValue([])
    renderHome()

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /create/i })
      expect(link).toHaveAttribute('href', '/season/new')
    })
  })

  it('shows season year and division', async () => {
    mockExec.mockResolvedValue([
      { id: '1', coach_id: 'c1', name: 'Spring', year: 2026, division: 'U12' },
    ])
    renderHome()

    await waitFor(() => {
      expect(screen.getByText(/2026/)).toBeInTheDocument()
      expect(screen.getByText(/U12/)).toBeInTheDocument()
    })
  })
})
