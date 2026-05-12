import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSeasonsStore } from '../stores/seasons'

export default function Home() {
  const { seasons, loaded, loading, load } = useSeasonsStore()

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  if (loading && !loaded) {
    return <div className="p-4 text-gray-500">Loading seasons...</div>
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sideline</h1>
        <Link
          to="/season/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create
        </Link>
      </header>

      {seasons.length === 0 ? (
        <p className="text-gray-500 text-center mt-12">No seasons yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-3">
          {seasons.map((s) => (
            <li key={s.id}>
              <Link
                to={`/season/${s.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm"
              >
                <span className="font-semibold text-lg">{s.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {s.year} &middot; {s.division || 'No division'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
