import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { GameEvent } from '../types'
import { exec } from '../db/client'
import { listEvents } from '../db/queries/events'
import { randomId } from '../lib/randomId'

const EVENT_LABELS: Record<string, string> = {
  GAME_STARTED: 'Game Started',
  PERIOD_STARTED: 'Period Started',
  PERIOD_ENDED: 'Period Ended',
  CLOCK_PAUSED: 'Clock Paused',
  CLOCK_RESUMED: 'Clock Resume',
  SUB_EXECUTED: 'Substitution',
  SUB_CORRECTED: 'Sub Corrected',
  LINEUP_ADJUSTED: 'Lineup Adjusted',
  STOPPAGE_ADDED: 'Stoppage Added',
  GAME_ENDED: 'Game Ended',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatPayload(type: string, payload: Record<string, unknown>): string {
  switch (type) {
    case 'SUB_EXECUTED':
    case 'SUB_CORRECTED':
      return `${String(payload.playerOutId).slice(0, 8)} → ${String(payload.playerInId).slice(0, 8)}`
    case 'STOPPAGE_ADDED':
      return `+${String(payload.seconds)}s`
    case 'PERIOD_STARTED':
      return `Period ${String(payload.period)}`
    default:
      return ''
  }
}

export default function EventLog() {
  const { id } = useParams<{ id: string }>()
  const [events, setEvents] = useState<GameEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    listEvents(exec, id)
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [id])

  async function handleEdit(event: GameEvent) {
    if (!id) return
    const newPlayerOut = prompt('Correct: Player OUT id:', (event.payload as Record<string, string>).playerOutId ?? '')
    if (!newPlayerOut) return
    const newPlayerIn = prompt('Correct: Player IN id:', (event.payload as Record<string, string>).playerInId ?? '')
    if (!newPlayerIn) return

    await exec(
      'UPDATE game_events SET is_edited = 1 WHERE id = ? AND game_id = ?',
      [event.id, id],
    )

    const corrId = randomId()
    await exec(
      `INSERT INTO game_events (id, game_id, type, payload, game_clock_seconds, wall_time)
       VALUES (?, ?, 'SUB_CORRECTED', ?, ?, ?)`,
      [corrId, id, JSON.stringify({ correctsEventId: event.id, playerOutId: newPlayerOut, playerInId: newPlayerIn, positionId: null }), event.gameClockSeconds, new Date().toISOString()],
    )

    const updated = await listEvents(exec, id)
    setEvents(updated)
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Loading events...</div>
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to={`/game/${id}/live`} className="text-blue-600 hover:underline">&larr; Back to Game</Link>

      <h1 className="text-xl font-bold mt-4 mb-4">Event Log</h1>

      {events.length === 0 ? (
        <p className="text-gray-500">No events yet.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border text-sm ${event.isEdited ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{EVENT_LABELS[event.type] ?? event.type}</span>
                <span className="text-xs text-gray-400 font-mono">{formatTime(event.gameClockSeconds)}</span>
              </div>
              {formatPayload(event.type, event.payload) && (
                <p className="text-gray-600 mt-1">{formatPayload(event.type, event.payload)}</p>
              )}
              <div className="flex items-center justify-between mt-1">
                {event.isEdited && <span className="text-xs text-amber-600">Edited</span>}
                {(event.type === 'SUB_EXECUTED' && !event.isEdited) && (
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
