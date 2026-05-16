import { describe, it, expect } from 'vitest'
import { parseVersion, compareVersions, getAppVersion, isNewerVersion } from '../version'

describe('parseVersion', () => {
  it('parses valid semantic version strings', () => {
    const result = parseVersion('1.2.3')
    expect(result).toEqual({ major: 1, minor: 2, patch: 3 })
  })

  it('parses zero versions', () => {
    const result = parseVersion('0.0.0')
    expect(result).toEqual({ major: 0, minor: 0, patch: 0 })
  })

  it('parses large version numbers', () => {
    const result = parseVersion('10.20.30')
    expect(result).toEqual({ major: 10, minor: 20, patch: 30 })
  })

  it('throws error for invalid format without patch', () => {
    expect(() => parseVersion('1.2')).toThrow('Invalid semantic version format')
  })

  it('throws error for invalid format with extra dots', () => {
    expect(() => parseVersion('1.2.3.4')).toThrow('Invalid semantic version format')
  })

  it('throws error for non-numeric versions', () => {
    expect(() => parseVersion('a.b.c')).toThrow('Invalid semantic version format')
  })

  it('throws error for versions with letters', () => {
    expect(() => parseVersion('1.2.3-alpha')).toThrow('Invalid semantic version format')
  })
})

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0)
  })

  it('returns -1 when first version is older (major)', () => {
    expect(compareVersions('1.2.3', '2.0.0')).toBe(-1)
  })

  it('returns 1 when first version is newer (major)', () => {
    expect(compareVersions('2.0.0', '1.2.3')).toBe(1)
  })

  it('returns -1 when first version is older (minor)', () => {
    expect(compareVersions('1.1.0', '1.2.0')).toBe(-1)
  })

  it('returns 1 when first version is newer (minor)', () => {
    expect(compareVersions('1.2.0', '1.1.0')).toBe(1)
  })

  it('returns -1 when first version is older (patch)', () => {
    expect(compareVersions('1.2.1', '1.2.3')).toBe(-1)
  })

  it('returns 1 when first version is newer (patch)', () => {
    expect(compareVersions('1.2.3', '1.2.1')).toBe(1)
  })

  it('handles zero versions', () => {
    expect(compareVersions('0.0.0', '0.0.1')).toBe(-1)
    expect(compareVersions('0.1.0', '0.0.9')).toBe(1)
  })
})

describe('getAppVersion', () => {
  it('returns a semantic version string', () => {
    const version = getAppVersion()
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('returns consistent version on multiple calls', () => {
    const v1 = getAppVersion()
    const v2 = getAppVersion()
    expect(v1).toBe(v2)
  })
})

describe('isNewerVersion', () => {
  it('returns true when version is newer than current', () => {
    // Current version is 0.1.0, so any newer version should return true
    expect(isNewerVersion('0.2.0')).toBe(true)
    expect(isNewerVersion('1.0.0')).toBe(true)
  })

  it('returns false when version is equal to current', () => {
    const current = getAppVersion()
    expect(isNewerVersion(current)).toBe(false)
  })

  it('returns false when version is older than current', () => {
    expect(isNewerVersion('0.0.1')).toBe(false)
  })
})
