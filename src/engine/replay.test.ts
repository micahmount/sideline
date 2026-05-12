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
    const now = Date.now()
    const events = [makeEvent({ type: 'GAME_STARTED', wallTime: new Date(now).toISOString() })]
    const state = replayEvents(events, now)
    expect(state.currentPeriod).toBe(1)
    expect(state.isRunning).toBe(true)
    expect(state.clockSeconds).toBe(0)
  })

  it('handles PERIOD_STARTED with period number', () => {
    const now = Date.now()
    const wallTime = new Date(now).toISOString()
    const events = [
      makeEvent({ type: 'GAME_STARTED', wallTime }),
      makeEvent({ type: 'PERIOD_STARTED', payload: { period: 2 }, wallTime }),
    ]
    const state = replayEvents(events, now)
    expect(state.currentPeriod).toBe(2)
    expect(state.isRunning).toBe(true)
  })

  it('handles CLOCK_PAUSED and CLOCK_RESUMED', () => {
    const now = Date.now()
    const events = [
      makeEvent({ type: 'GAME_STARTED', wallTime: new Date(now).toISOString() }),
      makeEvent({ type: 'CLOCK_PAUSED', wallTime: new Date(now).toISOString() }),
    ]
    const state = replayEvents(events, now)
    expect(state.isRunning).toBe(false)
    expect(state.clockSeconds).toBe(0)
  })

  it('clock advances while running', () => {
    const thenMs = Date.now()
    const events = [makeEvent({ type: 'GAME_STARTED', wallTime: new Date(thenMs).toISOString() })]
    const state = replayEvents(events, thenMs + 5000)
    expect(state.clockSeconds).toBeCloseTo(5, 0)
  })

  it('SUB_EXECUTED moves player from field to bench', () => {
    const now = Date.now()
    const events = [
      makeEvent({ type: 'GAME_STARTED', wallTime: new Date(now).toISOString() }),
      makeEvent({
        type: 'SUB_EXECUTED',
        payload: { playerOutId: 'p1', playerInId: 'p2', positionId: 'pos-1' },
        gameClockSeconds: 300,
        wallTime: new Date(now).toISOString(),
      }),
    ]
    const state = replayEvents(events, now, lineup)
    expect(state.onField.find((p) => p.playerId === 'p2')).toBeDefined()
    expect(state.onField.find((p) => p.playerId === 'p1')).toBeUndefined()
  })

  it('SUB_CORRECTED replaces player via corrective event', () => {
    const now = Date.now()
    const wallTime = new Date(now).toISOString()
    const subEvent = makeEvent({
      type: 'SUB_EXECUTED',
      payload: { playerOutId: 'p1', playerInId: 'p2', positionId: 'pos-1' },
      wallTime,
    })
    const events = [
      makeEvent({ type: 'GAME_STARTED', wallTime }),
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
        wallTime,
      }),
    ]
    const state = replayEvents(events, now, lineup)
    expect(state.onField.find((p) => p.playerId === 'p2')).toBeUndefined()
    expect(state.onField.find((p) => p.playerId === 'p3')).toBeDefined()
  })

  it('LINEUP_ADJUSTED changes position', () => {
    const now = Date.now()
    const wallTime = new Date(now).toISOString()
    const events = [
      makeEvent({ type: 'GAME_STARTED', wallTime }),
      makeEvent({
        type: 'LINEUP_ADJUSTED',
        payload: { playerId: 'p1', positionId: 'pos-2' },
        wallTime,
      }),
    ]
    const state = replayEvents(events, now, lineup)
    expect(
      state.onField.find((p) => p.playerId === 'p1')?.positionId,
    ).toBe('pos-2')
  })

  it('PERIOD_ENDED stops the clock', () => {
    const now = Date.now()
    const events = [
      makeEvent({ type: 'GAME_STARTED', wallTime: new Date(now).toISOString() }),
      makeEvent({ type: 'PERIOD_ENDED', wallTime: new Date(now).toISOString() }),
    ]
    const state = replayEvents(events, now)
    expect(state.isRunning).toBe(false)
  })

  it('GAME_ENDED stops the clock', () => {
    const now = Date.now()
    const events = [
      makeEvent({ type: 'GAME_STARTED', wallTime: new Date(now).toISOString() }),
      makeEvent({ type: 'GAME_ENDED', wallTime: new Date(now).toISOString() }),
    ]
    const state = replayEvents(events, now)
    expect(state.isRunning).toBe(false)
  })

  it('STOPPAGE_ADDED accumulates stoppage', () => {
    const now = Date.now()
    const wallTime = new Date(now).toISOString()
    const events = [
      makeEvent({ type: 'GAME_STARTED', wallTime }),
      makeEvent({ type: 'STOPPAGE_ADDED', payload: { seconds: 120 }, wallTime }),
      makeEvent({ type: 'STOPPAGE_ADDED', payload: { seconds: 60 }, wallTime }),
    ]
    const state = replayEvents(events, now)
    expect(state.stoppageSeconds).toBe(180)
  })

  it('initialLineup populates onField from the start', () => {
    const events = [makeEvent({ type: 'GAME_STARTED' })]
    const state = replayEvents(events, Date.now(), lineup)
    expect(state.onField).toHaveLength(1)
    expect(state.onField[0]!.playerId).toBe('p1')
  })
})
