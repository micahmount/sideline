import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSeasonsStore } from '../stores/seasons'

export default function CreateSeason() {
  const navigate = useNavigate()
  const create = useSeasonsStore((s) => s.create)
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [division, setDivision] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setError('')
    await create({
      coachId: 'default-coach',
      name: name.trim(),
      year: parseInt(year, 10) || new Date().getFullYear(),
      division: division.trim(),
    })
    navigate('/')
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">New Season</h1>

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
    </div>
  )
}
