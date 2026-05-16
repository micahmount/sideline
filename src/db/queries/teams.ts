import type { GameFormat, Team } from '../../types'
import { toCamel } from './_shared'
import { randomId } from '../../lib/randomId'

export async function createTeam(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: { seasonId: string; name: string; format: GameFormat; fieldPlayerCount: number },
): Promise<Team> {
  const id = randomId()
  await exec(
    `INSERT INTO teams (id, season_id, name, format, field_player_count) VALUES (?, ?, ?, ?, ?)`,
    [id, data.seasonId, data.name, data.format, data.fieldPlayerCount],
  )
  return { id, seasonId: data.seasonId, name: data.name, format: data.format, fieldPlayerCount: data.fieldPlayerCount }
}

export async function getTeam(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<Team | null> {
  const rows = toCamel(await exec('SELECT * FROM teams WHERE id = ?', [id]))
  return (rows[0] as Team | undefined) ?? null
}

export async function listTeams(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  seasonId: string,
): Promise<Team[]> {
  const rows = toCamel(await exec('SELECT * FROM teams WHERE season_id = ? ORDER BY name', [seasonId]))
  return rows as unknown as Team[]
}

export async function updateTeam(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
  data: Partial<Pick<Team, 'name' | 'format' | 'fieldPlayerCount'>>,
): Promise<void> {
  const set: string[] = []
  const params: unknown[] = []
  if (data.name !== undefined) { set.push('name = ?'); params.push(data.name) }
  if (data.format !== undefined) { set.push('format = ?'); params.push(data.format) }
  if (data.fieldPlayerCount !== undefined) { set.push('field_player_count = ?'); params.push(data.fieldPlayerCount) }
  if (set.length === 0) return
  params.push(id)
  await exec(`UPDATE teams SET ${set.join(', ')} WHERE id = ?`, params)
}

export async function deleteTeam(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<void> {
  await exec('DELETE FROM teams WHERE id = ?', [id])
}
