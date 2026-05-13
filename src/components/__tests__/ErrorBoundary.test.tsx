import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  consoleSpy.mockClear()
})

function Bomb({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('💥')
  }
  return <div>working</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>hello</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('catches a thrown error and shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('logs the error to console.error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ErrorBoundary'),
      expect.any(Error),
      expect.any(Object),
    )
  })

  it('re-renders children after "Try Again" resets error state', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('working')).toBeInTheDocument()
  })
})
