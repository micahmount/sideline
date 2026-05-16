import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from '../../test/router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSeasonsStore } from '../../stores/seasons'
import { useCoachesStore } from '../../stores/coaches'
import CreateSeason from '../CreateSeason'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useSeasonsStore.setState({ seasons: [], loaded: false, loading: false })
  useCoachesStore.setState({ coach: { id: 'c1', name: 'Coach', email: 'c@c.com' }, loaded: true, loading: false })
  mockExec.mockReset()
})

function renderCreate() {
  return render(
    <TestRouter initialEntries={['/season/new']}>
      <Routes>
        <Route path="/season/new" element={<CreateSeason />} />
      </Routes>
    </TestRouter>,
  )
}

describe('CreateSeason', () => {
  it('renders the form', () => {
    renderCreate()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/division/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('submits the form and navigates home', async () => {
    mockExec.mockResolvedValue([])
    renderCreate()

    await userEvent.type(screen.getByLabelText(/name/i), 'Spring 2026')
    await userEvent.type(screen.getByLabelText(/year/i), '2026')
    await userEvent.type(screen.getByLabelText(/division/i), 'U12')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(useSeasonsStore.getState().seasons).toHaveLength(1)
    })
    const season = useSeasonsStore.getState().seasons[0]!
    expect(season.name).toBe('Spring 2026')
  })

  it('shows validation error for empty name', async () => {
    renderCreate()
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/name.*required/i)).toBeInTheDocument()
    })
  })
})
