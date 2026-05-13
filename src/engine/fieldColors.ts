export function timeOnFieldColor(seconds: number, target: number): string {
  if (target === 0) return '#3b82f6'
  const ratio = seconds / target
  if (ratio < 0.9) return '#22c55e'
  if (ratio < 1.05) return '#eab308'
  return '#ef4444'
}
