import { describe, it, expect } from 'vitest'
import { timeOnFieldColor } from './fieldColors'

describe('timeOnFieldColor', () => {
  it('returns blue for zero target', () => {
    expect(timeOnFieldColor(100, 0)).toBe('#3b82f6')
  })

  it('returns green when well under target (ratio < 0.9)', () => {
    expect(timeOnFieldColor(100, 120)).toBe('#22c55e')
  })

  it('returns amber when approaching target (0.9 <= ratio < 1.05)', () => {
    expect(timeOnFieldColor(110, 120)).toBe('#eab308')
  })

  it('returns red when at or over target (ratio >= 1.05)', () => {
    expect(timeOnFieldColor(126, 120)).toBe('#ef4444')
  })
})
