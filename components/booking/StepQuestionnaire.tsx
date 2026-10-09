'use client'

import { useWizard } from './WizardContext'
import { Field, StepNav } from './ui'
import { CLASSIC_OFFER, CLASSIC_OFFER_DETAILS } from './constants'
import { kmChargeForPostalCode, KM_FREE_RADIUS, PIKNIK_SURCHARGE_GUESTS, WINTER_MENU_SURCHARGE } from '@/lib/pricing'
import { computeQuantities, QUANTITIES_NOTE, WINTER_MENU_ITEMS } from '@/lib/menu'

// Ure na 30 minut natančno (10:00 – 23:30)
const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const m = 600 + i * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`
})

export default function StepQuestionnaire() {
  const { pricing, guestCount, setGuestCount, foodReadyTime, setFoodReadyTime, meatNotes, setMeatNotes, vegetarianMeals, setVegetarianMeals, veganMeals, setVeganMeals, location, setLocation, menuType, setMenuType, winterMenuAvailable, includesPiknik, includesZar, heatingAvailable, heatedSpace, setHeatedSpace, goNext, goBack } = useWizard()
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
                  value={vegetarianMeals || ''}
                  placeholder="0"
                  onChange={(e) => setVegetarianMeals(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
              <Field label="Od tega veganski obroki">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={veganMeals || ''}
                  placeholder="0"
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
              <select
                className="input !w-40"
                value={foodReadyTime}
                onChange={(e) => setFoodReadyTime(e.target.value)}
              >
                <option value="">Izberite uro</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
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
              <div className="flex flex-col gap-1.5 text-sm" role="group" aria-label="Meni">
                <span className="font-medium" style={{ color: 'var(--color-brown-dark)' }}>Meni</span>
                <div className="flex gap-2">
                  {(['poletni', 'zimski'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMenuType(m)}
                      aria-pressed={menuType === m}
                      className="text-sm rounded-full px-4 py-1.5 transition-colors"
                      style={{
                        border: `1.5px solid ${menuType === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: menuType === m ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: menuType === m ? '#fff8ef' : 'var(--color-text)',
                      }}
                    >
                      {m === 'poletni' ? 'Klasična žar ponudba' : `Zimski meni (+${WINTER_MENU_SURCHARGE} €/osebo)`}
                    </button>
                  ))}
                </div>
                <span className="text-xs" style={muted}>
                  Od 1. 10. do 30. 4. lahko izberete klasično žar ponudbo ali zimski meni (doplačilo {WINTER_MENU_SURCHARGE} € na osebo).
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-3 border-t text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <span className="font-medium" style={{ color: 'var(--color-brown-dark)' }}>
                {winterMenuAvailable && menuType === 'zimski' ? 'Zimski meni' : 'Naša klasična ponudba'}
              </span>
              {winterMenuAvailable && menuType === 'zimski' ? (
                <ul className="list-disc pl-5 flex flex-col gap-0.5" style={muted}>
                  {WINTER_MENU_ITEMS.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              ) : (
                <>
                  <p style={muted}>{CLASSIC_OFFER}</p>
                  {guests > 0 && <QuantitiesTable guests={guests} />}
                </>
              )}
              <div className="text-xs" style={muted}>
                <span className="font-medium" style={{ color: 'var(--color-accent-dark)' }}>
                  Kaj je še vključeno in kako poteka peka
                </span>
                <ul className="flex flex-col gap-1.5 mt-2 list-disc pl-4">
                  {CLASSIC_OFFER_DETAILS.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {heatingAvailable && (
          <label className="flex items-start gap-3 cursor-pointer text-sm pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <input
              type="checkbox"
              className="mt-1 w-4 h-4"
              checked={heatedSpace}
              onChange={(e) => setHeatedSpace(e.target.checked)}
            />
            <span>
              <span className="block font-medium" style={{ color: 'var(--color-brown-dark)' }}>
                Želim zaprt in ogrevan piknik prostor
              </span>
              <span className="block text-xs mt-0.5" style={muted}>
                Jeseni, pozimi in spomladi lahko prostor po želji zapremo in ogrevamo.
              </span>
            </span>
          </label>
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

function QuantitiesTable({ guests }: { guests: number }) {
  const rows = computeQuantities(guests)
  return (
    <div className="rounded-lg p-3 mt-1" style={{ background: 'var(--color-bg-alt)' }}>
      <span className="font-medium text-sm" style={{ color: 'var(--color-brown-dark)' }}>
        Priporočene količine pri {guests} {guests === 1 ? 'osebi' : 'osebah'}
      </span>
      <table className="w-full text-sm mt-2">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="py-0.5 pr-3 text-right font-semibold whitespace-nowrap tabular-nums" style={{ color: 'var(--color-text)', width: '1%' }}>
                {r.text}
              </td>
              <td className="py-0.5" style={{ color: 'var(--color-text-muted)' }}>{r.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{QUANTITIES_NOTE}</p>
    </div>
  )
}
