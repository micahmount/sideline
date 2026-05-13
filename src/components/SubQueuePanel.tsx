import type { SubQueueEntry, Player } from '../types'

interface SubQueuePanelProps {
  entries: SubQueueEntry[]
  players: Player[]
  onExecuteSub: (entry: SubQueueEntry) => void
  onRemoveFromQueue: (entryId: string) => void
}

export default function SubQueuePanel({ entries, players, onExecuteSub, onRemoveFromQueue }: SubQueuePanelProps) {
  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No pending substitutions.
      </div>
    )
  }

  const coachEntries = entries.filter((e) => e.source === 'coach')
  const suggestionEntries = entries.filter((e) => e.source === 'suggestion')

  function playerName(id: string | null): string {
    if (!id) return '—'
    return players.find((p) => p.id === id)?.name ?? 'Unknown'
  }

  function renderEntry(entry: SubQueueEntry) {
    return (
      <div
        key={entry.id}
        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 text-sm"
      >
        <div className="flex-1">
          <span className="font-medium">{playerName(entry.playerOutId)}</span>
          <span className="text-gray-400 mx-1">&rarr;</span>
          <span className="font-medium">{playerName(entry.playerInId)}</span>
          {entry.positionId && (
            <span className="ml-2 text-xs text-gray-500">(#pos)</span>
          )}
          {entry.source === 'suggestion' && (
            <span className="ml-2 text-xs text-purple-500" title="Suggestion">&#9889;</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onExecuteSub(entry)}
            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
          >
            Execute
          </button>
          <button
            onClick={() => onRemoveFromQueue(entry.id)}
            className="text-red-500 text-xs hover:text-red-700 px-1"
          >
            &times;
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {coachEntries.length > 0 && (
        <div>
          {coachEntries.map(renderEntry)}
        </div>
      )}
      {suggestionEntries.length > 0 && (
        <div className="border-t border-gray-100 pt-1 mt-1">
          <p className="text-xs text-gray-400 mb-1">Suggestions</p>
          {suggestionEntries.map(renderEntry)}
        </div>
      )}
    </div>
  )
}
