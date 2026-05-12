import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSeasonsStore } from '../stores/seasons'

export default function SeasonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { seasons, loaded, load, remove } = useSeasonsStore()

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  if (!loaded) {
    return <div className="p-4 text-gray-500">Loading...</div>
  }

  const season = seasons.find((s) => s.id === id)

  if (!season) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>
        <p className="text-gray-500 mt-8">Season not found.</p>
      </div>
    )
  }

  async function handleDelete() {
    if (season && window.confirm('Delete this season?')) {
      await remove(season.id)
      navigate('/')
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to="/" className="text-blue-600 hover:underline">&larr; Back</Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold">{season.name}</h1>
        <p className="text-gray-500">
          {season.year} &middot; {season.division || 'No division'}
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        <Link
          to={`/season/${season.id}/edit`}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Edit
        </Link>
        <button
          onClick={handleDelete}
          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
        >
          Delete
        </button>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Teams</h2>
        <p className="text-gray-500">No teams yet.</p>
      </section>
    </div>
  )
}
