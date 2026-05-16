import type { Coach } from '../../types'
import { toCamel } from './_shared'
import { randomId } from '../../lib/randomId'

export async function createCoach(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: { name: string; email: string },
): Promise<Coach> {
  const id = randomId()
  await exec(
    'INSERT INTO coaches (id, name, email) VALUES (?, ?, ?)',
    [id, data.name, data.email],
  )
  return { id, name: data.name, email: data.email }
}

export async function listCoaches(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
): Promise<Coach[]> {
  const rows = toCamel(await exec('SELECT * FROM coaches'))
  return rows as unknown as Coach[]
}

export async function getCoach(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<Coach | null> {
  const rows = toCamel(await exec('SELECT * FROM coaches WHERE id = ?', [id]))
  return (rows[0] as Coach | undefined) ?? null
}
