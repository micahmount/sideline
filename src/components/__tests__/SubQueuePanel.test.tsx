import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SubQueuePanel from '../SubQueuePanel'
import type { SubQueueEntry, Player } from '../../types'

const baseEntry: SubQueueEntry = {
  id: 'entry-1',
  gameId: 'game-1',
  playerOutId: 'p-out',
  playerInId: 'p-in',
  positionId: 'pos-1',
  queueOrder: 1,
  scheduledAtSeconds: null,
  source: 'coach',
}

const players: Player[] = [
  { id: 'p-out', name: 'Alice', teamId: 't-1', jerseyNumber: '10', isActive: true },
  { id: 'p-in', name: 'Bob', teamId: 't-1', jerseyNumber: '7', isActive: true },
]

describe('SubQueuePanel', () => {
  it('shows scheduled time when scheduledAtSeconds is set', () => {
    const entry: SubQueueEntry = { ...baseEntry, scheduledAtSeconds: 600 }
    render(
      <SubQueuePanel
        entries={[entry]}
        players={players}
        clockSeconds={0}
        onExecuteSub={() => {}}
        onRemoveFromQueue={() => {}}
      />,
    )
    expect(screen.getByText('⏰ at 10 min')).toBeInTheDocument()
  })

  it('does not show time indicator when scheduledAtSeconds is null', () => {
    render(
      <SubQueuePanel
        entries={[baseEntry]}
        players={players}
        clockSeconds={0}
        onExecuteSub={() => {}}
        onRemoveFromQueue={() => {}}
      />,
    )
    expect(screen.queryByText(/⏰/)).not.toBeInTheDocument()
  })

  it('applies overdue highlight when clockSeconds >= scheduledAtSeconds', () => {
    const entry: SubQueueEntry = { ...baseEntry, scheduledAtSeconds: 10 }
    render(
      <SubQueuePanel
        entries={[entry]}
        players={players}
        clockSeconds={60}
        onExecuteSub={() => {}}
        onRemoveFromQueue={() => {}}
      />,
    )
    const entryDiv = screen.getByTestId('sub-queue-entry')
    expect(entryDiv).toHaveClass('bg-amber-50')
    expect(entryDiv).toHaveClass('border-amber-400')
  })

  it('does not apply overdue highlight when clockSeconds < scheduledAtSeconds', () => {
    const entry: SubQueueEntry = { ...baseEntry, scheduledAtSeconds: 100 }
    render(
      <SubQueuePanel
        entries={[entry]}
        players={players}
        clockSeconds={60}
        onExecuteSub={() => {}}
        onRemoveFromQueue={() => {}}
      />,
    )
    const entryDiv = screen.getByTestId('sub-queue-entry')
    expect(entryDiv).not.toHaveClass('bg-amber-50')
  })

  it('shows player names and arrow', () => {
    render(
      <SubQueuePanel
        entries={[baseEntry]}
        players={players}
        clockSeconds={0}
        onExecuteSub={() => {}}
        onRemoveFromQueue={() => {}}
      />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })
})
