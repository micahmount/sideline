import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import InstallPrompt from '../InstallPrompt'

beforeEach(() => {
  vi.restoreAllMocks()
})

function createMockPromptEvent() {
  const prompt = vi.fn()
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: typeof prompt
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  event.prompt = prompt
  event.userChoice = Promise.resolve({ outcome: 'accepted' as const })
  return { event, prompt }
}

describe('InstallPrompt', () => {
  it('renders nothing when beforeinstallprompt has not fired', () => {
    const { container } = render(<InstallPrompt />)
    expect(container.firstChild).toBeNull()
  })

  it('shows install button after beforeinstallprompt event', () => {
    render(<InstallPrompt />)

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true }))
    })

    expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument()
  })

  it('calls prompt() and hides button on install click', async () => {
    render(<InstallPrompt />)

    const { event, prompt } = createMockPromptEvent()
    act(() => {
      window.dispatchEvent(event)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /install app/i }))
    })

    expect(prompt).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /install app/i })).not.toBeInTheDocument()
  })

  it('hides button on appinstalled event', () => {
    render(<InstallPrompt />)

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true }))
    })

    expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(screen.queryByRole('button', { name: /install app/i })).not.toBeInTheDocument()
  })
})
