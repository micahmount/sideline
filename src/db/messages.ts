export type DBRequest =
  | { type: 'init' }
  | { type: 'exec'; sql: string; params?: unknown[] }
  | { type: 'execMany'; sql: string[] }

export type DBResponse =
  | { type: 'ready' }
  | { type: 'result'; rows: Record<string, unknown>[] }
  | { type: 'error'; message: string }

export interface Envelope<T = unknown> {
  id: string
  payload: T
}
