'use client'

import { useWizard } from './WizardContext'
import Calendar from '@/components/Calendar'
import Image from 'next/image'
import { PIKNIK_INFO } from './constants'

export default function StepCalendar() {
  const { bookedPiknikDates, selectedDate, setSelectedDate, baseIncludesPiknik, goNext } = useWizard()

  return (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl">Izberite datum</h2>

              <Calendar
                bookedPiknikDates={bookedPiknikDates}
                showAvailability={baseIncludesPiknik}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
              {baseIncludesPiknik && <PiknikInfo />}
              <div className="flex justify-end">
                <button className="btn btn-primary" disabled={!selectedDate} onClick={goNext}>
                  Naprej →
                </button>
              </div>
            </div>
  )
}

function PiknikInfo() {
  return (
    <details className="card p-4 text-sm" style={{ background: 'var(--color-bg-alt)' }}>
      <summary className="cursor-pointer font-semibold" style={{ color: 'var(--color-brown-dark)' }}>
        Piknik prostor Skaručna — kaj je vključeno in kako do nas
      </summary>
      <dl className="flex flex-col gap-2.5 mt-3">
        {PIKNIK_INFO.map((i) => (
          <div key={i.title}>
            <dt className="font-medium" style={{ color: 'var(--color-brown-dark)' }}>{i.title}</dt>
            <dd style={{ color: 'var(--color-text-muted)' }}>{i.text}</dd>
          </div>
        ))}
      </dl>
      <Image
        src="/images/parkirisce.jpg"
        alt="Zemljevid parkirišč pri piknik prostoru Skaručna (rdeče obarvani predeli)"
        width={1333}
        height={706}
        className="mt-3 rounded-lg w-full h-auto"
      />
    </details>
  )
}
