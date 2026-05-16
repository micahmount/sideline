import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initDB, destroyDB } from '../db/client'
import ErrorBoundary from './ErrorBoundary'
import InstallPrompt from './InstallPrompt'
import { useCoachesStore } from '../stores/coaches'
import CoachSetup from '../views/CoachSetup'
import Home from '../views/Home'
import SeasonDetail from '../views/SeasonDetail'
import CreateSeason from '../views/CreateSeason'
import EditSeason from '../views/EditSeason'
import CreateTeam from '../views/CreateTeam'
import TeamDetail from '../views/TeamDetail'
import CreateGame from '../views/CreateGame'
import PreGameLineup from '../views/PreGameLineup'
import GameDay from '../views/GameDay'
import EventLog from '../views/EventLog'
import GameSummary from '../views/GameSummary'
import Settings from '../views/Settings'

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const coach = useCoachesStore((s) => s.coach)
  const coachLoaded = useCoachesStore((s) => s.loaded)
  const loadCoach = useCoachesStore((s) => s.load)

  useEffect(() => {
    let cancelled = false
    initDB()
      .then(() => {
        if (cancelled) return
        return loadCoach()
      })
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
      destroyDB()
    }
  }, [loadCoach])

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

  if (coachLoaded && !coach) {
    return <ErrorBoundary><CoachSetup /></ErrorBoundary>
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
        <Route path="/season/new" element={<ErrorBoundary><CreateSeason /></ErrorBoundary>} />
        <Route path="/season/:id" element={<ErrorBoundary><SeasonDetail /></ErrorBoundary>} />
        <Route path="/season/:id/edit" element={<ErrorBoundary><EditSeason /></ErrorBoundary>} />
        <Route path="/season/:seasonId/team/new" element={<ErrorBoundary><CreateTeam /></ErrorBoundary>} />
        <Route path="/team/:id" element={<ErrorBoundary><TeamDetail /></ErrorBoundary>} />
        <Route path="/game/new" element={<ErrorBoundary><CreateGame /></ErrorBoundary>} />
        <Route path="/game/:id/lineup" element={<ErrorBoundary><PreGameLineup /></ErrorBoundary>} />
        <Route path="/game/:id/live" element={<ErrorBoundary><GameDay /></ErrorBoundary>} />
        <Route path="/game/:id/events" element={<ErrorBoundary><EventLog /></ErrorBoundary>} />
        <Route path="/game/:id/summary" element={<ErrorBoundary><GameSummary /></ErrorBoundary>} />
        <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
      </Routes>
    </BrowserRouter>
  )
}
