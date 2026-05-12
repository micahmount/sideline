import type { PlayingTimeProfile } from '../types'

export interface RosterEntry {
  playerId: string
  available: boolean
}

export interface SeasonPlayerStats {
  playerId: string
  totalGameMinutes: number
  gamesPlayed: number
}

export interface GameInfo {
  periodCount: number
  periodLengthMinutes: number
}

export function calculateTargets(
  roster: RosterEntry[],
  seasonHistory: SeasonPlayerStats[],
  game: GameInfo,
  profile: PlayingTimeProfile,
): Map<string, number> {
  const targets = new Map<string, number>()
  const totalGameSeconds = game.periodCount * game.periodLengthMinutes * 60

  if (profile.strategy === 'custom') {
    for (const r of roster) {
      if (!r.available) continue
      const override = (profile.config as Record<string, number>)[r.playerId]
      targets.set(r.playerId, override ?? totalGameSeconds)
    }
    return targets
  }

  const available = roster.filter((r) => r.available)
  if (available.length === 0) return targets

  const gameShare = Math.floor(totalGameSeconds / available.length)

  if (seasonHistory.length === 0) {
    for (const r of available) {
      targets.set(r.playerId, gameShare)
    }
    return targets
  }

  for (const r of available) {
    const hist = seasonHistory.find((s) => s.playerId === r.playerId)
    if (!hist || hist.gamesPlayed === 0) {
      targets.set(r.playerId, gameShare)
      continue
    }
    const seasonAvg = (hist.totalGameMinutes * 60) / hist.gamesPlayed
    const blend = Math.round(seasonAvg * 0.6 + gameShare * 0.4)
    targets.set(r.playerId, blend)
  }

  return targets
}

export function calculateDeficits(
  targets: Map<string, number>,
  actualSeconds: Map<string, number>,
): Map<string, number> {
  const deficits = new Map<string, number>()
  const allIds = new Set([...targets.keys(), ...actualSeconds.keys()])
  for (const id of allIds) {
    const target = targets.get(id) ?? 0
    const actual = actualSeconds.get(id) ?? 0
    deficits.set(id, target - actual)
  }
  return deficits
}
