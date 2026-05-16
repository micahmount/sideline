import type { DBRequest, DBResponse, Envelope } from './messages'
import { randomId } from '../lib/randomId'

type Pending = {
  resolve: (res: DBResponse) => void
  reject: (err: Error) => void
}

let worker: Worker | null = null
const pending = new Map<string, Pending>()

function post(payload: DBRequest): Promise<DBResponse> {
  const id = randomId()
  const promise = new Promise<DBResponse>((resolve, reject) => {
    pending.set(id, { resolve, reject })
  })

  worker!.postMessage({ id, payload } satisfies Envelope<DBRequest>)
  return promise
}

export async function initDB() {
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

  worker.onmessage = (e: MessageEvent<Envelope<DBResponse>>) => {
    const { id, payload } = e.data

    if (payload.type === 'ready' && !id) {
      return
    }

    const p = pending.get(id)
    if (!p) return
    pending.delete(id)

    if (payload.type === 'error') {
      p.reject(new Error(payload.message))
    } else {
      p.resolve(payload)
    }
  }

  worker.onerror = (err) => {
    throw new Error(`Worker error: ${err.message}`)
  }

  await post({ type: 'init' })
}

export async function exec(sql: string, params?: unknown[]) {
  const res = await post({ type: 'exec', sql, params })
  if (res.type === 'result') return res.rows
  throw new Error('Unexpected response')
}

export async function execMany(sql: string[]) {
  const res = await post({ type: 'execMany', sql })
  if (res.type === 'result') return
  throw new Error('Unexpected response')
}

export function destroyDB() {
  worker?.terminate()
  worker = null
  pending.clear()
}
