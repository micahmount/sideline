import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCoachesStore } from '../../stores/coaches'
import CoachSetup from '../CoachSetup'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useCoachesStore.setState({ coach: null, loaded: false, loading: false })
  mockExec.mockReset()
})

function renderSetup() {
  return render(<CoachSetup />)
}

describe('CoachSetup', () => {
  it('renders the form', () => {
    renderSetup()
    expect(screen.getByText(/welcome to sideline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })

  it('submits the form and creates a coach', async () => {
    mockExec.mockResolvedValue([])
    renderSetup()

    await userEvent.type(screen.getByLabelText(/name/i), 'Coach Micah')
    await userEvent.type(screen.getByLabelText(/email/i), 'micah@example.com')
    await userEvent.click(screen.getByRole('button', { name: /get started/i }))

    await waitFor(() => {
      expect(useCoachesStore.getState().coach).not.toBeNull()
    })
    const coach = useCoachesStore.getState().coach!
    expect(coach.name).toBe('Coach Micah')
    expect(coach.email).toBe('micah@example.com')
  })

  it('shows validation error for empty name', async () => {
    renderSetup()
    await userEvent.click(screen.getByRole('button', { name: /get started/i }))

    await waitFor(() => {
      expect(screen.getByText(/name.*required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for empty email', async () => {
    renderSetup()
    await userEvent.type(screen.getByLabelText(/name/i), 'Coach')
    await userEvent.click(screen.getByRole('button', { name: /get started/i }))

    await waitFor(() => {
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument()
    })
  })
})
