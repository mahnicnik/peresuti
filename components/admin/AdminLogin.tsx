'use client'

import { useState } from 'react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      window.location.reload()
      return
    }
    const d = await res.json().catch(() => ({}))
    setError(d.error ?? 'Prijava ni uspela.')
    setBusy(false)
  }

  return (
    <div className="container-app py-16 max-w-sm">
      <h1 className="text-2xl mb-4">Koledar rezervacij</h1>
      <form onSubmit={submit} className="card p-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium" style={{ color: 'var(--color-brown-dark)' }}>Geslo</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            className="w-full rounded-lg px-3 py-2"
            style={{ border: '1px solid var(--color-border)', background: '#fff' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        <button className="btn btn-primary" disabled={busy || !password}>
          {busy ? 'Prijavljam …' : 'Prijava'}
        </button>
      </form>
    </div>
  )
}
