'use client'

import { useState } from 'react'
import { PERESUTKO_TREE, matchFreeText, PERESUTKO_FALLBACK_TEXT } from '@/lib/peresutko/rules'

type HistoryItem = { role: 'bot' | 'user'; text: string }

export default function Peresutko() {
  const [open, setOpen] = useState(false)
  const [nodeId, setNodeId] = useState('root')
  const [inputValue, setInputValue] = useState('')
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
      ])
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

          {node?.options && (
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
