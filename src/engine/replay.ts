import type { GameEvent, GameState, FieldAssignment } from '../types'

interface ClockAnchor {
  wallMs: number
  gameSeconds: number
}

function makeBenchPlayer(playerId: string, seconds: number) {
  return { playerId, secondsOnFieldThisGame: seconds, targetMinutes: 0, deficitSeconds: 0 }
}

export function replayEvents(
  events: GameEvent[],
  nowMs: number,
  initialLineup: FieldAssignment[] = [],
): GameState {
  let currentPeriod = 0
  let isRunning = false
  let stoppageSeconds = 0
  let clockAnchor: ClockAnchor | null = null
  let pausedClockSeconds = 0
  const onField: FieldAssignment[] = [...initialLineup]
  const bench: { playerId: string; secondsOnFieldThisGame: number }[] = []

  function currentClock(): number {
    if (clockAnchor) {
      return clockAnchor.gameSeconds + (nowMs - clockAnchor.wallMs) / 1000
    }
    return pausedClockSeconds
  }

  function parseWall(iso: string): number {
    return new Date(iso).getTime()
  }

  for (const event of events) {
    switch (event.type) {
      case 'GAME_STARTED':
        currentPeriod = 1
        isRunning = true
        clockAnchor = { wallMs: parseWall(event.wallTime), gameSeconds: 0 }
        break

      case 'PERIOD_STARTED': {
        const period = (event.payload as { period: number }).period
        currentPeriod = period
        isRunning = true
        clockAnchor = { wallMs: parseWall(event.wallTime), gameSeconds: 0 }
        break
      }

      case 'CLOCK_PAUSED':
        isRunning = false
        pausedClockSeconds = currentClock()
        clockAnchor = null
        break

      case 'CLOCK_RESUMED':
        isRunning = true
        clockAnchor = { wallMs: parseWall(event.wallTime), gameSeconds: pausedClockSeconds }
        break

      case 'STOPPAGE_ADDED':
        stoppageSeconds += (event.payload as { seconds: number }).seconds
        break

      case 'SUB_EXECUTED': {
        const { playerOutId, playerInId, positionId } = event.payload as {
          playerOutId: string
          playerInId: string
          positionId: string | null
        }
        const outIdx = onField.findIndex((p) => p.playerId === playerOutId)
        if (outIdx !== -1) {
          const removed = onField.splice(outIdx, 1)[0]!
          bench.push({ playerId: removed.playerId, secondsOnFieldThisGame: removed.secondsOnFieldThisGame })
        }
        const benchIdx = bench.findIndex((b) => b.playerId === playerInId)
        if (benchIdx !== -1) {
          bench.splice(benchIdx, 1)
        }
        onField.push({
          playerId: playerInId,
          positionId,
          positionName: null,
          secondsOnFieldThisPeriod: event.gameClockSeconds,
          secondsOnFieldThisGame: event.gameClockSeconds,
        })
        break
      }

      case 'SUB_CORRECTED': {
        const corr = event.payload as {
          correctsEventId: string
          playerOutId: string
          playerInId: string
          positionId: string | null
        }
        const outIdx = onField.findIndex((p) => p.playerId === corr.playerOutId)
        if (outIdx !== -1) {
          const removed = onField.splice(outIdx, 1)[0]!
          bench.push({ playerId: removed.playerId, secondsOnFieldThisGame: removed.secondsOnFieldThisGame })
        }
        const benchIdx = bench.findIndex((b) => b.playerId === corr.playerInId)
        if (benchIdx !== -1) {
          bench.splice(benchIdx, 1)
        }
        onField.push({
          playerId: corr.playerInId,
          positionId: corr.positionId,
          positionName: null,
          secondsOnFieldThisPeriod: event.gameClockSeconds,
          secondsOnFieldThisGame: event.gameClockSeconds,
        })
        event.isEdited = true
        break
      }

      case 'LINEUP_ADJUSTED': {
        const adj = event.payload as { playerId: string; positionId: string | null }
        const player = onField.find((p) => p.playerId === adj.playerId)
        if (player) {
          player.positionId = adj.positionId
        }
        break
      }

      case 'PERIOD_ENDED':
        isRunning = false
        pausedClockSeconds = currentClock()
        clockAnchor = null
        break

      case 'GAME_ENDED':
        isRunning = false
        pausedClockSeconds = currentClock()
        clockAnchor = null
        break
    }
  }

  const benchPlayers = bench.map((b) => makeBenchPlayer(b.playerId, b.secondsOnFieldThisGame))

  return {
    gameId: events.length > 0 ? events[0]!.gameId : '',
    currentPeriod,
    clockSeconds: currentClock(),
    isRunning,
    stoppageSeconds,
    onField,
    bench: benchPlayers,
    subQueue: [],
  }
}
