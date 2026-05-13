import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from './settings'

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('../db/client', () => ({
  exec: mockExec,
}))

beforeEach(() => {
  useSettingsStore.setState({ nudgeHaptic: 'short', nudgeAudio: 'tone', loaded: false })
  mockExec.mockReset()
})

describe('settings store', () => {
  it('loads settings from db', async () => {
    mockExec.mockResolvedValue([{ nudge_haptic: 'long', nudge_audio: 'whistle' }])
    await useSettingsStore.getState().load()
    const s = useSettingsStore.getState()
    expect(s.nudgeHaptic).toBe('long')
    expect(s.nudgeAudio).toBe('whistle')
    expect(s.loaded).toBe(true)
  })

  it('loads defaults when no row found', async () => {
    mockExec.mockResolvedValue([])
    await useSettingsStore.getState().load()
    const s = useSettingsStore.getState()
    expect(s.nudgeHaptic).toBe('short')
    expect(s.nudgeAudio).toBe('tone')
    expect(s.loaded).toBe(true)
  })

  it('sets haptic preference', async () => {
    mockExec.mockResolvedValue([])
    await useSettingsStore.getState().setHaptic('off')
    const s = useSettingsStore.getState()
    expect(s.nudgeHaptic).toBe('off')
  })

  it('sets audio preference', async () => {
    mockExec.mockResolvedValue([])
    await useSettingsStore.getState().setAudio('whistle')
    const s = useSettingsStore.getState()
    expect(s.nudgeAudio).toBe('whistle')
  })
})
