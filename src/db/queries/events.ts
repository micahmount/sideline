import type { GameEvent, GameEventType } from '../../types'
import { toCamel } from './_shared'
import { randomId } from '../../lib/randomId'

export async function appendEvent(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: {
    gameId: string
    type: GameEventType
    payload: Record<string, unknown>
    gameClockSeconds: number
    wallTime?: string
  },
): Promise<GameEvent> {
  const id = randomId()
  const wallTime = data.wallTime ?? new Date().toISOString()
  await exec(
    `INSERT INTO game_events (id, game_id, type, payload, game_clock_seconds, wall_time) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.gameId, data.type, JSON.stringify(data.payload), data.gameClockSeconds, wallTime],
  )
  return { id, gameId: data.gameId, type: data.type, payload: data.payload, gameClockSeconds: data.gameClockSeconds, wallTime, isEdited: false }
}

export async function listEvents(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  gameId: string,
): Promise<GameEvent[]> {
  const rows = toCamel(
    await exec('SELECT * FROM game_events WHERE game_id = ? ORDER BY wall_time, id', [gameId]),
  )
  return rows.map((r) => {
    const row = { ...r }
    row.payload = JSON.parse(row.payload as string)
    row.isEdited = !!row.isEdited
    return row as unknown as GameEvent
  })
}
