import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTeamsStore } from '../stores/teams'
import type { GameFormat } from '../types'

const PRESET_FORMATS: { format: GameFormat; label: string; count: number }[] = [
  { format: '4v4', label: '4v4 (U6–U8)', count: 4 },
  { format: '5v5', label: '5v5', count: 5 },
  { format: '7v7', label: '7v7 (U8–U10)', count: 7 },
  { format: '9v9', label: '9v9 (U11–U12)', count: 9 },
  { format: '11v11', label: '11v11 (U13+)', count: 11 },
]

export default function CreateTeam() {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const create = useTeamsStore((s) => s.create)
  const [name, setName] = useState('')
  const [format, setFormat] = useState<GameFormat>('7v7')
  const [fieldPlayerCount, setFieldPlayerCount] = useState('7')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setError('')

    const isCustom = format === 'custom'
    await create({
      seasonId: seasonId!,
      name: name.trim(),
      format,
      fieldPlayerCount: isCustom ? parseInt(fieldPlayerCount, 10) || 7 : PRESET_FORMATS.find((f) => f.format === format)!.count,
    })
    navigate(`/season/${seasonId}`)
  }

  function handleFormatChange(value: string) {
    setFormat(value as GameFormat)
    if (value !== 'custom') {
      const preset = PRESET_FORMATS.find((f) => f.format === value)
      if (preset) setFieldPlayerCount(String(preset.count))
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to={`/season/${seasonId}`} className="text-blue-600 hover:underline">&larr; Back</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">New Team</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Team Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g. Thunder"
          />
        </div>

        <div>
          <label htmlFor="format" className="block text-sm font-medium">Format</label>
          <select
            id="format"
            value={format}
            onChange={(e) => handleFormatChange(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {PRESET_FORMATS.map((f) => (
              <option key={f.format} value={f.format}>{f.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>

        {format === 'custom' && (
          <div>
            <label htmlFor="fieldPlayerCount" className="block text-sm font-medium">Field Players</label>
            <input
              id="fieldPlayerCount"
              type="number"
              min={1}
              value={fieldPlayerCount}
              onChange={(e) => setFieldPlayerCount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Save
        </button>
      </form>
    </div>
  )
}
