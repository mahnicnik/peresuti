'use client'

import { useWizard } from './WizardContext'
import Calendar from '@/components/Calendar'
import Image from 'next/image'
import { PIKNIK_INFO } from './constants'

export default function StepCalendar() {
  const { bookedPiknikDates, conditionalZarDates, selectedDate, setSelectedDate, baseIncludesPiknik, baseIncludesZar, zarConditional, goNext } = useWizard()

  return (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl">Izberite datum</h2>

              <Calendar
                bookedPiknikDates={bookedPiknikDates}
                showAvailability={baseIncludesPiknik}
                conditionalDates={baseIncludesZar ? conditionalZarDates : []}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
              {zarConditional && (
                <div
                  className="p-4 text-sm"
                  style={{ borderRadius: 'var(--radius)', background: '#fbecd0', border: '1px solid var(--color-accent)', color: 'var(--color-brown-dark)' }}
                >
                  <strong>Ta dan je za žar mojstra pogojno prost.</strong> Na ta datum imamo že več piknikov —
                  rezervacijo lahko oddate, vendar še ni potrjena: preverimo razpored in vam potrditev
                  pošljemo po e-pošti. Are za žar mojstra v tem primeru ne zaračunamo.
                </div>
              )}
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
    <div className="card p-4 text-sm" style={{ background: 'var(--color-bg-alt)' }}>
      <h3 className="font-semibold" style={{ color: 'var(--color-brown-dark)' }}>
        Piknik prostor Skaručna — kaj je vključeno in kako do nas
      </h3>
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
    </div>
  )
}
