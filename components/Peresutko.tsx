'use client'

import { useState } from 'react'
import { PERESUTKO_TREE, matchFreeText, PERESUTKO_FALLBACK_TEXT } from '@/lib/peresutko/rules'

type HistoryItem = { role: 'bot' | 'user'; text: string }

export default function Peresutko() {
  const [open, setOpen] = useState(false)
  const [nodeId, setNodeId] = useState('root')
  const [inputValue, setInputValue] = useState('')
  // Vprašanje, na katerega Perešutko ne zna odgovoriti -> ponudimo pošiljanje po e-pošti
  const [contactDraft, setContactDraft] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    PERESUTKO_TREE.root.bot.map((t) => ({ role: 'bot' as const, text: t }))
  )

  const node = PERESUTKO_TREE[nodeId]

  function choose(label: string, next: string) {
    const nextNode = PERESUTKO_TREE[next]
    if (!nextNode) return
    setHistory((h) => [
      ...h,
      { role: 'user', text: label },
      ...nextNode.bot.map((t) => ({ role: 'bot' as const, text: t })),
    ])
    setNodeId(next)
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')

    const match = matchFreeText(text)
    if (!match) {
      setHistory((h) => [
        ...h,
        { role: 'user', text },
        { role: 'bot', text: PERESUTKO_FALLBACK_TEXT },
        { role: 'bot', text: 'Lahko pa nam vprašanje pošljete po e-pošti — odgovorimo vam v najkrajšem možnem času. 👇' },
      ])
      setContactDraft(text)
      return
    }

    const nextNode = PERESUTKO_TREE[match.nodeId]
    const botLines = match.botOverride ?? nextNode?.bot ?? [PERESUTKO_FALLBACK_TEXT]
    setHistory((h) => [
      ...h,
      { role: 'user', text },
      ...botLines.map((t) => ({ role: 'bot' as const, text: t })),
    ])
    if (nextNode) setNodeId(match.nodeId)
  }

  function restart() {
    setNodeId('root')
    setInputValue('')
    setHistory(PERESUTKO_TREE.root.bot.map((t) => ({ role: 'bot' as const, text: t })))
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="card w-[min(360px,calc(100vw-2.5rem))] max-h-[70vh] flex flex-col overflow-hidden"
          style={{ boxShadow: 'var(--shadow-lifted)' }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--color-brown-dark)', color: '#fff8ef' }}
          >
            <span className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
              Perešutko 🐷
            </span>
            <div className="flex items-center gap-3">
              <button onClick={restart} className="text-xs opacity-80 hover:opacity-100">
                Od začetka
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Zapri"
                className="opacity-80 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5" style={{ background: 'var(--color-bg)' }}>
            {history.map((item, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                  item.role === 'bot' ? 'self-start' : 'self-end'
                }`}
                style={
                  item.role === 'bot'
                    ? { background: 'var(--color-surface)', border: '1px solid var(--color-border)' }
                    : { background: 'var(--color-primary)', color: '#fff8ef' }
                }
              >
                {item.text}
              </div>
            ))}
          </div>

          {node?.options && contactDraft === null && (
            <div
              className="px-3 pt-3 flex flex-col gap-2 border-t"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              {node.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => choose(opt.label, opt.next)}
                  className="btn btn-secondary text-left !justify-start !rounded-lg text-sm py-2"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {contactDraft !== null ? (
            <ContactForm
              initialMessage={contactDraft}
              onClose={() => setContactDraft(null)}
              onSent={() => {
                setContactDraft(null)
                setHistory((h) => [...h, { role: 'bot', text: 'Hvala! Vaše vprašanje smo prejeli in vam odgovorimo po e-pošti. 🐷' }])
              }}
            />
          ) : (
          <>
          <button
            type="button"
            onClick={() => setContactDraft('')}
            className="px-3 pt-2 text-xs text-left underline"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}
          >
            ✉️ Pošljite nam vprašanje po e-pošti
          </button>
          <form
            onSubmit={handleSend}
            className="px-3 py-3 flex items-center gap-2 border-t"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Vprašajte karkoli …"
              className="flex-1 text-sm"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '0.6rem',
                padding: '0.5rem 0.75rem',
                background: '#fff',
                color: 'var(--color-text)',
              }}
            />
            <button
              type="submit"
              className="btn btn-primary !rounded-lg !px-3.5 !py-2 text-sm"
              disabled={!inputValue.trim()}
            >
              Pošlji
            </button>
          </form>
          </>
          )}
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative max-w-[230px] text-left text-sm px-4 py-3 rounded-2xl cursor-pointer hover:-translate-y-0.5 transition-transform"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lifted)',
            color: 'var(--color-text)',
          }}
        >
          Sem Perešutko 🐷 Tu sem, da ti pomagam načrtovati tvoj piknik ali žar — vprašaj me karkoli!
          <span
            className="absolute -bottom-1.5 right-7 w-3 h-3 rotate-45"
            style={{
              background: 'var(--color-surface)',
              borderRight: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
            }}
          />
        </button>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-primary !rounded-full !px-5 !py-3.5 text-sm shadow-lg"
        style={{ boxShadow: 'var(--shadow-lifted)' }}
      >
        {open ? 'Zapri klepet' : '🐷 Vprašaj Perešutka'}
      </button>
    </div>
  )
}

function ContactForm({
  initialMessage,
  onClose,
  onSent,
}: {
  initialMessage: string
  onClose: () => void
  onSent: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(initialMessage)
  const [website, setWebsite] = useState('') // past za spam (skrito polje)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, website }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error ?? 'Pošiljanje ni uspelo.')
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pošiljanje ni uspelo.')
      setBusy(false)
    }
  }

  const input = {
    border: '1px solid var(--color-border)',
    borderRadius: '0.6rem',
    padding: '0.45rem 0.7rem',
    background: '#fff',
    color: 'var(--color-text)',
  } as const

  return (
    <form
      onSubmit={submit}
      className="px-3 py-3 flex flex-col gap-2 border-t text-sm"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold" style={{ color: 'var(--color-brown-dark)' }}>Vprašanje po e-pošti</span>
        <button type="button" onClick={onClose} className="text-xs underline" style={{ color: 'var(--color-text-muted)' }}>
          Nazaj
        </button>
      </div>
      <input style={input} placeholder="Ime in priimek *" value={name} onChange={(e) => setName(e.target.value)} required />
      <div className="flex gap-2">
        <input style={input} className="flex-1 min-w-0" type="email" placeholder="E-pošta *" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={input} className="w-28" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <textarea style={input} rows={3} placeholder="Vaše vprašanje *" value={message} onChange={(e) => setMessage(e.target.value)} required />
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      {error && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</span>}
      <button
        type="submit"
        className="btn btn-primary !rounded-lg !py-2 text-sm"
        disabled={busy || !name.trim() || !email.trim() || message.trim().length < 3}
      >
        {busy ? 'Pošiljam …' : 'Pošlji vprašanje'}
      </button>
    </form>
  )
}
