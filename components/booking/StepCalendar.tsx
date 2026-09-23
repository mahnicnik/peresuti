'use client'

import { useWizard } from './WizardContext'
import Calendar from '@/components/Calendar'

export default function StepCalendar() {
  const { bookedPiknikDates, selectedDate, setSelectedDate, baseIncludesPiknik, isPiknikOnly, goNext } = useWizard()

  return (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl">Izberite datum</h2>

              {isPiknikOnly && (
                <div className="card p-4 flex flex-col gap-2" style={{ background: 'var(--color-bg-alt)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-brown-dark)' }}>
                    Kaj je vključeno v najem prostora
                  </span>
                  <ul
                    className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <li>🔥 Peč</li>
                    <li>🚻 Sanitarije</li>
                    <li>🧻 WC papir</li>
                    <li>💧 Voda</li>
                    <li>🗑️ Vreče za smeti</li>
                    <li>🅿️ Parkirišče</li>
                  </ul>
                </div>
              )}

              <Calendar
                bookedPiknikDates={bookedPiknikDates}
                showAvailability={baseIncludesPiknik}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
              <div className="flex justify-end">
                <button className="btn btn-primary" disabled={!selectedDate} onClick={goNext}>
                  Naprej →
                </button>
              </div>
            </div>
  )
}
