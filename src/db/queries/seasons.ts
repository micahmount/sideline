import type { Season } from '../../types'
import { toCamel } from './_shared'

export async function createSeason(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: { coachId: string; name: string; year: number; division?: string },
): Promise<Season> {
  const id = crypto.randomUUID()
  await exec(
    `INSERT INTO seasons (id, coach_id, name, year, division) VALUES (?, ?, ?, ?, ?)`,
    [id, data.coachId, data.name, data.year, data.division ?? ''],
  )
  return { id, coachId: data.coachId, name: data.name, year: data.year, division: data.division ?? '' }
}

export async function getSeason(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<Season | null> {
  const rows = toCamel(await exec('SELECT * FROM seasons WHERE id = ?', [id]))
  return (rows[0] as Season | undefined) ?? null
}

export async function listSeasons(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
): Promise<Season[]> {
  const rows = toCamel(await exec('SELECT * FROM seasons ORDER BY year DESC, name'))
  return rows as unknown as Season[]
}

export async function updateSeason(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
  data: Partial<Pick<Season, 'name' | 'year' | 'division'>>,
): Promise<void> {
  const set: string[] = []
  const params: unknown[] = []
  if (data.name !== undefined) { set.push('name = ?'); params.push(data.name) }
  if (data.year !== undefined) { set.push('year = ?'); params.push(data.year) }
  if (data.division !== undefined) { set.push('division = ?'); params.push(data.division) }
  if (set.length === 0) return
  params.push(id)
  await exec(`UPDATE seasons SET ${set.join(', ')} WHERE id = ?`, params)
}

export async function deleteSeason(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<void> {
  await exec('DELETE FROM seasons WHERE id = ?', [id])
}
