import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTeamsStore } from '../stores/teams'
import { usePlayersStore } from '../stores/players'
import { usePositionsStore } from '../stores/positions'
import { useProfilesStore } from '../stores/profiles'
import { useGamesStore } from '../stores/games'
import PositionFieldView from '../components/PositionFieldView'
import type { Player, PositionCategory, PlayingTimeStrategy, GameStatus } from '../types'

type Tab = 'roster' | 'positions' | 'profiles' | 'games'

function PlayerRow({ player, onToggleActive, onDelete }: {
  player: Player;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(0)
  const [isSwiping, setIsSwiping] = useState(false)

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0]!.clientX
    setIsSwiping(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping) return
    const diff = startX.current - e.touches[0]!.clientX
    if (diff > 0) {
      setOffset(Math.min(diff, 80))
    }
  }

  function handleTouchEnd() {
    if (offset > 40) {
      onDelete(player.id)
    }
    setOffset(0)
    setIsSwiping(false)
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200">
      <div className="absolute inset-y-0 right-0 flex items-center bg-red-500 text-white px-5 rounded-r-lg text-sm font-medium">
        Delete
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(-${offset}px)` }}
        className={`relative bg-white flex items-center justify-between p-3 ${isSwiping ? '' : 'transition-transform duration-200'}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 w-8">#{player.jerseyNumber || '—'}</span>
          <span className="font-medium">{player.name}</span>
          {!player.isActive && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={player.isActive}
              onChange={(e) => onToggleActive(player.id, e.target.checked)}
              className="rounded"
            />
            Active
          </label>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(player.id) }}
            className="text-red-500 hover:text-red-700 text-lg leading-none font-bold"
            aria-label={`Delete ${player.name}`}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

const STRATEGY_LABELS: Record<PlayingTimeStrategy, string> = {
  equal_time: 'Equal Time',
  position_aware: 'Position Aware',
  custom: 'Custom',
}

const CATEGORY_LABELS: Record<PositionCategory, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const { teams, loaded: teamsLoaded, loadById } = useTeamsStore()
  const { players, loaded: playersLoaded, load: loadPlayers, create: createPlayer, update: updatePlayer, remove: removePlayer } = usePlayersStore()
  const { positions, loaded: positionsLoaded, load: loadPositions, create: createPosition, update: updatePosition, remove: removePosition } = usePositionsStore()
  const { profiles, loaded: profilesLoaded, load: loadProfiles, create: createProfile, remove: removeProfile } = useProfilesStore()
  const { games, loaded: gamesLoaded, load: loadGames } = useGamesStore()
  const [tab, setTab] = useState<Tab>('roster')

  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [newName, setNewName] = useState('')
  const [newJersey, setNewJersey] = useState('')

  const [showAddSlot, setShowAddSlot] = useState(false)
  const [newSlotTemplate, setNewSlotTemplate] = useState('')
  const [newSlotName, setNewSlotName] = useState('')
  const [newSlotCategory, setNewSlotCategory] = useState<PositionCategory>('DEF')

  const [positionView, setPositionView] = useState<'field' | 'list'>('list')

  const [showAddProfile, setShowAddProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileStrategy, setNewProfileStrategy] = useState<PlayingTimeStrategy>('equal_time')

  const [deletedPlayer, setDeletedPlayer] = useState<Player | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => {
      if (toastRef.current) clearTimeout(toastRef.current)
    }
  }, [])

  useEffect(() => {
    if (id && !teamsLoaded) loadById(id)
  }, [id, teamsLoaded, loadById])

  useEffect(() => {
    if (id && !playersLoaded) loadPlayers(id)
  }, [id, playersLoaded, loadPlayers])

  useEffect(() => {
    if (id && !positionsLoaded) loadPositions(id)
  }, [id, positionsLoaded, loadPositions])

  useEffect(() => {
    if (id && !profilesLoaded) loadProfiles(id)
  }, [id, profilesLoaded, loadProfiles])

  useEffect(() => {
    if (id && !gamesLoaded) loadGames(id)
  }, [id, gamesLoaded, loadGames])

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

  const templateNames = [...new Set(positions.map((p) => p.templateName))]

  async function handleAddPlayer() {
    if (!newName.trim() || !id) return
    await createPlayer({ teamId: id, name: newName.trim(), jerseyNumber: newJersey.trim() })
    setNewName('')
    setNewJersey('')
    setShowAddPlayer(false)
  }

  async function handleToggleActive(playerId: string, active: boolean) {
    await updatePlayer(playerId, { isActive: active })
  }

  async function handleDeletePlayer(playerId: string) {
    const player = players.find((p) => p.id === playerId)
    if (!player) return
    await removePlayer(playerId)
    setDeletedPlayer(player)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setDeletedPlayer(null), 5000)
  }

  async function handleUndo() {
    if (!deletedPlayer || !id) return
    await createPlayer({
      teamId: id,
      name: deletedPlayer.name,
      jerseyNumber: deletedPlayer.jerseyNumber,
    })
    setDeletedPlayer(null)
    if (toastRef.current) clearTimeout(toastRef.current)
  }

  async function handleAddSlot() {
    if (!newSlotName.trim() || !newSlotTemplate.trim() || !id) return
    await createPosition({
      teamId: id,
      templateName: newSlotTemplate.trim(),
      slotName: newSlotName.trim(),
      category: newSlotCategory,
      fieldX: 0.5,
      fieldY: 0.5,
    })
    setNewSlotName('')
    setShowAddSlot(false)
  }

  async function handleDeleteSlot(slotId: string) {
    await removePosition(slotId)
  }

  async function handleAddProfile() {
    if (!newProfileName.trim() || !id) return
    await createProfile({ teamId: id, name: newProfileName.trim(), strategy: newProfileStrategy })
    setNewProfileName('')
    setShowAddProfile(false)
  }

  async function handleDeleteProfile(profileId: string) {
    await removeProfile(profileId)
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
              onClick={() => setShowAddPlayer(!showAddPlayer)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              + Add Player
            </button>
          </div>

          {showAddPlayer && (
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
                <PlayerRow key={p.id} player={p} onToggleActive={handleToggleActive} onDelete={handleDeletePlayer} />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'positions' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Position Templates</h2>
            <button
              onClick={() => setShowAddSlot(!showAddSlot)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              + Add Slot
            </button>
          </div>

          {showAddSlot && (
            <div className="flex flex-col gap-2 mb-4 p-3 border border-gray-200 rounded-lg">
              <input
                placeholder="Template name (e.g. 4-3-3)"
                value={newSlotTemplate}
                onChange={(e) => setNewSlotTemplate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                placeholder="Slot name (e.g. Left Back)"
                value={newSlotName}
                onChange={(e) => setNewSlotName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <select
                value={newSlotCategory}
                onChange={(e) => setNewSlotCategory(e.target.value as PositionCategory)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button
                onClick={handleAddSlot}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 self-end"
              >
                Save
              </button>
            </div>
          )}

          <div className="flex rounded-lg border border-gray-300 mb-4 overflow-hidden">
            <button
              onClick={() => setPositionView('field')}
              className={`flex-1 px-3 py-2 text-sm font-medium ${positionView === 'field' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Field
            </button>
            <button
              onClick={() => setPositionView('list')}
              className={`flex-1 px-3 py-2 text-sm font-medium ${positionView === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              List
            </button>
          </div>

          {positionView === 'field' ? (
            positions.length === 0 ? (
              <p className="text-gray-500">No position slots yet.</p>
            ) : (
              <PositionFieldView positions={positions} templateNames={templateNames} onUpdate={updatePosition} onRemove={removePosition} />
            )
          ) : (
            positions.length === 0 ? (
              <p className="text-gray-500">No position slots yet.</p>
            ) : (
              <div className="space-y-4">
                {templateNames.map((tpl) => (
                  <div key={tpl}>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{tpl}</h3>
                    <div className="space-y-1">
                      {positions.filter((p) => p.templateName === tpl).map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-2 rounded border border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{slot.slotName}</span>
                            <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                              {CATEGORY_LABELS[slot.category]}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-red-500 text-xs hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </section>
      )}

      {tab === 'profiles' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Playing Time Profiles</h2>
            <button
              onClick={() => setShowAddProfile(!showAddProfile)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              + Add Profile
            </button>
          </div>

          {showAddProfile && (
            <div className="flex flex-col gap-2 mb-4 p-3 border border-gray-200 rounded-lg">
              <input
                placeholder="Profile name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <select
                value={newProfileStrategy}
                onChange={(e) => setNewProfileStrategy(e.target.value as PlayingTimeStrategy)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {Object.entries(STRATEGY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button
                onClick={handleAddProfile}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 self-end"
              >
                Save
              </button>
            </div>
          )}

          {profiles.length === 0 ? (
            <p className="text-gray-500">No profiles yet.</p>
          ) : (
            <div className="space-y-2">
              {profiles.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <div>
                    <span className="font-medium">{pr.name}</span>
                    <span className="ml-2 text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                      {STRATEGY_LABELS[pr.strategy]}
                    </span>
                  </div>
                  {pr.name !== 'Equal Time' && (
                    <button
                      onClick={() => handleDeleteProfile(pr.id)}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'games' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Game Schedule</h2>
            <Link
              to={`/game/new?teamId=${id}`}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              + Schedule Game
            </Link>
          </div>

          {games.length === 0 ? (
            <p className="text-gray-500">No games scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {games.map((g) => {
                const statusColors: Record<GameStatus, string> = {
                  upcoming: 'bg-blue-100 text-blue-700',
                  in_progress: 'bg-green-100 text-green-700',
                  final: 'bg-gray-100 text-gray-700',
                }
                return (
                  <Link
                    key={g.id}
                    to={
                      g.status === 'upcoming'
                        ? `/game/${g.id}/lineup`
                        : g.status === 'in_progress'
                          ? `/game/${g.id}/live`
                          : `/game/${g.id}/summary`
                    }
                    className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">vs {g.opponent}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[g.status]}`}>
                        {g.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(g.scheduledAt).toLocaleDateString()} &middot; {g.periodCount}x{g.periodLengthMinutes}min
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}

      {deletedPlayer && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center gap-4 shadow-lg z-50">
          <span className="text-sm">Player deleted</span>
          <button
            onClick={handleUndo}
            className="text-blue-300 hover:text-blue-200 underline text-sm font-medium"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
