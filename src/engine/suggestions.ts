import type { GameState, Player, PositionTemplate, SubSuggestion } from '../types'

export function generateSuggestions(
  state: GameState,
  _targets: Map<string, number>,
  players: Player[],
  positionTemplates: PositionTemplate[],
): SubSuggestion[] {
  const suggestions: SubSuggestion[] = []

  const benchSorted = [...state.bench]
    .filter((b) => b.deficitSeconds > 0)
    .sort((a, b) => b.deficitSeconds - a.deficitSeconds)

  const fieldSorted = [...state.onField].sort(
    (a, b) => a.secondsOnFieldThisGame - b.secondsOnFieldThisGame,
  )

  for (const benchPlayer of benchSorted) {
    if (suggestions.length >= 3) break

    const fieldTarget = fieldSorted.find((f) => {
      const samePos = positionTemplates.some(
        (pt) =>
          pt.id === f.positionId &&
          pt.id === benchPlayer.playerId,
      )
      return !samePos
    })

    const fieldPlayer = fieldTarget ?? fieldSorted[0]
    if (!fieldPlayer) continue

    const playerName =
      players.find((p) => p.id === benchPlayer.playerId)?.name ?? 'Unknown'

    const deficitRatio = Math.min(benchPlayer.deficitSeconds / 3600, 1)
    const confidence = Math.round(deficitRatio * 100) / 100

    suggestions.push({
      playerOutId: fieldPlayer.playerId,
      playerInId: benchPlayer.playerId,
      positionId: fieldPlayer.positionId,
      confidence,
      reason: `${playerName} is ${Math.round(benchPlayer.deficitSeconds / 60)} min under target`,
    })
  }

  return suggestions
}
