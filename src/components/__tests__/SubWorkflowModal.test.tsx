import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SubWorkflowModal from '../SubWorkflowModal'
import type { Player, PositionTemplate, FieldAssignment } from '../../types'

const players: Player[] = [
  { id: 'p-out', name: 'Alice', teamId: 't-1', jerseyNumber: '10', isActive: true },
  { id: 'p-in', name: 'Bob', teamId: 't-1', jerseyNumber: '7', isActive: true },
]

const onField: FieldAssignment[] = [
  { playerId: 'p-out', positionId: 'pos-1', positionName: 'GK', secondsOnFieldThisPeriod: 0, secondsOnFieldThisGame: 0 },
]

const bench = [{ playerId: 'p-in', secondsOnFieldThisGame: 0, targetMinutes: 30, deficitSeconds: 0 }]

const positionTemplates: PositionTemplate[] = [
  { id: 'pos-2', teamId: 't-1', templateName: '4-4-2', slotName: 'LB', category: 'DEF', fieldX: 0.1, fieldY: 0.2 },
]

describe('SubWorkflowModal', () => {
  it('renders step 1 initially', () => {
    render(
      <SubWorkflowModal
        onField={onField}
        bench={bench}
        players={players}
        positionTemplates={positionTemplates}
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    )
    expect(screen.getByTestId('sub-workflow-modal')).toBeInTheDocument()
    expect(screen.getByTestId('sub-workflow-sheet')).toBeInTheDocument()
    expect(screen.getByText(/select player out/i)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('advances through all 4 steps', () => {
    render(
      <SubWorkflowModal
        onField={onField}
        bench={bench}
        players={players}
        positionTemplates={positionTemplates}
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    )
    // step 1 -> 2
    fireEvent.click(screen.getByText(/alice/i))
    expect(screen.getByText(/select player in/i)).toBeInTheDocument()
    // step 2 -> 3
    fireEvent.click(screen.getByText('Bob'))
    expect(screen.getByText(/select position/i)).toBeInTheDocument()
    // step 3 -> 4
    fireEvent.click(screen.getByText(/same position/i))
    expect(screen.getByText(/confirm substitution/i)).toBeInTheDocument()
  })

  it('invokes onConfirm with queue=false for Execute Now', () => {
    const onConfirm = vi.fn()
    render(
      <SubWorkflowModal
        onField={onField}
        bench={bench}
        players={players}
        positionTemplates={positionTemplates}
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    )
    fireEvent.click(screen.getByText(/alice/i))
    fireEvent.click(screen.getByText('Bob'))
    fireEvent.click(screen.getByText(/same position/i))
    fireEvent.click(screen.getByRole('button', { name: /execute now/i }))
    expect(onConfirm).toHaveBeenCalledWith('p-out', 'p-in', null, false)
  })

  it('invokes onConfirm with queue=true for Add to Queue', () => {
    const onConfirm = vi.fn()
    render(
      <SubWorkflowModal
        onField={onField}
        bench={bench}
        players={players}
        positionTemplates={positionTemplates}
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    )
    fireEvent.click(screen.getByText(/alice/i))
    fireEvent.click(screen.getByText('Bob'))
    fireEvent.click(screen.getByText(/same position/i))
    fireEvent.click(screen.getByRole('button', { name: /add to queue/i }))
    expect(onConfirm).toHaveBeenCalledWith('p-out', 'p-in', null, true)
  })

  it('calls onClose from close button', () => {
    const onClose = vi.fn()
    render(
      <SubWorkflowModal
        onField={onField}
        bench={bench}
        players={players}
        positionTemplates={positionTemplates}
        onConfirm={() => {}}
        onClose={onClose}
      />,
    )
    // close button text ×
    fireEvent.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalled()
  })
})