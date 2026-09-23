'use client'

import { useMemo, useState } from 'react'

const DAY_NAMES = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned']
const MONTH_NAMES = [
  'Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December',
]

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1))
}

export default function Calendar({
  bookedPiknikDates,
  showAvailability, // true, če izbira vpliva na zasedenost piknik prostora
  selectedDate,
  onSelect,
}: {
  bookedPiknikDates: string[]
  showAvailability: boolean
  selectedDate: string | null
  onSelect: (dateStr: string) => void
}) {
  const today = useMemo(() => {
    const t = new Date()
    return new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()))
  }, [])
  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setUTCFullYear(d.getUTCFullYear() + 1)
    return d
  }, [today])

  const [cursor, setCursor] = useState(() => startOfMonth(today.getUTCFullYear(), today.getUTCMonth()))

  const bookedSet = useMemo(() => new Set(bookedPiknikDates), [bookedPiknikDates])

  const days = useMemo(() => {
    const year = cursor.getUTCFullYear()
    const month = cursor.getUTCMonth()
    const first = startOfMonth(year, month)
    // Ponedeljek = 0 ... Nedelja = 6
    const firstWeekday = (first.getUTCDay() + 6) % 7
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

    const cells: (Date | null)[] = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d)))
    return cells
  }, [cursor])

  const canGoPrev = cursor > startOfMonth(today.getUTCFullYear(), today.getUTCMonth())
  const canGoNext = cursor < startOfMonth(maxDate.getUTCFullYear(), maxDate.getUTCMonth())

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setCursor((c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() - 1, 1)))}
          className="btn btn-secondary !px-3 !py-1.5 disabled:opacity-30"
          aria-label="Prejšnji mesec"
        >
          ←
        </button>
        <h3 className="text-xl sm:text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
          {MONTH_NAMES[cursor.getUTCMonth()]} {cursor.getUTCFullYear()}
        </h3>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setCursor((c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1)))}
          className="btn btn-secondary !px-3 !py-1.5 disabled:opacity-30"
          aria-label="Naslednji mesec"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />

          const dateStr = toDateStr(date)
          const isPast = date < today
          const isTooFar = date > maxDate
          const isBooked = showAvailability && bookedSet.has(dateStr)
          const disabled = isPast || isTooFar || isBooked
          const isSelected = selectedDate === dateStr

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              className="relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all"
              style={{
                background: isSelected
                  ? 'var(--color-primary)'
                  : isBooked
                    ? 'var(--color-bg-alt)'
                    : 'var(--color-surface)',
                color: isSelected ? '#fff8ef' : disabled ? 'var(--color-text-muted)' : 'var(--color-text)',
                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: isPast || isTooFar ? 0.35 : 1,
              }}
            >
              <span>{date.getUTCDate()}</span>
              {isBooked && (
                <span
                  className="absolute bottom-1 text-[8px] font-bold uppercase tracking-tight"
                  style={{ color: 'var(--color-danger)' }}
                >
                  zasedeno
                </span>
              )}
            </button>
          )
        })}
      </div>

      {showAvailability && (
        <div className="flex items-center gap-4 mt-5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
            />
            Piknik prostor zaseden
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ background: 'var(--color-primary)' }}
            />
            Izbrano
          </span>
        </div>
      )}
    </div>
  )
}
