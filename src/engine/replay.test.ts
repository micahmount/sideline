import { describe, it, expect } from 'vitest'
import type { GameEvent, FieldAssignment } from '../types'
import { replayEvents } from './replay'

function makeEvent(
  overrides: Partial<GameEvent> & { type: GameEvent['type'] },
): GameEvent {
  return {
    id: crypto.randomUUID(),
    gameId: 'game-1',
    payload: {},
    gameClockSeconds: 0,
    wallTime: new Date().toISOString(),
    isEdited: false,
    ...overrides,
  }
}

const lineup: FieldAssignment[] = [
  {
    playerId: 'p1', positionId: 'pos-1', positionName: 'LB',
    secondsOnFieldThisPeriod: 0, secondsOnFieldThisGame: 0,
  },
]

describe('replayEvents', () => {
  it('returns idle state for empty events', () => {
    const state = replayEvents([], Date.now())
    expect(state.currentPeriod).toBe(0)
    expect(state.isRunning).toBe(false)
    expect(state.clockSeconds).toBe(0)
    expect(state.onField).toHaveLength(0)
    expect(state.bench).toHaveLength(0)
  })

  it('handles GAME_STARTED', () => {
    const events = [makeEvent({ type: 'GAME_STARTED' })]
    const state = replayEvents(events, Date.now())
    expect(state.currentPeriod).toBe(1)
    expect(state.isRunning).toBe(true)
    expect(state.clockSeconds).toBe(0)
  })

  it('handles PERIOD_STARTED with period number', () => {
    const events = [
      makeEvent({ type: 'GAME_STARTED' }),
      makeEvent({ type: 'PERIOD_STARTED', payload: { period: 2 } }),
    ]
    const state = replayEvents(events, Date.now())
    expect(state.currentPeriod).toBe(2)
    expect(state.isRunning).toBe(true)
  })

  it('handles CLOCK_PAUSED and CLOCK_RESUMED', () => {
    const events = [
      makeEvent({ type: 'GAME_STARTED' }),
      makeEvent({ type: 'CLOCK_PAUSED' }),
    ]
    const state = replayEvents(events, Date.now())
    expect(state.isRunning).toBe(false)
    expect(state.clockSeconds).toBe(0)
  })

  it('clock advances while running', () => {
    const wallTime = new Date().toISOString()
    const events = [makeEvent({ type: 'GAME_STARTED', wallTime })]
    const thenMs = new Date(wallTime).getTime()
    const state = replayEvents(events, thenMs + 5000)
    expect(state.clockSeconds).toBeCloseTo(5, 0)
  })

  it('SUB_EXECUTED moves player from field to bench', () => {
    const events = [
      makeEvent({ type: 'GAME_STARTED' }),
      makeEvent({
        type: 'SUB_EXECUTED',
        payload: { playerOutId: 'p1', playerInId: 'p2', positionId: 'pos-1' },
        gameClockSeconds: 300,
      }),
    ]
    const state = replayEvents(events, Date.now(), lineup)
    expect(state.onField.find((p) => p.playerId === 'p2')).toBeDefined()
    expect(state.onField.find((p) => p.playerId === 'p1')).toBeUndefined()
  })

  it('SUB_CORRECTED replaces player via corrective event', () => {
    const subEvent = makeEvent({
      type: 'SUB_EXECUTED',
      payload: { playerOutId: 'p1', playerInId: 'p2', positionId: 'pos-1' },
    })
    const events = [
      makeEvent({ type: 'GAME_STARTED' }),
      subEvent,
      makeEvent({
        type: 'SUB_CORRECTED',
        payload: {
          correctsEventId: subEvent.id,
          playerOutId: 'p2',
          playerInId: 'p3',
          positionId: 'pos-1',
        },
        gameClockSeconds: 600,
      }),
    ]
    const state = replayEvents(events, Date.now(), lineup)
    expect(state.onField.find((p) => p.playerId === 'p2')).toBeUndefined()
    expect(state.onField.find((p) => p.playerId === 'p3')).toBeDefined()
  })

  it('LINEUP_ADJUSTED changes position', () => {
    const events = [
      makeEvent({ type: 'GAME_STARTED' }),
      makeEvent({
        type: 'LINEUP_ADJUSTED',
        payload: { playerId: 'p1', positionId: 'pos-2' },
      }),
    ]
    const state = replayEvents(events, Date.now(), lineup)
    expect(
      state.onField.find((p) => p.playerId === 'p1')?.positionId,
    ).toBe('pos-2')
  })

  it('PERIOD_ENDED stops the clock', () => {
    const events = [
      makeEvent({ type: 'GAME_STARTED' }),
      makeEvent({ type: 'PERIOD_ENDED' }),
    ]
    const state = replayEvents(events, Date.now())
    expect(state.isRunning).toBe(false)
  })

  it('GAME_ENDED stops the clock', () => {
    const events = [
      makeEvent({ type: 'GAME_STARTED' }),
      makeEvent({ type: 'GAME_ENDED' }),
    ]
    const state = replayEvents(events, Date.now())
    expect(state.isRunning).toBe(false)
  })

  it('STOPPAGE_ADDED accumulates stoppage', () => {
    const events = [
      makeEvent({ type: 'GAME_STARTED' }),
      makeEvent({ type: 'STOPPAGE_ADDED', payload: { seconds: 120 } }),
      makeEvent({ type: 'STOPPAGE_ADDED', payload: { seconds: 60 } }),
    ]
    const state = replayEvents(events, Date.now())
    expect(state.stoppageSeconds).toBe(180)
  })

  it('initialLineup populates onField from the start', () => {
    const events = [makeEvent({ type: 'GAME_STARTED' })]
    const state = replayEvents(events, Date.now(), lineup)
    expect(state.onField).toHaveLength(1)
    expect(state.onField[0]!.playerId).toBe('p1')
  })
})
