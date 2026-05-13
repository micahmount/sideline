import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGameLiveStore } from '../stores/gameLive'
import { usePlayersStore } from '../stores/players'
import { usePositionsStore } from '../stores/positions'
import SoccerField from '../components/SoccerField'
import type { FieldAssignment, PositionTemplate } from '../types'

export default function PreGameLineup() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { gameId, game, init, startGame, loading } = useGameLiveStore()
  const { players, loaded: playersLoaded, load: loadPlayers } = usePlayersStore()
  const { positions, loaded: positionsLoaded, load: loadPositions } = usePositionsStore()

  const [assignments, setAssignments] = useState<Record<string, string | null>>({})
  const [confirming, setConfirming] = useState(false)

  const defaultAssignments = useMemo(() => {
    if (positions.length === 0) return {}
    const grouped = groupByTemplate(positions)
    if (grouped.length === 0) return {}
    const init: Record<string, string | null> = {}
    for (const slot of grouped[0]!.slots) {
      init[slot.id] = null
    }
    return init
  }, [positions])

  const effectiveAssignments = { ...defaultAssignments, ...assignments }

  function setSlotAssignment(slotId: string, playerId: string | null) {
    setAssignments((a) => ({ ...a, [slotId]: playerId }))
  }

  useEffect(() => {
    if (id && !gameId) init(id)
  }, [id, gameId, init])

  useEffect(() => {
    if (game && !playersLoaded) loadPlayers(game.teamId)
  }, [game, playersLoaded, loadPlayers])

  useEffect(() => {
    if (game && !positionsLoaded) loadPositions(game.teamId)
  }, [game, positionsLoaded, loadPositions])

  function groupByTemplate(pos: PositionTemplate[]) {
    const names = [...new Set(pos.map((p) => p.templateName))]
    return names.map((name) => ({
      templateName: name,
      slots: pos.filter((p) => p.templateName === name),
    }))
  }

  function handleRemoveFromSlot(slotId: string) {
    setSlotAssignment(slotId, null)
  }

  async function handleBeginGame() {
    if (!gameId) return
    setConfirming(true)

    const initialLineup: FieldAssignment[] = positions
      .filter((p) => effectiveAssignments[p.id] != null)
      .map((pos) => ({
        playerId: effectiveAssignments[pos.id]!,
        positionId: pos.id,
        positionName: pos.slotName,
        secondsOnFieldThisPeriod: 0,
        secondsOnFieldThisGame: 0,
      }))

    await startGame(initialLineup)
    setConfirming(false)
    navigate(`/game/${gameId}/live`)
  }

  if (loading || !gameId) {
    return <div className="p-4 text-gray-500">Loading game...</div>
  }

  if (!game) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
        <p className="text-gray-500 mt-8">Game not found.</p>
      </div>
    )
  }

  if (loading || !playersLoaded || !positionsLoaded) {
    return <div className="p-4 text-gray-500">Loading roster...</div>
  }

  const assignedPlayerIds = new Set(Object.values(effectiveAssignments).filter(Boolean))
  const availablePlayers = players.filter((p) => p.isActive)
  const benchPlayers = availablePlayers.filter((p) => !assignedPlayerIds.has(p.id))
  const grouped = groupByTemplate(positions)
  const fieldCount = Object.values(effectiveAssignments).filter(Boolean).length

  const fieldSlots = positions
    .filter((p) => effectiveAssignments[p.id] !== undefined)
    .map((pos) => {
      const playerId = effectiveAssignments[pos.id]
      const player = playerId ? players.find((p) => p.id === playerId) : undefined
      return {
        x: pos.fieldX,
        y: pos.fieldY,
        label: pos.slotName,
        playerName: player?.name,
        playerId: player?.id,
        color: player ? '#3b82f6' : undefined,
      }
    })

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to={`/game/${id}/setup`} className="text-blue-600 hover:underline">&larr; Back</Link>

      <h1 className="text-xl font-bold mt-4 mb-2">Pre-Game Lineup</h1>
      <p className="text-sm text-gray-500 mb-4">
        {fieldCount} players assigned ({players.filter((p) => p.isActive).length - fieldCount} on bench)
      </p>

      <SoccerField slots={fieldSlots} />

      {grouped.map((g) => (
        <div key={g.templateName} className="mt-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{g.templateName}</h3>
          <div className="space-y-1">
            {g.slots.map((slot) => {
              const assignedPlayer = effectiveAssignments[slot.id]
                ? players.find((p) => p.id === effectiveAssignments[slot.id])
                : null
              return (
                <div key={slot.id} className="flex items-center justify-between p-2 rounded border border-gray-200 text-sm">
                  <span className="text-gray-700">{slot.slotName}</span>
                  {assignedPlayer ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{assignedPlayer.name}</span>
                      <button
                        onClick={() => handleRemoveFromSlot(slot.id)}
                        className="text-red-500 text-xs hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Empty</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {benchPlayers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Bench</h3>
          <div className="flex flex-wrap gap-2">
            {benchPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const firstEmpty = Object.entries(effectiveAssignments).find(([, v]) => v === null)
                  if (firstEmpty) setSlotAssignment(firstEmpty[0], p.id)
                }}
                className="px-3 py-1.5 rounded-full border border-blue-300 text-blue-700 text-sm hover:bg-blue-50"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleBeginGame}
        disabled={confirming || fieldCount === 0}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {confirming ? 'Starting...' : 'Begin Game'}
      </button>
    </div>
  )
}
