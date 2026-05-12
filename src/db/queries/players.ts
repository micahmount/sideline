import type { Player } from '../../types'
import { toCamel } from './_shared'

export async function createPlayer(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: { teamId: string; name: string; jerseyNumber?: string },
): Promise<Player> {
  const id = crypto.randomUUID()
  await exec(
    `INSERT INTO players (id, team_id, name, jersey_number) VALUES (?, ?, ?, ?)`,
    [id, data.teamId, data.name, data.jerseyNumber ?? ''],
  )
  return { id, teamId: data.teamId, name: data.name, jerseyNumber: data.jerseyNumber ?? '', isActive: true }
}

export async function getPlayer(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<Player | null> {
  const rows = toCamel(await exec('SELECT * FROM players WHERE id = ?', [id]))
  if (!rows.length) return null
  const r = rows[0]! as Record<string, unknown>
  r.isActive = !!r.isActive
  return r as unknown as Player
}

export async function listPlayers(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  teamId: string,
): Promise<Player[]> {
  const rows = toCamel(await exec('SELECT * FROM players WHERE team_id = ? ORDER BY name', [teamId]))
  return rows.map((r) => { r.isActive = !!r.isActive; return r }) as unknown as Player[]
}

export async function updatePlayer(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
  data: Partial<Pick<Player, 'name' | 'jerseyNumber' | 'isActive'>>,
): Promise<void> {
  const set: string[] = []
  const params: unknown[] = []
  if (data.name !== undefined) { set.push('name = ?'); params.push(data.name) }
  if (data.jerseyNumber !== undefined) { set.push('jersey_number = ?'); params.push(data.jerseyNumber) }
  if (data.isActive !== undefined) { set.push('is_active = ?'); params.push(data.isActive ? 1 : 0) }
  if (set.length === 0) return
  params.push(id)
  await exec(`UPDATE players SET ${set.join(', ')} WHERE id = ?`, params)
}

export async function deletePlayer(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<void> {
  await exec('DELETE FROM players WHERE id = ?', [id])
}
