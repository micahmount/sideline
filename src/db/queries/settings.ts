import type { AppSettings, NudgeHaptic, NudgeAudio } from '../../types'

export async function getSettings(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
): Promise<AppSettings> {
  const rows = await exec('SELECT * FROM settings WHERE id = 1')
  if (!rows[0]) return { nudgeHaptic: 'short', nudgeAudio: 'tone' }
  const row = rows[0]
  return {
    nudgeHaptic: row.nudge_haptic as NudgeHaptic,
    nudgeAudio: row.nudge_audio as NudgeAudio,
  }
}

export async function updateSettings(
  exec: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  data: Partial<AppSettings>,
): Promise<void> {
  const set: string[] = []
  const params: unknown[] = []
  if (data.nudgeHaptic !== undefined) { set.push('nudge_haptic = ?'); params.push(data.nudgeHaptic) }
  if (data.nudgeAudio !== undefined) { set.push('nudge_audio = ?'); params.push(data.nudgeAudio) }
  if (set.length === 0) return
  await exec(`UPDATE settings SET ${set.join(', ')} WHERE id = 1`, params)
}
