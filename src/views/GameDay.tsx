import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGameLiveStore } from '../stores/gameLive'
import { usePlayersStore } from '../stores/players'
import { useSettingsStore } from '../stores/settings'
import SoccerField from '../components/SoccerField'
import GameClock from '../components/GameClock'
import SubQueuePanel from '../components/SubQueuePanel'
import SubWorkflowModal from '../components/SubWorkflowModal'
import type { SubQueueEntry, NudgeHaptic, NudgeAudio } from '../types'
import { timeOnFieldColor } from '../engine/fieldColors'

export default function GameDay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { gameId, game, state, targets, init, tick, executeSub, addToQueue, removeFromQueue, pauseClock, resumeClock, addStoppage, endPeriod, endGame, loading } = useGameLiveStore()
  const { players, loaded: playersLoaded, load: loadPlayers } = usePlayersStore()

  const { nudgeHaptic, nudgeAudio, loaded: settingsLoaded, load: loadSettings } = useSettingsStore()

  const [showSubModal, setShowSubModal] = useState(false)
  const [showQueuePanel, setShowQueuePanel] = useState(false)
  const [showPlayerBar, setShowPlayerBar] = useState(false)
  const [defaultOut, setDefaultOut] = useState<string | undefined>(undefined)
  const nudgedRef = useRef<Set<string>>(new Set())
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!settingsLoaded) loadSettings()
  }, [settingsLoaded, loadSettings])

  function triggerHaptic(haptic: NudgeHaptic) {
    if (haptic === 'short') navigator.vibrate?.(50)
    else if (haptic === 'long') navigator.vibrate?.(200)
  }

  function triggerAudio(audio: NudgeAudio) {
    if (audio === 'off') return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.value = 0.3
    if (audio === 'tone') {
      osc.frequency.value = 880
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } else if (audio === 'whistle') {
      osc.frequency.value = 1200
      osc.type = 'sine'
      osc.start()
      osc.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 0.3)
      osc.stop(ctx.currentTime + 0.3)
    }
  }

  useEffect(() => {
    if (!state || !settingsLoaded) return
    const nudged = nudgedRef.current
    for (const entry of state.subQueue) {
      if (entry.scheduledAtSeconds != null && state.clockSeconds >= entry.scheduledAtSeconds) {
        if (!nudged.has(entry.id)) {
          nudged.add(entry.id)
          triggerHaptic(nudgeHaptic)
          triggerAudio(nudgeAudio)
        }
      }
    }
  }, [state?.clockSeconds, state?.subQueue, nudgeHaptic, nudgeAudio, state, settingsLoaded])

  useEffect(() => {
    if (id && !gameId) init(id)
  }, [id, gameId, init])

  useEffect(() => {
    if (game && !playersLoaded) loadPlayers(game.teamId)
  }, [game, playersLoaded, loadPlayers])

  const startClock = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      tick()
    }, 1000)
  }, [tick])

  const stopClock = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  useEffect(() => {
    if (state?.isRunning) {
      startClock()
    } else {
      stopClock()
    }
    return stopClock
  }, [state?.isRunning, startClock, stopClock])

  useEffect(() => {
    if (state?.currentPeriod === 0 && game?.status === 'final') {
      navigate(`/game/${gameId}/summary`)
    }
  }, [state?.currentPeriod, game?.status, gameId, navigate])

  if (loading || !gameId) {
    return <div className="p-4 text-gray-500">Loading game...</div>
  }

  if (!game || !state) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
        <p className="text-gray-500 mt-8">Game not found.</p>
      </div>
    )
  }

  if (!playersLoaded) {
    return <div className="p-4 text-gray-500">Loading roster...</div>
  }

  function handleExecuteSub(entry: SubQueueEntry) {
    if (entry.playerOutId && entry.playerInId) {
      executeSub(entry.playerOutId, entry.playerInId, entry.positionId)
      removeFromQueue(entry.id)
    }
  }

  function handleSubFromField(playerId: string) {
    setDefaultOut(playerId)
    setShowSubModal(true)
  }

  function handleSubConfirm(playerOutId: string, playerInId: string, positionId: string | null, queue: boolean) {
    if (queue) {
      addToQueue({ playerOutId, playerInId, positionId, queueOrder: Date.now(), scheduledAtSeconds: null, source: 'coach' })
    } else {
      executeSub(playerOutId, playerInId, positionId)
    }
    setShowSubModal(false)
    setDefaultOut(undefined)
  }

  function handleEndGame() {
    endGame()
    navigate(`/game/${gameId}/summary`)
  }

  function playerName(id: string): string {
    return players.find((p) => p.id === id)?.name ?? id.slice(0, 8)
  }

  const fieldSlots = state.onField.map((f) => ({
    x: 0.5,
    y: 0.3 + (state.onField.indexOf(f) * 0.6) / Math.max(state.onField.length, 1),
    label: f.positionName ?? '',
    playerName: playerName(f.playerId),
    playerId: f.playerId,
    color: timeOnFieldColor(f.secondsOnFieldThisGame, targets[f.playerId] ?? f.secondsOnFieldThisGame + 1),
  }))

  const benchPlayers = state.bench.map((b) => {
    const p = players.find((pl) => pl.id === b.playerId)
    return { ...b, name: p?.name ?? 'Unknown' }
  })

  const queueEntries: SubQueueEntry[] = state.subQueue ?? []

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-2">
        <Link to={`/game/${id}/events`} className="text-blue-600 text-sm hover:underline">
          Timeline
        </Link>
        <span className="text-sm text-gray-500">vs {game.opponent}</span>
      </div>

      <GameClock
        clockSeconds={state.clockSeconds}
        isRunning={state.isRunning}
        currentPeriod={state.currentPeriod}
        stoppageSeconds={state.stoppageSeconds}
        onPause={pauseClock}
        onResume={resumeClock}
        onAddStoppage={() => addStoppage(60)}
        onEndPeriod={endPeriod}
        onEndGame={handleEndGame}
      />

      <div className="mt-4">
        <SoccerField
          slots={fieldSlots}
          onSlotTap={(i) => {
            const playerId = state.onField[i]?.playerId
            if (playerId) handleSubFromField(playerId)
          }}
        />
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={() => setShowSubModal(true)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Substitution
        </button>

        <button
          onClick={() => setShowQueuePanel(!showQueuePanel)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          {showQueuePanel ? 'Hide' : 'Show'} Sub Queue ({queueEntries.length})
        </button>

        {showQueuePanel && (
          <SubQueuePanel
            entries={queueEntries}
            players={players}
            clockSeconds={state.clockSeconds}
            onExecuteSub={handleExecuteSub}
            onRemoveFromQueue={removeFromQueue}
          />
        )}

        <button
          onClick={() => setShowPlayerBar(!showPlayerBar)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          {showPlayerBar ? 'Hide' : 'Show'} Player Bar ({benchPlayers.length} bench)
        </button>

        {showPlayerBar && (
          <div className="space-y-1">
            {benchPlayers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">All players on field.</p>
            ) : (
              benchPlayers.sort((a, b) => b.deficitSeconds - a.deficitSeconds).map((bp) => (
                <div key={bp.playerId} className="flex justify-between p-2 rounded border border-gray-200 text-sm">
                  <span>{bp.name}</span>
                  <span className="text-gray-500">{Math.floor(bp.secondsOnFieldThisGame / 60)} min played</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showSubModal && (
        <SubWorkflowModal
          onField={state.onField}
          bench={state.bench}
          players={players}
          positionTemplates={[]}
          defaultPlayerOutId={defaultOut}
          onConfirm={handleSubConfirm}
          onClose={() => { setShowSubModal(false); setDefaultOut(undefined) }}
        />
      )}
    </div>
  )
}
