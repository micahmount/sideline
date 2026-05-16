export interface FieldSlot {
  x: number
  y: number
  label: string
  playerName?: string
  playerId?: string
  color?: string
}

interface SoccerFieldProps {
  slots: FieldSlot[]
  onSlotTap?: (slotIndex: number) => void
  onSlotDrop?: (slotIndex: number, playerId: string) => void
  className?: string
}

const fieldW = 400
const fieldH = 600

export default function SoccerField({ slots, onSlotTap, onSlotDrop, className = '' }: SoccerFieldProps) {
  return (
    <svg
      viewBox={`0 0 ${fieldW} ${fieldH}`}
      className={`w-full max-w-sm mx-auto ${className}`}
      role="img"
      aria-label="Soccer field"
    >
      <rect x={0} y={0} width={fieldW} height={fieldH} fill="#4ade80" rx={8} />

      <rect x={10} y={10} width={fieldW - 20} height={fieldH - 20} fill="none" stroke="white" strokeWidth={2} rx={4} />
      <line x1={fieldW / 2} y1={10} x2={fieldW / 2} y2={fieldH - 10} stroke="white" strokeWidth={2} />
      <circle cx={fieldW / 2} cy={fieldH / 2} r={30} fill="none" stroke="white" strokeWidth={2} />

      <rect x={fieldW / 2 - 60} y={10} width={120} height={80} fill="none" stroke="white" strokeWidth={2} rx={4} />
      <rect x={fieldW / 2 - 60} y={fieldH - 90} width={120} height={80} fill="none" stroke="white" strokeWidth={2} rx={4} />

      <rect x={fieldW / 2 - 25} y={10} width={50} height={40} fill="none" stroke="white" strokeWidth={2} />
      <rect x={fieldW / 2 - 25} y={fieldH - 50} width={50} height={40} fill="none" stroke="white" strokeWidth={2} />

      {slots.map((slot, i) => (
        <g
          key={i}
          onClick={() => onSlotTap?.(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const playerId = e.dataTransfer.getData('playerId')
            if (playerId) onSlotDrop?.(i, playerId)
          }}
          className="cursor-pointer"
        >
          <circle
            cx={slot.x * fieldW}
            cy={slot.y * fieldH}
            r={slot.playerName ? 22 : 16}
            fill={slot.color ?? (slot.playerName ? '#3b82f6' : '#94a3b8')}
            opacity={slot.playerName ? 1 : 0.5}
            stroke="white"
            strokeWidth={2}
          />
          {slot.playerName && (
            <text
              x={slot.x * fieldW}
              y={slot.y * fieldH + 4}
              textAnchor="middle"
              fill="white"
              fontSize={10}
              fontWeight="bold"
            >
              {slot.playerName.length > 10 ? slot.playerName.slice(0, 10) + '…' : slot.playerName}
            </text>
          )}
          {!slot.playerName && (
            <text
              x={slot.x * fieldW}
              y={slot.y * fieldH + 4}
              textAnchor="middle"
              fill="white"
              fontSize={9}
            >
              {slot.label.length > 8 ? slot.label.slice(0, 8) : slot.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
