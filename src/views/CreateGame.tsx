import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useTeamsStore } from '../stores/teams'
import { usePlayersStore } from '../stores/players'
import { useProfilesStore } from '../stores/profiles'
import { usePositionsStore } from '../stores/positions'
import { useGamesStore } from '../stores/games'

export default function CreateGame() {
  const [searchParams] = useSearchParams()
  const teamId = searchParams.get('teamId')
  const navigate = useNavigate()

  const { teams, loaded: teamsLoaded, loadById } = useTeamsStore()
  const { players, loaded: playersLoaded, load: loadPlayers } = usePlayersStore()
  const { profiles, loaded: profilesLoaded, load: loadProfiles } = useProfilesStore()
  const { positions, loaded: positionsLoaded, load: loadPositions } = usePositionsStore()
  const { create, addToRoster } = useGamesStore()

  const [opponent, setOpponent] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [periodCount, setPeriodCount] = useState(2)
  const [periodLengthMinutes, setPeriodLengthMinutes] = useState(25)
  const [profileId, setProfileId] = useState('')
  const [positionTemplateId, setPositionTemplateId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (teamId && !teamsLoaded) loadById(teamId)
  }, [teamId, teamsLoaded, loadById])

  useEffect(() => {
    if (teamId && !playersLoaded) loadPlayers(teamId)
  }, [teamId, playersLoaded, loadPlayers])

  useEffect(() => {
    if (teamId && !profilesLoaded) loadProfiles(teamId)
  }, [teamId, profilesLoaded, loadProfiles])

  useEffect(() => {
    if (teamId && !positionsLoaded) loadPositions(teamId)
  }, [teamId, positionsLoaded, loadPositions])

  const team = teams.find((t) => t.id === teamId)

  const [availability, setAvailability] = useState<Record<string, boolean>>({})

  async function handleSubmit() {
    if (!teamId || !effectiveProfileId || !opponent.trim()) return
    setSubmitting(true)

    const game = await create({
      teamId,
      profileId: effectiveProfileId,
      positionTemplateId: positionTemplateId || null,
      opponent: opponent.trim(),
      scheduledAt: scheduledAt || new Date().toISOString(),
      periodCount,
      periodLengthMinutes,
    })

    for (const p of players) {
      if (!p.isActive) continue
      await addToRoster({
        gameId: game.id,
        playerId: p.id,
        available: availability[p.id] ?? true,
      })
    }

    setSubmitting(false)
    navigate(`/game/${game.id}/lineup`)
  }

  if (!teamId) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
        <p className="text-gray-500 mt-8">No team selected.</p>
      </div>
    )
  }

  if (!teamsLoaded || !playersLoaded || !profilesLoaded) {
    return <div className="p-4 text-gray-500">Loading...</div>
  }

  if (!team) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
        <p className="text-gray-500 mt-8">Team not found.</p>
      </div>
    )
  }

  const availablePlayers = players.filter((p) => p.isActive)
  const selectedCount = availablePlayers.filter((p) => availability[p.id] ?? true).length
  const effectiveProfileId = profileId || profiles[0]?.id || ''

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to={`/team/${teamId}`} className="text-blue-600 hover:underline">&larr; Back</Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">Schedule Game</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opponent</label>
          <input
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Opponent name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Periods</label>
            <input
              type="number"
              min={1}
              max={6}
              value={periodCount}
              onChange={(e) => setPeriodCount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Minutes per Period</label>
            <input
              type="number"
              min={1}
              max={60}
              value={periodLengthMinutes}
              onChange={(e) => setPeriodLengthMinutes(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Playing Time Profile</label>
          <select
            value={effectiveProfileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {profiles.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position Template</label>
          <select
            value={positionTemplateId}
            onChange={(e) => setPositionTemplateId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {[...new Set(positions.map((p) => p.templateName))].map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Roster Availability</label>
            <span className="text-xs text-gray-400">{selectedCount} of {availablePlayers.length} available</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {availablePlayers.length === 0 ? (
              <p className="text-sm text-gray-500 p-2">No active players.</p>
            ) : (
              availablePlayers.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 text-sm"
                >
                  <span>
                    <span className="text-gray-400 w-8 inline-block">#{p.jerseyNumber || '—'}</span>
                    {p.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={availability[p.id] ?? true}
                    onChange={(e) => setAvailability((a) => ({ ...a, [p.id]: e.target.checked }))}
                    className="rounded"
                  />
                </label>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !opponent.trim() || selectedCount === 0}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {submitting ? 'Creating...' : 'Start Game'}
        </button>
      </div>
    </div>
  )
}
