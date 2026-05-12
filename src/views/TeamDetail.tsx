import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTeamsStore } from '../stores/teams'
import { usePlayersStore } from '../stores/players'
import type { Player } from '../types'

type Tab = 'roster' | 'positions' | 'profiles' | 'games'

function PlayerRow({ player, onToggleActive }: { player: Player; onToggleActive: (id: string, active: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400 w-8">#{player.jerseyNumber || '—'}</span>
        <span className="font-medium">{player.name}</span>
        {!player.isActive && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-500">
        <input
          type="checkbox"
          checked={player.isActive}
          onChange={(e) => onToggleActive(player.id, e.target.checked)}
          className="rounded"
        />
        Active
      </label>
    </div>
  )
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const { teams, loaded: teamsLoaded, loadById } = useTeamsStore()
  const { players, loaded: playersLoaded, load: loadPlayers, create: createPlayer, update: updatePlayer } = usePlayersStore()
  const [tab, setTab] = useState<Tab>('roster')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newJersey, setNewJersey] = useState('')

  useEffect(() => {
    if (id && !teamsLoaded) loadById(id)
  }, [id, teamsLoaded, loadById])

  useEffect(() => {
    if (id && !playersLoaded) loadPlayers(id)
  }, [id, playersLoaded, loadPlayers])

  const team = teams.find((t) => t.id === id)

  if (!teamsLoaded) {
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'roster', label: 'Roster' },
    { key: 'positions', label: 'Positions' },
    { key: 'profiles', label: 'Profiles' },
    { key: 'games', label: 'Games' },
  ]

  async function handleAddPlayer() {
    if (!newName.trim() || !id) return
    await createPlayer({ teamId: id, name: newName.trim(), jerseyNumber: newJersey.trim() })
    setNewName('')
    setNewJersey('')
    setShowAddForm(false)
  }

  async function handleToggleActive(playerId: string, active: boolean) {
    await updatePlayer(playerId, { isActive: active })
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to={`/season/${team.seasonId}`} className="text-blue-600 hover:underline">&larr; Back</Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold">{team.name}</h1>
        <p className="text-gray-500">{team.format}</p>
      </div>

      <div role="tablist" className="flex border-b border-gray-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Roster</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              + Add Player
            </button>
          </div>

          {showAddForm && (
            <div className="flex gap-2 mb-4 p-3 border border-gray-200 rounded-lg">
              <input
                placeholder="Player name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                placeholder="#"
                value={newJersey}
                onChange={(e) => setNewJersey(e.target.value)}
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button
                onClick={handleAddPlayer}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Save
              </button>
            </div>
          )}

          {players.length === 0 ? (
            <p className="text-gray-500">No players yet.</p>
          ) : (
            <div className="space-y-2">
              {players.map((p) => (
                <PlayerRow key={p.id} player={p} onToggleActive={handleToggleActive} />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'positions' && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Position Templates</h2>
          <p className="text-gray-500">Position templates coming soon.</p>
        </section>
      )}

      {tab === 'profiles' && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Playing Time Profiles</h2>
          <p className="text-gray-500">Playing time profiles coming soon.</p>
        </section>
      )}

      {tab === 'games' && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Game Schedule</h2>
          <p className="text-gray-500">Games coming soon.</p>
        </section>
      )}
    </div>
  )
}
