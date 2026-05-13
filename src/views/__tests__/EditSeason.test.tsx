import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSeasonsStore } from '../../stores/seasons'
import EditSeason from '../EditSeason'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useSeasonsStore.setState({ seasons: [], loaded: false, loading: false })
  mockExec.mockReset()
})

function renderEdit(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/season/${id}/edit`]}>
      <Routes>
        <Route path="/season/:id/edit" element={<EditSeason />} />
      </Routes>
    </MemoryRouter>,
  )
}

function seedStore() {
  useSeasonsStore.setState({
    seasons: [{ id: '1', coachId: 'c1', name: 'Spring 2026', year: 2026, division: 'U12' }],
    loaded: true,
    loading: false,
  })
}

describe('EditSeason', () => {
  it('renders the form with pre-populated season data', async () => {
    seedStore()
    renderEdit()

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
      expect(nameInput.value).toBe('Spring 2026')
    })
    const yearInput = screen.getByLabelText(/year/i) as HTMLInputElement
    expect(yearInput.value).toBe('2026')
    const divisionInput = screen.getByLabelText(/division/i) as HTMLInputElement
    expect(divisionInput.value).toBe('U12')
  })

  it('submits the form and updates the season', async () => {
    mockExec.mockResolvedValue([])
    seedStore()
    renderEdit()

    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Fall 2026')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      const season = useSeasonsStore.getState().seasons[0]
      expect(season?.name).toBe('Fall 2026')
    })
  })

  it('shows validation error for empty name', async () => {
    seedStore()
    renderEdit()

    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.clear(nameInput)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/name.*required/i)).toBeInTheDocument()
    })
  })

  it('shows not found for non-existent season', async () => {
    useSeasonsStore.setState({
      seasons: [],
      loaded: true,
      loading: false,
    })
    renderEdit('nonexistent')

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })
})
