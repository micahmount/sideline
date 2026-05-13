import { useState } from 'react'
import type { Player, PositionTemplate, FieldAssignment } from '../types'

interface SubWorkflowModalProps {
  onField: FieldAssignment[]
  bench: { playerId: string; secondsOnFieldThisGame: number; targetMinutes: number; deficitSeconds: number }[]
  players: Player[]
  positionTemplates: PositionTemplate[]
  defaultPlayerOutId?: string
  onConfirm: (playerOutId: string, playerInId: string, positionId: string | null, queue: boolean) => void
  onClose: () => void
}

export default function SubWorkflowModal({
  onField, bench, players, positionTemplates, defaultPlayerOutId, onConfirm, onClose,
}: SubWorkflowModalProps) {
  const [step, setStep] = useState(1)
  const [playerOutId, setPlayerOutId] = useState(defaultPlayerOutId ?? '')
  const [playerInId, setPlayerInId] = useState('')
  const [positionId, setPositionId] = useState<string | null>(null)

  function playerName(id: string): string {
    return players.find((p) => p.id === id)?.name ?? 'Unknown'
  }

  function handleNext() {
    if (step < 4) setStep((s) => s + 1)
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1)
  }

  function handleConfirmNow() {
    if (playerOutId && playerInId) {
      onConfirm(playerOutId, playerInId, positionId, false)
    }
  }

  function handleQueue() {
    if (playerOutId && playerInId) {
      onConfirm(playerOutId, playerInId, positionId, true)
    }
  }

  const benchPlayers = players.filter((p) => bench.some((b) => b.playerId === p.id))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleBack} disabled={step === 1} className="text-gray-500 disabled:opacity-30">&larr; Back</button>
          <span className="text-sm font-medium text-gray-500">Step {step} of 4</span>
          <button onClick={onClose} className="text-gray-500">&times;</button>
        </div>

        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Player Out</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {onField.map((f) => (
                <button
                  key={f.playerId}
                  onClick={() => { setPlayerOutId(f.playerId); handleNext() }}
                  className={`w-full text-left p-3 rounded-lg border text-sm hover:bg-gray-50 ${playerOutId === f.playerId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  {playerName(f.playerId)}
                  <span className="text-xs text-gray-400 ml-2">{f.positionName ?? 'No position'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Player In</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {benchPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPlayerInId(p.id); handleNext() }}
                  className={`w-full text-left p-3 rounded-lg border text-sm hover:bg-gray-50 ${playerInId === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Position</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setPositionId(null); handleNext() }}
                className={`w-full text-left p-3 rounded-lg border text-sm hover:bg-gray-50 ${positionId === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                Same position
              </button>
              {positionTemplates.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => { setPositionId(pt.id); handleNext() }}
                  className={`w-full text-left p-3 rounded-lg border text-sm hover:bg-gray-50 ${positionId === pt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  {pt.slotName}
                  <span className="text-xs text-gray-400 ml-2">{pt.category}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Confirm Substitution</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Out:</span>
                <span className="font-medium">{playerName(playerOutId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">In:</span>
                <span className="font-medium">{playerName(playerInId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Position:</span>
                <span className="font-medium">{positionId ? positionTemplates.find((p) => p.id === positionId)?.slotName ?? 'Same' : 'Same'}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleConfirmNow} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
                Execute Now
              </button>
              <button onClick={handleQueue} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Add to Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
