'use client'

import { useWizard } from './WizardContext'
import { StepNav } from './ui'
import { GENERAL_TERMS } from './constants'

export default function StepRules() {
  const { pricing, acceptedRules, setAcceptedRules, acceptedTerms, setAcceptedTerms, includesPiknik, allRulesAccepted, goNext, goBack } = useWizard()
  if (!pricing) return null

  return (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl">Pogoji najema</h2>
              <div className="card p-5 flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  {GENERAL_TERMS.map((term) => (
                    <div key={term} className="flex items-start gap-2.5 text-sm">
                      <span style={{ color: 'var(--color-accent-dark)' }}>•</span>
                      <span>{term}</span>
                    </div>
                  ))}
                </div>
                <label
                  className="flex items-start gap-3 text-sm cursor-pointer pt-3 mt-1 border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span>Strinjam se s pogoji najema.</span>
                </label>

                {includesPiknik && (
                  <>
                    <span
                      className="text-sm font-semibold pt-2 mt-1 border-t"
                      style={{ color: 'var(--color-brown-dark)', borderColor: 'var(--color-border)' }}
                    >
                      Pogoji najema piknik prostora Skaručna
                    </span>
                    {pricing.spaceRules.map((rule) => (
                      <label key={rule.id} className="flex items-start gap-3 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={!!acceptedRules[rule.id]}
                          onChange={(e) =>
                            setAcceptedRules((prev) => ({ ...prev, [rule.id]: e.target.checked }))
                          }
                        />
                        <span>{rule.text}</span>
                      </label>
                    ))}
                  </>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Želimo, da se pri nas počutite udobno in da se zabavate brez skrbi. Prav tako pa želimo enako tudi gostom, ki bodo prevzeli piknik prostor za vami.
              </p>
              <StepNav
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!acceptedTerms || (includesPiknik && !allRulesAccepted)}
              />
            </div>
  )
}
