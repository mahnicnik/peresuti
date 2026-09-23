'use client'

import { useWizard } from './WizardContext'
import { Field } from './ui'

export default function StepCustomer() {
  const { entityType, setEntityType, customerName, setCustomerName, customerEmail, setCustomerEmail, customerPhone, setCustomerPhone, companyName, setCompanyName, companyVat, setCompanyVat, companyAddress, setCompanyAddress, submitting, submitError, goBack, submitBooking } = useWizard()

  return (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl">Podatki naročnika</h2>
              <div className="card p-5 flex flex-col gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn flex-1"
                    style={
                      entityType === 'fizicna'
                        ? { background: 'var(--color-primary)', color: '#fff8ef' }
                        : { background: 'var(--color-bg-alt)', color: 'var(--color-text)' }
                    }
                    onClick={() => setEntityType('fizicna')}
                  >
                    Fizična oseba
                  </button>
                  <button
                    type="button"
                    className="btn flex-1"
                    style={
                      entityType === 'pravna'
                        ? { background: 'var(--color-primary)', color: '#fff8ef' }
                        : { background: 'var(--color-bg-alt)', color: 'var(--color-text)' }
                    }
                    onClick={() => setEntityType('pravna')}
                  >
                    Pravna oseba
                  </button>
                </div>

                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {entityType === 'fizicna'
                    ? 'Po oddaji vas bomo preusmerili na varno spletno plačilo.'
                    : 'Po oddaji vam pošljemo naročilnico po e-pošti; kopijo prejmemo tudi mi.'}
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Ime in priimek / kontaktna oseba">
                    <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </Field>
                  <Field label="Telefon">
                    <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </Field>
                </div>
                <Field label="Email">
                  <input
                    type="email"
                    className="input"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </Field>

                {entityType === 'pravna' && (
                  <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <Field label="Naziv podjetja">
                      <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </Field>
                    <Field label="ID za DDV / davčna št.">
                      <input className="input" value={companyVat} onChange={(e) => setCompanyVat(e.target.value)} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Naslov podjetja">
                        <input className="input" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              {submitError && (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{submitError}</p>
              )}

              <div className="flex justify-between">
                <button className="btn btn-secondary" onClick={goBack} disabled={submitting}>
                  ← Nazaj
                </button>
                <button
                  className="btn btn-primary"
                  disabled={submitting || !customerName || !customerEmail || (entityType === 'pravna' && (!companyName || !companyVat))}
                  onClick={submitBooking}
                >
                  {submitting ? 'Oddajam …' : entityType === 'pravna' ? 'Pošlji naročilnico' : 'Nadaljuj na plačilo →'}
                </button>
              </div>
            </div>
  )
}
