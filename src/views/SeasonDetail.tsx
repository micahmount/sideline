import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSeasonsStore } from '../stores/seasons'
import { useTeamsStore } from '../stores/teams'

export default function SeasonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { seasons, loaded: seasonsLoaded, load: loadSeasons, remove } = useSeasonsStore()
  const { teams, loaded: teamsLoaded, load: loadTeams } = useTeamsStore()

  useEffect(() => {
    if (!seasonsLoaded) loadSeasons()
  }, [seasonsLoaded, loadSeasons])

  useEffect(() => {
    if (id && !teamsLoaded) loadTeams(id)
  }, [id, teamsLoaded, loadTeams])

  if (!seasonsLoaded) {
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Teams</h2>
          <Link
            to={`/season/${season.id}/team/new`}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
          >
            + Add Team
          </Link>
        </div>

        {teams.length === 0 ? (
          <p className="text-gray-500">No teams yet.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/team/${t.id}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm"
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="ml-2 text-sm text-gray-500">{t.format}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
