import type { DBRequest, Envelope } from './messages'
import migrationSql from './migrations/001_initial.sql?raw'

let db: import('@sqlite.org/sqlite-wasm').Database | null = null

async function init() {
  const sqlite3 = await import('@sqlite.org/sqlite-wasm').then((m) => m.default())
  db = new sqlite3.oo1.DB(':memory:')
  db.exec(migrationSql)
  postMessage({ id: '', payload: { type: 'ready' } })
}

onmessage = async (e: MessageEvent<Envelope<DBRequest>>) => {
  const { id, payload } = e.data

  try {
    switch (payload.type) {
      case 'init':
        await init()
        break

      case 'exec': {
        if (!db) throw new Error('DB not initialized')

        const rows: Record<string, unknown>[] = []
        const stmt = db.prepare(payload.sql)
        if (payload.params) stmt.bind(payload.params as never)

        while (stmt.step()) {
          const row: Record<string, unknown> = {}
          for (let i = 0; i < stmt.columnCount; i++) {
            row[stmt.getColumnName(i)] = stmt.get(i)
          }
          rows.push(row)
        }
        stmt.finalize()

        postMessage({ id, payload: { type: 'result', rows } })
        break
      }

      case 'execMany': {
        if (!db) throw new Error('DB not initialized')

        for (const sql of payload.sql) {
          db.exec(sql)
        }
        postMessage({ id, payload: { type: 'result', rows: [] } })
        break
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    postMessage({ id, payload: { type: 'error', message } })
  }
}
