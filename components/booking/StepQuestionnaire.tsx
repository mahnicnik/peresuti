'use client'

import { useWizard } from './WizardContext'
import { Field, StepNav } from './ui'
import { CLASSIC_OFFER, CLASSIC_OFFER_DETAILS } from './constants'
import { kmChargeForPostalCode, KM_FREE_RADIUS, PIKNIK_SURCHARGE_GUESTS } from '@/lib/pricing'

export default function StepQuestionnaire() {
  const { pricing, guestCount, setGuestCount, foodReadyTime, setFoodReadyTime, meatNotes, setMeatNotes, vegetarianMeals, setVegetarianMeals, veganMeals, setVeganMeals, location, setLocation, menuType, setMenuType, winterMenuAvailable, includesPiknik, includesZar, goNext, goBack } = useWizard()
  if (!pricing) return null

  const guests = typeof guestCount === 'number' ? guestCount : 0
  const needsPostalCode = includesZar && !includesPiknik
  const km = needsPostalCode ? kmChargeForPostalCode(location) : null
  const postalInvalid = needsPostalCode && !!location && location.length === 4 && !km
  const mealsTooMany = vegetarianMeals + veganMeals > guests

  const nextDisabled =
    !guests ||
    mealsTooMany ||
    (includesZar && !foodReadyTime) ||
    (needsPostalCode && !km)

  const muted = { color: 'var(--color-text-muted)' }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl">Nekaj podrobnosti</h2>
      <div className="card p-5 flex flex-col gap-4">
        <Field label="Predvideno število oseb *">
          <input
            type="number"
            min={1}
            className="input"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value ? Number(e.target.value) : '')}
            placeholder="npr. 30"
          />
          {includesPiknik && guests >= PIKNIK_SURCHARGE_GUESTS && guests <= 250 && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-accent-dark)' }}>
              Pri {PIKNIK_SURCHARGE_GUESTS} ali več osebah se najem piknik prostora podraži za 50 %.
            </p>
          )}
          {includesPiknik && guests > 250 && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-accent-dark)' }}>
              Prostor sprejme do 250 oseb — za več oseb nas kontaktirajte neposredno.
            </p>
          )}
        </Field>

        {includesZar && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Od tega vegetarijanski obroki">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={vegetarianMeals}
                  onChange={(e) => setVegetarianMeals(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
              <Field label="Od tega veganski obroki">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={veganMeals}
                  onChange={(e) => setVeganMeals(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
            </div>
            {mealsTooMany && (
              <p className="text-xs -mt-2" style={{ color: 'var(--color-danger)' }}>
                Vegetarijanskih in veganskih obrokov je lahko največ toliko, kot je oseb.
              </p>
            )}

            <Field label="Ob kateri uri želite imeti hrano pripravljeno? *">
              <input
                type="time"
                className="input !w-40"
                value={foodReadyTime}
                onChange={(e) => setFoodReadyTime(e.target.value)}
              />
            </Field>
            <p className="text-xs -mt-2" style={muted}>
              Po dogovoru lahko uro kasneje tudi spremenite, v primeru, da imamo termin na razpolago.
            </p>

            {needsPostalCode && (
              <Field label="Poštna številka lokacije dogodka *">
                <input
                  inputMode="numeric"
                  maxLength={4}
                  className="input !w-40"
                  value={location ?? ''}
                  onChange={(e) => setLocation(e.target.value.replace(/\D/g, '').slice(0, 4) || null)}
                  placeholder="npr. 4220"
                />
                {km && (
                  <p className="text-xs mt-1" style={muted}>
                    {km.place} — približno {km.km} km od Gorenje vasi
                    {km.amount > 0 ? ` · kilometrina ${km.amount.toFixed(2)} €` : ` · do ${KM_FREE_RADIUS} km brez doplačila`}
                  </p>
                )}
                {postalInvalid && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    Poštne številke ne poznamo — preverite vnos.
                  </p>
                )}
              </Field>
            )}

            {winterMenuAvailable && (
              <Field label="Meni">
                <div className="flex gap-2">
                  {(['poletni', 'zimski'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMenuType(m)}
                      className="text-sm rounded-full px-4 py-1.5 transition-colors"
                      style={{
                        border: `1.5px solid ${menuType === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: menuType === m ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: menuType === m ? '#fff8ef' : 'var(--color-text)',
                      }}
                    >
                      {m === 'poletni' ? 'Poletni meni' : 'Zimski meni'}
                    </button>
                  ))}
                </div>
                <span className="text-xs" style={muted}>Zimski meni je na voljo od 1. 10. do 30. 4.</span>
              </Field>
            )}

            <div className="flex flex-col gap-2 pt-3 border-t text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <span className="font-medium" style={{ color: 'var(--color-brown-dark)' }}>
                {winterMenuAvailable && menuType === 'zimski' ? 'Zimski meni' : 'Naša klasična ponudba'}
              </span>
              {winterMenuAvailable && menuType === 'zimski' ? (
                <p style={muted}>Podrobno vsebino zimskega menija vam pošljemo ob potrditvi rezervacije.</p>
              ) : (
                <p style={muted}>{CLASSIC_OFFER}</p>
              )}
              <details className="text-xs" style={muted}>
                <summary className="cursor-pointer font-medium" style={{ color: 'var(--color-accent-dark)' }}>
                  Kaj je še vključeno in kako poteka peka
                </summary>
                <ul className="flex flex-col gap-1.5 mt-2 list-disc pl-4">
                  {CLASSIC_OFFER_DETAILS.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </details>
            </div>
          </>
        )}

        <Field label="Opombe">
          <textarea
            className="input"
            rows={3}
            value={meatNotes}
            onChange={(e) => setMeatNotes(e.target.value)}
            placeholder="Karkoli bi še radi sporočili …"
          />
        </Field>
      </div>

      <StepNav onBack={goBack} onNext={goNext} nextDisabled={nextDisabled} />
    </div>
  )
}
