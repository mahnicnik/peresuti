'use client'

import { useWizard } from './WizardContext'
import { Field, StepNav, UpsellCard } from './ui'

export default function StepUpsell() {
  const { addZar, setAddZar, addPiknik, setAddPiknik, sleepNights, setSleepNights, includesPiknik, isPiknikOnly, isZarOnly, piknikFreeOnDate, goNext, goBack } = useWizard()

  return (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl">Še nekaj, preden nadaljujete</h2>

              {isPiknikOnly && (
                <UpsellCard
                  badge="💡 Priporočamo"
                  highlight
                  title="Bi radi, da hrano pripravi naš žar mojster?"
                  description="Na ta datum lahko dodate tudi najem žar mojstra — cena piknik prostora se ob tem zniža za 100 €."
                  checked={addZar}
                  onChange={setAddZar}
                />
              )}

              {isZarOnly && piknikFreeOnDate && (
                <UpsellCard
                  badge="💡 Priporočamo"
                  highlight
                  title="Na ta datum je prost tudi piknik prostor v Skaručni"
                  description="Pokrit prostor za do 100 gostov z igrali, igrišči, elektriko in vodo — če ga dodate, se cena zniža za 100 €."
                  checked={addPiknik}
                  onChange={setAddPiknik}
                />
              )}

              {(includesPiknik) && (
                <UpsellCard
                  title="Prenočišče na prostoru"
                  description="Do 6 oseb (3 postelje 160×200 + raztegljivi kavč), 90 € na noč."
                  checked={sleepNights > 0}
                  onChange={(v) => setSleepNights(v ? 1 : 0)}
                  extra={
                    sleepNights > 0 && (
                      <Field label="Število noči">
                        <input
                          type="number"
                          min={1}
                          className="input !w-24"
                          value={sleepNights}
                          onChange={(e) => setSleepNights(Math.max(1, Number(e.target.value) || 1))}
                        />
                      </Field>
                    )
                  }
                />
              )}

              {!isPiknikOnly && !isZarOnly && sleepNights === 0 && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Ni dodatnih ponudb za ta korak — lahko nadaljujete.
                </p>
              )}

              <StepNav onBack={goBack} onNext={goNext} />
            </div>
  )
}
