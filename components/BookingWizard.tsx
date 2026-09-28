'use client'

import Link from 'next/link'
import Peresutko from '@/components/Peresutko'
import { useWizardState } from './booking/useWizardState'
import { WizardProvider, useWizard } from './booking/WizardContext'
import { StepProgress } from './booking/ui'
import StepCalendar from './booking/StepCalendar'
import StepQuestionnaire from './booking/StepQuestionnaire'
import StepUpsell from './booking/StepUpsell'
import StepRules from './booking/StepRules'
import StepCustomer from './booking/StepCustomer'

export default function BookingWizard({ tip }: { tip: 'piknik' | 'zar' | 'oboje' }) {
  const value = useWizardState(tip)

  if (value.loadError) {
    return <div className="container-app py-16 text-center" style={{ color: 'var(--color-danger)' }}>{value.loadError}</div>
  }
  if (!value.pricing) {
    return <div className="container-app py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>Nalagam …</div>
  }
  return (
    <WizardProvider value={value}>
      <WizardLayout />
    </WizardProvider>
  )
}

function WizardLayout() {
  const { tip, step, selectedDate, foodReadyTime, includesZar, visibleSteps, breakdown } = useWizard()
  const title =
    tip === 'piknik' ? 'Rezerviraj piknik prostor' : tip === 'zar' ? 'Rezerviraj žar mojstra' : 'Rezerviraj piknik prostor in žar mojstra'

  return (
    <div className="container-app pt-6 pb-8 sm:pt-8 sm:pb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-5 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text-muted)' }}
      >
        ← Nazaj na izbiro ponudbe
      </Link>
      <h1 className="text-2xl sm:text-3xl mb-4">{title}</h1>
      <StepProgress step={step} steps={visibleSteps} />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 mt-6">
        <div>
          {step === 'calendar' && <StepCalendar />}
          {step === 'questionnaire' && <StepQuestionnaire />}
          {step === 'upsell' && <StepUpsell />}
          {step === 'rules' && <StepRules />}
          {step === 'customer' && <StepCustomer />}
        </div>

        <aside className="lg:sticky lg:top-6 h-fit">
          <div className="card p-5">
            <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Povzetek
            </h3>
            {selectedDate && (
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('sl-SI', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
                })}
                {includesZar && foodReadyTime && <>{' · hrana ob '}{foodReadyTime}</>}
              </p>
            )}
            {breakdown ? (
              <div className="flex flex-col gap-1.5 text-sm">
                {breakdown.lines.map((l, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span style={{ color: 'var(--color-text-muted)' }}>{l.label}</span>
                    <span className="whitespace-nowrap">{l.amount.toFixed(2)} €</span>
                  </div>
                ))}
                <div
                  className="flex justify-between pt-2 mt-1 font-semibold"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <span>Skupaj</span>
                  <span>{breakdown.total.toFixed(2)} €</span>
                </div>
                {breakdown.payLater > 0 && (
                  <div className="flex flex-col gap-1 pt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex justify-between gap-2">
                      <span>Plačilo ob rezervaciji</span>
                      <span className="whitespace-nowrap font-semibold" style={{ color: 'var(--color-text)' }}>{breakdown.payNow.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Ostanek za žar mojstra (plačilo kasneje)</span>
                      <span className="whitespace-nowrap">{breakdown.payLater.toFixed(2)} €</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Izberite datum za oceno cene.
              </p>
            )}
          </div>
        </aside>
      </div>

      <Peresutko />

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.9rem;
          background: #fff;
          color: var(--color-text);
        }
        .input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  )
}
