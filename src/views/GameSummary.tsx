import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { exec } from '../db/client'
import { listEvents } from '../db/queries/events'
import { getGame } from '../db/queries/games'
import type { Game, GameEvent } from '../types'

export default function GameSummary() {
  const { id } = useParams<{ id: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getGame(exec, id),
      listEvents(exec, id),
    ]).then(([g, evts]) => {
      setGame(g)
      setEvents(evts)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return <div className="p-4 text-gray-500">Loading summary...</div>
  }

  if (!game) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
        <p className="text-gray-500 mt-8">Game not found.</p>
      </div>
    )
  }

  const subEvents = events.filter((e) => e.type === 'SUB_EXECUTED')
  const totalSeconds = game.periodCount * game.periodLengthMinutes * 60

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to={`/team/${game.teamId}`} className="text-blue-600 hover:underline">&larr; Back to Team</Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">Game Summary</h1>
      <p className="text-gray-500 mb-6">vs {game.opponent} &middot; Final</p>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold">{game.periodCount}</div>
            <div className="text-xs text-gray-500">Periods</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold">{game.periodLengthMinutes}</div>
            <div className="text-xs text-gray-500">Min/Period</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold">{Math.floor(totalSeconds / 60)}</div>
            <div className="text-xs text-gray-500">Total Min</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Substitutions</h3>
          <p className="text-2xl font-bold">{subEvents.length}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Events</h3>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
      </div>
    </div>
  )
}
