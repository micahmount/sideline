import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSettingsStore } from '../stores/settings'
import type { NudgeHaptic, NudgeAudio } from '../types'

const HAPTIC_OPTIONS: { value: NudgeHaptic; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'short', label: 'Short pulse' },
  { value: 'long', label: 'Long pulse' },
]

const AUDIO_OPTIONS: { value: NudgeAudio; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'tone', label: 'Subtle tone' },
  { value: 'whistle', label: 'Whistle' },
]

export default function Settings() {
  const { nudgeHaptic, nudgeAudio, loaded, load, setHaptic, setAudio } = useSettingsStore()

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Sub Reminders</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Haptic</label>
          <div className="flex gap-2">
            {HAPTIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setHaptic(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm border ${
                  nudgeHaptic === opt.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Audio</label>
          <div className="flex gap-2">
            {AUDIO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAudio(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm border ${
                  nudgeAudio === opt.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-400">Account / Sync</h2>
        <p className="text-sm text-gray-400">Coming in a future version.</p>
      </section>
    </div>
  )
}
