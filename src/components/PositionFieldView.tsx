import { useState } from 'react'
import type { PositionCategory, PositionTemplate } from '../types'
import SoccerField from './SoccerField'
import type { FieldSlot } from './SoccerField'

const CATEGORY_LABELS: Record<PositionCategory, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
}

interface PositionFieldViewProps {
  positions: PositionTemplate[]
  templateNames: string[]
  onUpdate: (id: string, data: Partial<Pick<PositionTemplate, 'slotName' | 'category' | 'fieldX' | 'fieldY'>>) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function PositionFieldView({ positions, templateNames, onUpdate, onRemove }: PositionFieldViewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(templateNames[0] || '')
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editSlotName, setEditSlotName] = useState('')
  const [editSlotCategory, setEditSlotCategory] = useState<PositionCategory>('DEF')

  const effectiveTemplate = selectedTemplate || templateNames[0] || ''
  const fieldPositions = positions.filter((p) => p.templateName === effectiveTemplate)
  const fieldSlots: FieldSlot[] = fieldPositions.map((p) => ({
    x: p.fieldX,
    y: p.fieldY,
    label: p.slotName,
  }))

  return (
    <div className="space-y-4">
      <SoccerField
        slots={fieldSlots}
        onSlotTap={(i) => {
          const slot = fieldPositions[i]
          if (slot) {
            setEditingSlotId(slot.id)
            setEditSlotName(slot.slotName)
            setEditSlotCategory(slot.category)
          }
        }}
      />

      {templateNames.length > 1 && (
        <select
          value={effectiveTemplate}
          onChange={(e) => {
            setSelectedTemplate(e.target.value)
            setEditingSlotId(null)
          }}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {templateNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      )}

      {editingSlotId && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <input
            value={editSlotName}
            onChange={(e) => setEditSlotName(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Slot name"
          />
          <select
            value={editSlotCategory}
            onChange={(e) => setEditSlotCategory(e.target.value as PositionCategory)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!editingSlotId) return
                await onUpdate(editingSlotId, { slotName: editSlotName, category: editSlotCategory })
                setEditingSlotId(null)
              }}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingSlotId(null)}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!editingSlotId) return
                await onRemove(editingSlotId)
                setEditingSlotId(null)
              }}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-700 ml-auto"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
