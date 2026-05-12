import { describe, it, expect } from 'vitest'
import { calculateTargets, calculateDeficits } from './playingTime'

describe('calculateTargets', () => {
  const baseGame = {
    id: 'g1',
    teamId: 't1',
    profileId: 'p1',
    opponent: 'Rivals',
    scheduledAt: '2026-04-01T10:00:00Z',
    periodCount: 2,
    periodLengthMinutes: 40,
    stoppageSeconds: 0,
    status: 'in_progress' as const,
  }

  it('equal share for first game (no history)', () => {
    const targets = calculateTargets(
      [
        { playerId: 'p1', available: true },
        { playerId: 'p2', available: true },
        { playerId: 'p3', available: true },
      ],
      [],
      baseGame,
      { id: 'prof-1', teamId: 't1', name: 'Equal', strategy: 'equal_time', config: {} },
    )
    // total game seconds = 2 * 40 * 60 = 4800, split 3 ways → 1600 each
    expect(targets.get('p1')).toBe(1600)
    expect(targets.get('p2')).toBe(1600)
    expect(targets.get('p3')).toBe(1600)
  })

  it('unavailable players are excluded', () => {
    const targets = calculateTargets(
      [
        { playerId: 'p1', available: true },
        { playerId: 'p2', available: false },
      ],
      [],
      baseGame,
      { id: 'prof-1', teamId: 't1', name: 'Equal', strategy: 'equal_time', config: {} },
    )
    expect(targets.get('p1')).toBe(4800)
    expect(targets.get('p2')).toBeUndefined()
  })

  it('blends with season history', () => {
    const targets = calculateTargets(
      [
        { playerId: 'p1', available: true },
        { playerId: 'p2', available: true },
      ],
      [
        { playerId: 'p1', totalGameMinutes: 60, gamesPlayed: 2 },
        { playerId: 'p2', totalGameMinutes: 40, gamesPlayed: 2 },
      ],
      baseGame,
      { id: 'prof-1', teamId: 't1', name: 'Equal', strategy: 'equal_time', config: {} },
    )
    // p1: 60min/2 = 30 min/game avg = 1800s, game share = 2400s
    // blend: 1800*0.6 + 2400*0.4 = 1080 + 960 = 2040
    // p2: 40min/2 = 20 min/game avg = 1200s, 1200*0.6 + 2400*0.4 = 720 + 960 = 1680
    expect(targets.get('p1')).toBe(2040)
    expect(targets.get('p2')).toBe(1680)
  })
})

describe('calculateDeficits', () => {
  it('positive deficit when under target', () => {
    const targets = new Map([['p1', 1200]])
    const actual = new Map([['p1', 900]])
    const deficits = calculateDeficits(targets, actual)
    expect(deficits.get('p1')).toBe(300)
  })

  it('negative deficit (surplus) when over target', () => {
    const targets = new Map([['p1', 600]])
    const actual = new Map([['p1', 900]])
    const deficits = calculateDeficits(targets, actual)
    expect(deficits.get('p1')).toBe(-300)
  })

  it('missing actual seconds defaults to 0', () => {
    const targets = new Map([['p1', 600]])
    const deficits = calculateDeficits(targets, new Map())
    expect(deficits.get('p1')).toBe(600)
  })
})
