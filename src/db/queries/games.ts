import type { Game, GameRoster } from '../../types'
import { toCamel } from './_shared'

export async function createGame(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: {
    teamId: string
    profileId: string
    positionTemplateId?: string | null
    opponent: string
    scheduledAt: string
    periodCount: number
    periodLengthMinutes: number
  },
): Promise<Game> {
  const id = crypto.randomUUID()
  await exec(
    `INSERT INTO games (id, team_id, profile_id, position_template_id, opponent, scheduled_at, period_count, period_length_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.teamId, data.profileId, data.positionTemplateId ?? null, data.opponent, data.scheduledAt, data.periodCount, data.periodLengthMinutes],
  )
  return { id, ...data, positionTemplateId: data.positionTemplateId ?? null, stoppageSeconds: 0, status: 'upcoming' }
}

export async function getGame(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<Game | null> {
  const rows = toCamel(await exec('SELECT * FROM games WHERE id = ?', [id]))
  return (rows[0] as Game | undefined) ?? null
}

export async function listGames(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  teamId: string,
): Promise<Game[]> {
  const rows = toCamel(
    await exec('SELECT * FROM games WHERE team_id = ? ORDER BY scheduled_at DESC', [teamId]),
  )
  return rows as unknown as Game[]
}

export async function updateGame(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
  data: Partial<Pick<Game, 'opponent' | 'scheduledAt' | 'periodCount' | 'periodLengthMinutes' | 'status' | 'positionTemplateId'>>,
): Promise<void> {
  const set: string[] = []
  const params: unknown[] = []
  if (data.opponent !== undefined) { set.push('opponent = ?'); params.push(data.opponent) }
  if (data.scheduledAt !== undefined) { set.push('scheduled_at = ?'); params.push(data.scheduledAt) }
  if (data.periodCount !== undefined) { set.push('period_count = ?'); params.push(data.periodCount) }
  if (data.periodLengthMinutes !== undefined) { set.push('period_length_minutes = ?'); params.push(data.periodLengthMinutes) }
  if (data.status !== undefined) { set.push('status = ?'); params.push(data.status) }
  if (data.positionTemplateId !== undefined) { set.push('position_template_id = ?'); params.push(data.positionTemplateId) }
  if (set.length === 0) return
  params.push(id)
  await exec(`UPDATE games SET ${set.join(', ')} WHERE id = ?`, params)
}

export async function deleteGame(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<void> {
  await exec('DELETE FROM games WHERE id = ?', [id])
}

// ─── Game Roster ───────────────────────────────────────────────────────────────

export async function addToGameRoster(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: { gameId: string; playerId: string; available?: boolean; targetMinutes?: number | null },
): Promise<GameRoster> {
  const id = crypto.randomUUID()
  await exec(
    `INSERT INTO game_rosters (id, game_id, player_id, available, target_minutes) VALUES (?, ?, ?, ?, ?)`,
    [id, data.gameId, data.playerId, data.available ?? true, data.targetMinutes ?? null],
  )
  return { id, gameId: data.gameId, playerId: data.playerId, available: data.available ?? true, targetMinutes: data.targetMinutes ?? null }
}

export async function listGameRoster(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  gameId: string,
): Promise<GameRoster[]> {
  const rows = toCamel(await exec('SELECT * FROM game_rosters WHERE game_id = ?', [gameId]))
  return rows.map((r) => ({ ...r, available: !!r.available })) as GameRoster[]
}

export async function updateGameRoster(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
  data: Partial<Pick<GameRoster, 'available' | 'targetMinutes'>>,
): Promise<void> {
  const set: string[] = []
  const params: unknown[] = []
  if (data.available !== undefined) { set.push('available = ?'); params.push(data.available ? 1 : 0) }
  if (data.targetMinutes !== undefined) { set.push('target_minutes = ?'); params.push(data.targetMinutes) }
  if (set.length === 0) return
  params.push(id)
  await exec(`UPDATE game_rosters SET ${set.join(', ')} WHERE id = ?`, params)
}

export async function removeFromGameRoster(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<void> {
  await exec('DELETE FROM game_rosters WHERE id = ?', [id])
}
