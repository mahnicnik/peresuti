'use client'

import { useWizard } from './WizardContext'
import { Field, StepNav } from './ui'
import { MENU_CATEGORIES } from './constants'

export default function StepQuestionnaire() {
  const { pricing, guestCount, setGuestCount, eventStartTime, setEventStartTime, eventEndTime, setEventEndTime, meatNotes, setMeatNotes, vegetarianMeals, setVegetarianMeals, veganMeals, setVeganMeals, location, setLocation, menuSelections, setMenuSelections, menuSpecialRequests, setMenuSpecialRequests, includesPiknik, includesZar, goNext, goBack } = useWizard()
  if (!pricing) return null

  return (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl">Nekaj podrobnosti</h2>
              <div className="card p-5 flex flex-col gap-4">
                <Field label="Predvideno število gostov *">
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="npr. 30"
                  />
                  {includesPiknik && typeof guestCount === 'number' && guestCount > 100 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-accent-dark)' }}>
                      Prostor sprejme do 100 gostov — za več oseb nas kontaktirajte neposredno.
                    </p>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Želeni čas začetka *">
                    <input
                      type="time"
                      className="input"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                    />
                  </Field>
                  <Field label="Želeni čas zaključka">
                    <input
                      type="time"
                      className="input"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                    />
                  </Field>
                </div>
                <p className="text-xs -mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Okvirni časovni interval dogodka — čas začetka je obvezen, čas zaključka pa poljuben.
                </p>

                {includesZar && (
                  <>
                    <Field label="Lokacija dogodka">
                      <select
                        className="input"
                        value={location ?? ''}
                        onChange={(e) => setLocation(e.target.value || null)}
                      >
                        <option value="">Na piknik prostoru v Skaručni (brez doplačila)</option>
                        {pricing.kmPricing.map((k) => (
                          <option key={k.location} value={k.location}>
                            {k.location} ({k.distance_km} km)
                          </option>
                        ))}
                      </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Vegetarijanski obroki">
                        <input
                          type="number"
                          min={0}
                          className="input"
                          value={vegetarianMeals}
                          onChange={(e) => setVegetarianMeals(Number(e.target.value) || 0)}
                        />
                      </Field>
                      <Field label="Veganski obroki">
                        <input
                          type="number"
                          min={0}
                          className="input"
                          value={veganMeals}
                          onChange={(e) => setVeganMeals(Number(e.target.value) || 0)}
                        />
                      </Field>
                    </div>
                    <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-brown-dark)' }}>
                        Meni žar mojstra
                      </span>
                      <p className="text-xs -mt-2" style={{ color: 'var(--color-text-muted)' }}>
                        Izberite, kaj vas zanima — polno ponudbo s cenami uskladimo naknadno.
                      </p>
                      {MENU_CATEGORIES.map((cat) => (
                        <div key={cat.key} className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-accent-dark)' }}>
                            {cat.label}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {cat.items.map((item) => {
                              const active = !!menuSelections[item]
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() =>
                                    setMenuSelections((prev) => ({ ...prev, [item]: !prev[item] }))
                                  }
                                  className="text-xs rounded-full px-3 py-1.5 transition-colors"
                                  style={{
                                    border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: active ? '#fff8ef' : 'var(--color-text)',
                                  }}
                                >
                                  {active ? '✓ ' : ''}
                                  {item}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      <Field label="Posebne želje glede menija">
                        <textarea
                          className="input"
                          rows={2}
                          value={menuSpecialRequests}
                          onChange={(e) => setMenuSpecialRequests(e.target.value)}
                          placeholder="Alergije, posebni obroki, drugo …"
                        />
                      </Field>
                    </div>
                  </>
                )}

                <Field label="Opombe">
                  <textarea
                    className="input"
                    rows={4}
                    value={meatNotes}
                    onChange={(e) => setMeatNotes(e.target.value)}
                    placeholder="Karkoli bi še radi sporočili …"
                  />
                </Field>
              </div>

              <StepNav onBack={goBack} onNext={goNext} nextDisabled={!guestCount || !eventStartTime} />
            </div>
  )
}
