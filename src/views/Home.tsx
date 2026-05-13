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
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="text-gray-500 hover:text-gray-700"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <Link
            to="/season/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create
          </Link>
        </div>
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
