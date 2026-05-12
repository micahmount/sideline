import { describe, it, expect } from 'vitest'
import type { GameState, Player, PositionTemplate } from '../types'
import { generateSuggestions } from './suggestions'

describe('generateSuggestions', () => {
  const baseState: GameState = {
    gameId: 'g1',
    currentPeriod: 1,
    clockSeconds: 1800,
    isRunning: true,
    stoppageSeconds: 0,
    onField: [
      {
        playerId: 'p1',
        positionId: 'pos-1',
        positionName: 'Left Back',
        secondsOnFieldThisPeriod: 1500,
        secondsOnFieldThisGame: 1500,
      },
    ],
    bench: [
      {
        playerId: 'p2',
        secondsOnFieldThisGame: 300,
        targetMinutes: 40,
        deficitSeconds: 600,
      },
    ],
    subQueue: [],
  }

  const players: Player[] = [
    { id: 'p1', teamId: 't1', name: 'Ali', jerseyNumber: '10', isActive: true },
    { id: 'p2', teamId: 't1', name: 'Ben', jerseyNumber: '5', isActive: true },
  ]

  const positions: PositionTemplate[] = [
    {
      id: 'pos-1',
      teamId: 't1',
      templateName: '4-3-3',
      slotName: 'Left Back',
      category: 'DEF',
      fieldX: 0.2,
      fieldY: 0.8,
    },
  ]

  it('returns suggestions when bench player has deficit', () => {
    const suggestions = generateSuggestions(baseState, new Map(), players, positions)
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(suggestions[0]!.playerInId).toBe('p2')
    expect(suggestions[0]!.playerOutId).toBe('p1')
  })

  it('suggestions have confidence and reason', () => {
    const suggestions = generateSuggestions(baseState, new Map(), players, positions)
    for (const s of suggestions) {
      expect(s.confidence).toBeGreaterThanOrEqual(0)
      expect(s.confidence).toBeLessThanOrEqual(1)
      expect(s.reason).toBeTruthy()
    }
  })

  it('returns empty when bench has no deficit', () => {
    const state: GameState = {
      ...baseState,
      bench: [
        {
          playerId: 'p2',
          secondsOnFieldThisGame: 2400,
          targetMinutes: 40,
          deficitSeconds: 0,
        },
      ],
    }
    const suggestions = generateSuggestions(state, new Map(), players, positions)
    expect(suggestions).toHaveLength(0)
  })

  it('returns at most 3 suggestions', () => {
    const manyBenchState: GameState = {
      ...baseState,
      onField: [
        {
          playerId: 'p1',
          positionId: 'pos-1',
          positionName: 'LB',
          secondsOnFieldThisPeriod: 1500,
          secondsOnFieldThisGame: 1500,
        },
        {
          playerId: 'p3',
          positionId: 'pos-2',
          positionName: 'CB',
          secondsOnFieldThisPeriod: 1500,
          secondsOnFieldThisGame: 1500,
        },
      ],
      bench: [
        { playerId: 'p2', secondsOnFieldThisGame: 300, targetMinutes: 40, deficitSeconds: 600 },
        { playerId: 'p4', secondsOnFieldThisGame: 200, targetMinutes: 40, deficitSeconds: 700 },
        { playerId: 'p5', secondsOnFieldThisGame: 100, targetMinutes: 40, deficitSeconds: 800 },
        { playerId: 'p6', secondsOnFieldThisGame: 50, targetMinutes: 40, deficitSeconds: 900 },
      ],
    }
    const allPlayers: Player[] = [
      ...players,
      { id: 'p3', teamId: 't1', name: 'Cat', jerseyNumber: '3', isActive: true },
      { id: 'p4', teamId: 't1', name: 'Dan', jerseyNumber: '7', isActive: true },
      { id: 'p5', teamId: 't1', name: 'Eli', jerseyNumber: '8', isActive: true },
      { id: 'p6', teamId: 't1', name: 'Finn', jerseyNumber: '9', isActive: true },
    ]
    const suggestions = generateSuggestions(manyBenchState, new Map(), allPlayers, positions)
    expect(suggestions.length).toBeLessThanOrEqual(3)
  })
})
