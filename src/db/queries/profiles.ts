import type { PlayingTimeProfile, PlayingTimeStrategy } from '../../types'
import { toCamel } from './_shared'
import { randomId } from '../../lib/randomId'

export async function createProfile(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: { teamId: string; name: string; strategy: PlayingTimeStrategy; config?: Record<string, unknown> },
): Promise<PlayingTimeProfile> {
  const id = randomId()
  const config = data.config ?? {}
  await exec(
    `INSERT INTO playing_time_profiles (id, team_id, name, strategy, config) VALUES (?, ?, ?, ?, ?)`,
    [id, data.teamId, data.name, data.strategy, JSON.stringify(config)],
  )
  return { id, teamId: data.teamId, name: data.name, strategy: data.strategy, config }
}

export async function getProfile(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<PlayingTimeProfile | null> {
  const rows = toCamel(await exec('SELECT * FROM playing_time_profiles WHERE id = ?', [id]))
  if (!rows.length) return null
  const row = rows[0]! as Record<string, unknown>
  row.config = JSON.parse(row.config as string)
  return row as unknown as PlayingTimeProfile
}

export async function listProfiles(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  teamId: string,
): Promise<PlayingTimeProfile[]> {
  const rows = toCamel(
    await exec('SELECT * FROM playing_time_profiles WHERE team_id = ? ORDER BY name', [teamId]),
  )
  return rows.map((r) => {
    const row = { ...r }
    row.config = JSON.parse(row.config as string)
    return row as unknown as PlayingTimeProfile
  })
}

export async function updateProfile(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
  data: Partial<Pick<PlayingTimeProfile, 'name' | 'strategy' | 'config'>>,
): Promise<void> {
  const set: string[] = []
  const params: unknown[] = []
  if (data.name !== undefined) { set.push('name = ?'); params.push(data.name) }
  if (data.strategy !== undefined) { set.push('strategy = ?'); params.push(data.strategy) }
  if (data.config !== undefined) { set.push('config = ?'); params.push(JSON.stringify(data.config)) }
  if (set.length === 0) return
  params.push(id)
  await exec(`UPDATE playing_time_profiles SET ${set.join(', ')} WHERE id = ?`, params)
}

export async function deleteProfile(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<void> {
  await exec('DELETE FROM playing_time_profiles WHERE id = ?', [id])
}
