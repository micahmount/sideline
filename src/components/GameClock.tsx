interface GameClockProps {
  clockSeconds: number
  isRunning: boolean
  currentPeriod: number
  stoppageSeconds: number
  onPause?: () => void
  onResume?: () => void
  onAddStoppage?: () => void
  onEndPeriod?: () => void
  onEndGame?: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const PERIOD_LABELS: Record<number, string> = {
  1: '1st Half',
  2: '2nd Half',
  3: 'OT1',
  4: 'OT2',
}

export default function GameClock({
  clockSeconds, isRunning, currentPeriod, stoppageSeconds,
  onPause, onResume, onAddStoppage, onEndPeriod, onEndGame,
}: GameClockProps) {
  return (
    <div className="bg-gray-900 text-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">
          {PERIOD_LABELS[currentPeriod] ?? `Period ${currentPeriod}`}
        </span>
        {stoppageSeconds > 0 && (
          <span className="text-xs text-amber-400">+{stoppageSeconds}s stoppage</span>
        )}
      </div>

      <div className="text-4xl font-mono font-bold text-center mb-3 tabular-nums">
        {formatTime(clockSeconds)}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {isRunning ? (
          <button onClick={onPause} className="bg-amber-600 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-700">
            Pause
          </button>
        ) : (
          <button onClick={onResume} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700">
            Resume
          </button>
        )}
        <button onClick={onAddStoppage} className="bg-gray-700 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-600">
          +Stoppage
        </button>
        {!isRunning && (
          <>
            <button onClick={onEndPeriod} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">
              End Period
            </button>
            <button onClick={onEndGame} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700">
              End Game
            </button>
          </>
        )}
      </div>
    </div>
  )
}
