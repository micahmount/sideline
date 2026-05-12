import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initDB } from '../db/client'
import Home from '../views/Home'
import SeasonDetail from '../views/SeasonDetail'
import CreateSeason from '../views/CreateSeason'
import CreateTeam from '../views/CreateTeam'
import TeamDetail from '../views/TeamDetail'

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Failed to initialize database: {error}
      </div>
    )
  }

  if (!ready) {
    return <div className="p-4 text-gray-500">Initializing...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/season/new" element={<CreateSeason />} />
        <Route path="/season/:id" element={<SeasonDetail />} />
        <Route path="/season/:seasonId/team/new" element={<CreateTeam />} />
        <Route path="/team/:id" element={<TeamDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
