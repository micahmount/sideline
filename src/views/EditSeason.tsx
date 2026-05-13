import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSeasonsStore } from '../stores/seasons'
import type { Season } from '../types'

function EditSeasonForm({ season, id, onSaved }: { season: Season; id: string; onSaved: () => void }) {
  const update = useSeasonsStore((s) => s.update)
  const [name, setName] = useState(season.name)
  const [year, setYear] = useState(season.year.toString())
  const [division, setDivision] = useState(season.division || '')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setError('')
    await update(id, {
      name: name.trim(),
      year: parseInt(year, 10) || season.year,
      division: division.trim(),
    })
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="e.g. Spring 2026"
        />
      </div>

      <div>
        <label htmlFor="year" className="block text-sm font-medium">Year</label>
        <input
          id="year"
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="division" className="block text-sm font-medium">Division</label>
        <input
          id="division"
          value={division}
          onChange={(e) => setDivision(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="e.g. U12"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Save
      </button>
    </form>
  )
}

export default function EditSeason() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { seasons, loaded, load } = useSeasonsStore()
  const season = seasons.find((s) => s.id === id)

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  if (!loaded) {
    return <div className="p-4 text-gray-500">Loading...</div>
  }

  if (!season) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
        <p className="text-gray-500 mt-8">Season not found.</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to={`/season/${id}`} className="text-blue-600 hover:underline">&larr; Back</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Edit Season</h1>
      <EditSeasonForm season={season} id={id!} onSaved={() => navigate(`/season/${id}`)} />
    </div>
  )
}
