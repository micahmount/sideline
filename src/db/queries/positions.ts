import type { PositionCategory, PositionTemplate } from '../../types'
import { toCamel } from './_shared'

export async function createPositionTemplate(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: { teamId: string; templateName: string; slotName: string; category: PositionCategory; fieldX: number; fieldY: number },
): Promise<PositionTemplate> {
  const id = crypto.randomUUID()
  await exec(
    `INSERT INTO position_templates (id, team_id, template_name, slot_name, category, field_x, field_y) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.teamId, data.templateName, data.slotName, data.category, data.fieldX, data.fieldY],
  )
  return { id, ...data }
}

export async function getPositionTemplate(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<PositionTemplate | null> {
  const rows = toCamel(await exec('SELECT * FROM position_templates WHERE id = ?', [id]))
  return (rows[0] as PositionTemplate | undefined) ?? null
}

export async function listPositionTemplates(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  teamId: string,
): Promise<PositionTemplate[]> {
  const rows = toCamel(
    await exec('SELECT * FROM position_templates WHERE team_id = ? ORDER BY template_name, slot_name', [teamId]),
  )
  return rows as unknown as PositionTemplate[]
}

export async function updatePositionTemplate(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
  data: Partial<Pick<PositionTemplate, 'slotName' | 'category' | 'fieldX' | 'fieldY'>>,
): Promise<void> {
  const set: string[] = []
  const params: unknown[] = []
  if (data.slotName !== undefined) { set.push('slot_name = ?'); params.push(data.slotName) }
  if (data.category !== undefined) { set.push('category = ?'); params.push(data.category) }
  if (data.fieldX !== undefined) { set.push('field_x = ?'); params.push(data.fieldX) }
  if (data.fieldY !== undefined) { set.push('field_y = ?'); params.push(data.fieldY) }
  if (set.length === 0) return
  params.push(id)
  await exec(`UPDATE position_templates SET ${set.join(', ')} WHERE id = ?`, params)
}

export async function deletePositionTemplate(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  id: string,
): Promise<void> {
  await exec('DELETE FROM position_templates WHERE id = ?', [id])
}
