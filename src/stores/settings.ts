import { create } from 'zustand'
import type { AppSettings, NudgeHaptic, NudgeAudio } from '../types'
import { exec } from '../db/client'
import * as settingsQueries from '../db/queries/settings'

interface SettingsState extends AppSettings {
  loaded: boolean
  load: () => Promise<void>
  setHaptic: (value: NudgeHaptic) => Promise<void>
  setAudio: (value: NudgeAudio) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  nudgeHaptic: 'short',
  nudgeAudio: 'tone',
  loaded: false,

  load: async () => {
    const settings = await settingsQueries.getSettings(exec)
    set({ ...settings, loaded: true })
  },

  setHaptic: async (value) => {
    await settingsQueries.updateSettings(exec, { nudgeHaptic: value })
    set({ nudgeHaptic: value })
  },

  setAudio: async (value) => {
    await settingsQueries.updateSettings(exec, { nudgeAudio: value })
    set({ nudgeAudio: value })
  },
}))
