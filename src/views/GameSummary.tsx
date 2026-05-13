import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { exec } from '../db/client'
import { listEvents } from '../db/queries/events'
import { getGame } from '../db/queries/games'
import { replayEvents } from '../engine/replay'
import type { Game, GameEvent, Player } from '../types'

interface PlayerMinutes {
  playerId: string
  name: string
  secondsOnField: number
  minutesPlayed: number
  subCount: number
}

export default function GameSummary() {
  const { id } = useParams<{ id: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [, setEvents] = useState<GameEvent[]>([])
  const [playerMinutes, setPlayerMinutes] = useState<PlayerMinutes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getGame(exec, id),
      listEvents(exec, id),
    ]).then(([g, evts]) => {
      setGame(g)
      setEvents(evts)

      if (g && evts.length > 0) {
        const state = replayEvents(evts, Date.now())
        exec('SELECT * FROM players WHERE team_id = ?', [g.teamId]).then((rows) => {
          const players = rows as unknown as Player[]
          const playerMap = new Map(players.map((p) => [p.id, p.name]))
          const subEvents = evts.filter((e) => e.type === 'SUB_EXECUTED')
          const subCounts = new Map<string, number>()
          for (const se of subEvents) {
            const payload = se.payload as { playerInId?: string; playerOutId?: string }
            if (payload.playerInId) subCounts.set(payload.playerInId, (subCounts.get(payload.playerInId) ?? 0) + 1)
            if (payload.playerOutId) subCounts.set(payload.playerOutId, (subCounts.get(payload.playerOutId) ?? 0) + 1)
          }

          const onFieldSet = new Set(state.onField.map((f) => f.playerId))
          const benchSet = new Set(state.bench.map((b) => b.playerId))
          const allPlayerIds = new Set([...onFieldSet, ...benchSet])

          const minutes: PlayerMinutes[] = []
          for (const pid of allPlayerIds) {
            const onField = state.onField.find((f) => f.playerId === pid)
            const bench = state.bench.find((b) => b.playerId === pid)
            const seconds = onField ? onField.secondsOnFieldThisGame : (bench?.secondsOnFieldThisGame ?? 0)
            minutes.push({
              playerId: pid,
              name: playerMap.get(pid) ?? pid.slice(0, 8),
              secondsOnField: seconds,
              minutesPlayed: Math.round(seconds / 60),
              subCount: subCounts.get(pid) ?? 0,
            })
          }
          minutes.sort((a, b) => b.minutesPlayed - a.minutesPlayed)
          setPlayerMinutes(minutes)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
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

  const totalSeconds = game.periodCount * game.periodLengthMinutes * 60
  const maxMinutes = Math.max(...playerMinutes.map((p) => p.minutesPlayed), 1)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to={`/team/${game.teamId}`} className="text-blue-600 hover:underline">&larr; Back to Team</Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">Game Summary</h1>
      <p className="text-gray-500 mb-6">vs {game.opponent} &middot; Final</p>

      <div className="grid grid-cols-3 gap-4 text-center mb-6">
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

      <h2 className="text-lg font-semibold mb-3">Player Minutes</h2>

      {playerMinutes.length === 0 ? (
        <p className="text-gray-500 text-sm">No player data available.</p>
      ) : (
        <div className="space-y-3">
          {playerMinutes.map((pm) => (
            <div key={pm.playerId}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{pm.name}</span>
                <span className="text-sm text-gray-500">
                  {pm.minutesPlayed} min &middot; {pm.subCount} subs
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div
                  className="bg-blue-500 rounded-full h-4 transition-all"
                  style={{ width: `${(pm.minutesPlayed / maxMinutes) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Link
          to={`/game/${game.id}/events`}
          className="text-blue-600 text-sm hover:underline"
        >
          View Event Log
        </Link>
      </div>
    </div>
  )
}
