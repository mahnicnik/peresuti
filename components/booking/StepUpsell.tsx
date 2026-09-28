'use client'

import { useWizard } from './WizardContext'
import { Field, StepNav, UpsellCard } from './ui'

export default function StepUpsell() {
  const { pricing, extras, setExtras, addZar, setAddZar, addPiknik, setAddPiknik, sleepNights, setSleepNights, includesPiknik, isPiknikOnly, isZarOnly, piknikFreeOnDate, goNext, goBack } = useWizard()

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
                  description="Pokrit piknik prostor za do 250 oseb z igrali, igrišči, elektriko in vodo — če ga dodate, se cena zniža za 100 €."
                  checked={addPiknik}
                  onChange={setAddPiknik}
                />
              )}

              {(includesPiknik) && (
                <UpsellCard
                  title="Prenočišče na prostoru"
                  description="2 sobi (2 postelji 160×200 cm; postelja 160×200 cm + raztegljiv kavč) in WC s tušem, 3 kompleti posteljnine — 90 € na noč."
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

              {includesPiknik &&
                pricing?.upsellOffers
                  .filter((o) => o.unit === 'flat')
                  .map((o) => (
                    <UpsellCard
                      key={o.key}
                      title={`${o.title} — ${o.unit_price} €`}
                      description={o.description ?? ''}
                      checked={extras.includes(o.key)}
                      onChange={(v) =>
                        setExtras((prev) => (v ? [...prev, o.key] : prev.filter((k) => k !== o.key)))
                      }
                    />
                  ))}

              {!includesPiknik && !isZarOnly && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Ni dodatnih ponudb za ta korak — lahko nadaljujete.
                </p>
              )}

              <StepNav onBack={goBack} onNext={goNext} />
            </div>
  )
}
