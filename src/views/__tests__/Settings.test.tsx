import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestRouter } from '../../test/router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from '../../stores/settings'
import Settings from '../Settings'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useSettingsStore.setState({ nudgeHaptic: 'short', nudgeAudio: 'tone', loaded: false })
  mockExec.mockReset()
})

function renderSettings() {
  return render(
    <TestRouter>
      <Settings />
    </TestRouter>,
  )
}

describe('Settings', () => {
  it('renders heading and back link', async () => {
    mockExec.mockResolvedValue([{ nudge_haptic: 'short', nudge_audio: 'tone' }])
    renderSettings()

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument()
  })

  it('shows current haptic selection', async () => {
    mockExec.mockResolvedValue([{ nudge_haptic: 'long', nudge_audio: 'tone' }])
    renderSettings()

    await waitFor(() => {
      expect(screen.getByText('Long pulse')).toBeInTheDocument()
    })
  })

  it('switches haptic on click', async () => {
    mockExec.mockResolvedValue([{ nudge_haptic: 'short', nudge_audio: 'tone' }])
    renderSettings()

    await waitFor(() => {
      expect(screen.getByText('Short pulse')).toBeInTheDocument()
    })

    const offButtons = screen.getAllByText('Off')
    await userEvent.click(offButtons[0]!)
    const s = useSettingsStore.getState()
    expect(s.nudgeHaptic).toBe('off')
  })

  it('switches audio on click', async () => {
    mockExec.mockResolvedValue([{ nudge_haptic: 'short', nudge_audio: 'tone' }])
    renderSettings()

    await waitFor(() => {
      expect(screen.getByText('Subtle tone')).toBeInTheDocument()
    })

    const audioButtons = screen.getAllByText('Off')
    await userEvent.click(audioButtons[1]!)
    const s = useSettingsStore.getState()
    expect(s.nudgeAudio).toBe('off')
  })

  it('shows future placeholder section', async () => {
    mockExec.mockResolvedValue([{ nudge_haptic: 'short', nudge_audio: 'tone' }])
    renderSettings()

    await waitFor(() => {
      expect(screen.getByText(/coming in a future version/i)).toBeInTheDocument()
    })
  })

  it('displays app version in About section', async () => {
    mockExec.mockResolvedValue([{ nudge_haptic: 'short', nudge_audio: 'tone' }])
    renderSettings()

    await waitFor(() => {
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Version')).toBeInTheDocument()
      // Version should be in semantic format (e.g., 0.1.0)
      const versionElement = screen.getByText(/^\d+\.\d+\.\d+$/)
      expect(versionElement).toBeInTheDocument()
    })
  })
})
