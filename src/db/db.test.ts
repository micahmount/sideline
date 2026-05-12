import { describe, it, expect } from 'vitest'
import migrationSql from './migrations/001_initial.sql?raw'

describe('migration', () => {
  async function createDb() {
    const sqlite3 = await import('@sqlite.org/sqlite-wasm').then((m) => m.default())
    const db = new sqlite3.oo1.DB(':memory:')
    db.exec(migrationSql)
    return db
  }

  async function query(
    db: Awaited<ReturnType<typeof createDb>>,
    sql: string,
    params?: unknown[],
  ) {
    const rows: Record<string, unknown>[] = []
    const stmt = db.prepare(sql)
    if (params) stmt.bind(params as never)
    while (stmt.step()) {
      const row: Record<string, unknown> = {}
      for (let i = 0; i < stmt.columnCount; i++) {
        row[stmt.getColumnName(i)] = stmt.get(i)
      }
      rows.push(row)
    }
    stmt.finalize()
    return rows
  }

  it('migration creates all core tables', async () => {
    const db = await createDb()
    const rows = await query(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    )
    const names = rows.map((r) => r.name as string)
    expect(names).toContain('coaches')
    expect(names).toContain('seasons')
    expect(names).toContain('teams')
    expect(names).toContain('players')
    expect(names).toContain('position_templates')
    expect(names).toContain('playing_time_profiles')
    expect(names).toContain('games')
    expect(names).toContain('game_rosters')
    expect(names).toContain('game_events')
    expect(names).toContain('lineup_slots')
    expect(names).toContain('sub_queue_entries')
    expect(names).toContain('settings')
    expect(names).toContain('_migrations')
  })

  it('settings has default row', async () => {
    const db = await createDb()
    const rows = await query(db, 'SELECT * FROM settings')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.nudge_haptic).toBe('short')
    expect(rows[0]!.nudge_audio).toBe('tone')
  })

  it('exec with params works', async () => {
    const db = await createDb()
    const rows = await query(db, 'SELECT ? as value, ? as label', [42, 'hello'])
    expect(rows).toEqual([{ value: 42, label: 'hello' }])
  })

  it('INSERT and SELECT round-trip', async () => {
    const db = await createDb()
    db.exec("INSERT INTO coaches (id, name, email) VALUES ('c1', 'Test', 't@t.com')")
    const rows = await query(db, 'SELECT * FROM coaches')
    expect(rows).toEqual([{ id: 'c1', name: 'Test', email: 't@t.com' }])
  })
})
