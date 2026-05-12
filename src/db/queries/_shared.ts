export function toCamel(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(r)) {
      out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v
    }
    return out
  })
}

export function toSnake(data: Record<string, unknown>): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {}
  for (const [k, v] of Object.entries(data)) {
    const snake = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    out[snake] = v as string | number | null
  }
  return out
}
