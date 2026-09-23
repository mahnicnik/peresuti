'use client'

import { type Step, STEP_LABELS } from './constants'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium" style={{ color: 'var(--color-brown-dark)' }}>{label}</span>
      {children}
    </label>
  )
}

export function StepNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void
  onNext: () => void
  nextDisabled?: boolean
}) {
  return (
    <div className="flex justify-between">
      <button className="btn btn-secondary" onClick={onBack}>← Nazaj</button>
      <button className="btn btn-primary" onClick={onNext} disabled={nextDisabled}>Naprej →</button>
    </div>
  )
}

export function UpsellCard({
  title,
  description,
  checked,
  onChange,
  extra,
  highlight,
  badge,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  extra?: React.ReactNode
  highlight?: boolean
  badge?: string
}) {
  return (
    <div
      className="p-5 flex flex-col gap-2.5 relative"
      style={{
        borderRadius: 'var(--radius)',
        border: highlight ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
        background: highlight
          ? 'linear-gradient(135deg, var(--color-bg-alt), var(--color-surface))'
          : 'var(--color-surface)',
        boxShadow: checked ? 'var(--shadow-lifted)' : 'var(--shadow-card)',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      {badge && (
        <span className="tag self-start" style={{ background: 'var(--color-accent)', color: '#fff8ef' }}>
          {badge}
        </span>
      )}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>
          <span
            className="block font-semibold"
            style={{ color: 'var(--color-brown-dark)', fontFamily: highlight ? 'var(--font-heading)' : undefined, fontSize: highlight ? '1.05rem' : '0.95rem' }}
          >
            {title}
          </span>
          <span className="block text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{description}</span>
        </span>
      </label>
      {extra}
    </div>
  )
}

export function StepProgress({ step, steps }: { step: Step; steps: Step[] }) {
  const idx = steps.indexOf(step)
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center font-semibold"
            style={{
              background: i <= idx ? 'var(--color-primary)' : 'var(--color-bg-alt)',
              color: i <= idx ? '#fff8ef' : 'var(--color-text-muted)',
            }}
          >
            {i + 1}
          </span>
          <span style={{ color: i <= idx ? 'var(--color-brown-dark)' : 'var(--color-text-muted)' }}>
            {STEP_LABELS[s]}
          </span>
          {i < steps.length - 1 && <span style={{ color: 'var(--color-border)' }}>—</span>}
        </span>
      ))}
    </div>
  )
}
