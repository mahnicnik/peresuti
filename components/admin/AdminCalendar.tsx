'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  bookingDetailRows,
  bookingQuantities,
  bookingMeat,
  formatDateSl,
  serviceLabel,
  type Booking,
} from '@/lib/booking-details'
import { menuLabel, QUANTITIES_NOTE } from '@/lib/menu'
import { amountDue } from '@/lib/payments-shared'

const DAY_NAMES = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned']
const MONTH_NAMES = [
  'Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December',
]

type Action = 'confirm_zar' | 'reject_zar' | 'mark_paid' | 'mark_unpaid' | 'cancel' | 'restore' | 'note' | 'send_payment_link'

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
function todayStr() {
  const t = new Date()
  return ymd(t.getFullYear(), t.getMonth(), t.getDate())
}
function addDays(s: string, n: number) {
  const d = new Date(`${s}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Barve po vrsti storitve
function chipStyle(b: Booking): React.CSSProperties {
  const base: React.CSSProperties =
    b.includes_piknik && b.includes_zar
      ? { background: '#f6ebd3', borderColor: 'var(--color-accent)' }
      : b.includes_piknik
        ? { background: '#e5eedf', borderColor: 'var(--color-success)' }
        : { background: '#f6e2dc', borderColor: 'var(--color-primary-light)' }
  if (b.status === 'cancelled') return { background: '#eee', borderColor: '#ccc', color: '#999', textDecoration: 'line-through' }
  if (b.zar_confirmation === 'pending') return { ...base, borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--color-accent-dark)' }
  return base
}

function chipText(b: Booking) {
  const t = b.includes_zar && b.event_start_time ? `${b.event_start_time.slice(0, 5)} ` : ''
  const name = b.company_name || b.customer_name
  return `${t}${name}${b.guest_count ? ` (${b.guest_count})` : ''}`
}

export default function AdminCalendar({ initialMonth, initialBookingId }: { initialMonth?: string; initialBookingId?: string }) {
  // Povezava iz e-pošte: /admin?mesec=2026-11&rezervacija=<id>
  const [cursor, setCursor] = useState(() => {
    if (initialMonth && /^\d{4}-\d{2}$/.test(initialMonth)) {
      return { y: Number(initialMonth.slice(0, 4)), m: Number(initialMonth.slice(5, 7)) - 1 }
    }
    const t = new Date()
    return { y: t.getFullYear(), m: t.getMonth() }
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pending, setPending] = useState<Booking[]>([])
  const [pickedDay, setSelectedDay] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(initialBookingId ?? null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showCancelled, setShowCancelled] = useState(false)

  const monthFrom = ymd(cursor.y, cursor.m, 1)
  const monthTo = ymd(cursor.y, cursor.m, new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate())

  const loadKey = `${monthFrom}|${reloadTick}`
  const loading = loadedKey !== loadKey

  useEffect(() => {
    let cancelled = false
    ;(async () => {
    try {
      const today = todayStr()
      const [monthRes, pendingRes] = await Promise.all([
        fetch(`/api/admin/bookings?from=${monthFrom}&to=${monthTo}`),
        fetch(`/api/admin/bookings?from=${addDays(today, -1)}&to=${addDays(today, 400)}`),
      ])
      if (monthRes.status === 401) {
        window.location.reload()
        return
      }
      const m = await monthRes.json()
      const p = await pendingRes.json()
      if (cancelled) return
      if (!monthRes.ok) throw new Error(m.error ?? 'Napaka')
      setError(null)
      setBookings(m.bookings)
      setPending((p.bookings ?? []).filter((b: Booking) => b.zar_confirmation === 'pending' && b.status !== 'cancelled'))
    } catch (e) {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Napaka pri nalaganju')
    } finally {
      if (!cancelled) setLoadedKey(loadKey)
    }
    })()
    return () => {
      cancelled = true
    }
  }, [monthFrom, monthTo, loadKey])

  const load = useCallback(() => setReloadTick((t) => t + 1), [])

  // izbran dan: ročno izbran, sicer dan rezervacije iz povezave
  const selectedDay = pickedDay ?? bookings.find((x) => x.id === highlightId)?.booking_date ?? null

  const visible = useMemo(
    () => bookings.filter((b) => showCancelled || b.status !== 'cancelled'),
    [bookings, showCancelled]
  )
  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of visible) {
      const arr = map.get(b.booking_date) ?? []
      arr.push(b)
      map.set(b.booking_date, arr)
    }
    return map
  }, [visible])

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.y, cursor.m, 1))
    const firstWeekday = (first.getUTCDay() + 6) % 7
    const days = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate()
    const out: (string | null)[] = Array(firstWeekday).fill(null)
    for (let d = 1; d <= days; d++) out.push(ymd(cursor.y, cursor.m, d))
    return out
  }, [cursor])

  async function act(id: string, action: Action, note?: string) {
    let notify = false
    if (action === 'cancel') {
      if (!confirm('Res prekličem to rezervacijo? (Termin se sprosti.)')) return
      notify = confirm('Obvestim stranko o preklicu po e-pošti?\n\nOK = pošlji e-pošto, Prekliči = brez e-pošte')
    }
    if (action === 'reject_zar' && !confirm('Zavrnem žar mojstra za to rezervacijo? Stranka dobi e-pošto, da termin ni na voljo.')) return
    if (action === 'send_payment_link' && !confirm('Stranki pošljem e-pošto s povezavo za spletno plačilo?')) return
    const res = await fetch('/api/admin/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, note, notify }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(d.error ?? 'Napaka')
      return
    }
    if (d.message) alert(d.message)
    load()
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    window.location.reload()
  }

  function goMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(Date.UTC(c.y, c.m + delta, 1))
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() }
    })
    setSelectedDay(null)
  }

  const today = todayStr()
  const dayBookings = selectedDay ? (byDay.get(selectedDay) ?? []) : []
  const monthActive = visible.filter((b) => b.status !== 'cancelled')

  return (
    <div className="container-app pt-6 pb-10" style={{ maxWidth: 1100 }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl">Koledar rezervacij</h1>
        <button className="text-sm underline opacity-70 hover:opacity-100" onClick={logout}>Odjava</button>
      </div>

      {pending.length > 0 && (
        <div className="card p-4 mb-5" style={{ background: '#fbecd0', borderColor: 'var(--color-accent)' }}>
          <h2 className="text-lg mb-2">Čaka na vašo potrditev ({pending.length})</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {pending.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <button
                  className="underline text-left"
                  onClick={() => {
                    setCursor({ y: Number(b.booking_date.slice(0, 4)), m: Number(b.booking_date.slice(5, 7)) - 1 })
                    setSelectedDay(b.booking_date)
                    setHighlightId(b.id)
                  }}
                >
                  {formatDateSl(b.booking_date)} — {chipText(b)}
                </button>
                <span className="flex gap-2">
                  <SmallBtn kind="ok" onClick={() => act(b.id, 'confirm_zar')}>Potrdi</SmallBtn>
                  <SmallBtn kind="no" onClick={() => act(b.id, 'reject_zar')}>Zavrni</SmallBtn>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-5">
        <div className="card p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <button className="btn btn-secondary !px-3 !py-1.5" onClick={() => goMonth(-1)} aria-label="Prejšnji mesec">←</button>
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl">{MONTH_NAMES[cursor.m]} {cursor.y}</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {loading ? 'Nalagam …' : `${monthActive.length} rezervacij`}
              </p>
            </div>
            <button className="btn btn-secondary !px-3 !py-1.5" onClick={() => goMonth(1)} aria-label="Naslednji mesec">→</button>
          </div>
          {error && <p className="text-sm mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />
              const list = byDay.get(day) ?? []
              const isSel = selectedDay === day
              const isToday = day === today
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="min-h-[64px] sm:min-h-[96px] rounded-lg p-1 flex flex-col items-stretch gap-0.5 text-left overflow-hidden"
                  style={{
                    border: `1.5px solid ${isSel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isSel ? '#fff5ef' : 'var(--color-surface)',
                  }}
                >
                  <span
                    className="text-xs font-semibold self-start px-1 rounded"
                    style={isToday ? { background: 'var(--color-primary)', color: '#fff8ef' } : { color: 'var(--color-text-muted)' }}
                  >
                    {Number(day.slice(8))}
                  </span>
                  {/* telefon: pike, večji zasloni: imena */}
                  <span className="flex flex-wrap gap-0.5 sm:hidden">
                    {list.map((b) => (
                      <span key={b.id} className="w-2.5 h-2.5 rounded-full" style={{ ...chipStyle(b), borderWidth: 1.5, borderStyle: chipStyle(b).borderStyle ?? 'solid' }} />
                    ))}
                  </span>
                  <span className="hidden sm:flex flex-col gap-0.5">
                    {list.slice(0, 4).map((b) => (
                      <span
                        key={b.id}
                        className="text-[10.5px] leading-tight px-1 py-0.5 rounded truncate"
                        style={{ border: '1px solid', ...chipStyle(b) }}
                        title={chipText(b)}
                      >
                        {b.payment_status === 'unpaid' && b.status !== 'cancelled' ? '€ ' : ''}
                        {chipText(b)}
                      </span>
                    ))}
                    {list.length > 4 && <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>+{list.length - 4}</span>}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Legend style={{ background: '#e5eedf', borderColor: 'var(--color-success)' }}>Piknik prostor</Legend>
            <Legend style={{ background: '#f6e2dc', borderColor: 'var(--color-primary-light)' }}>Žar mojster</Legend>
            <Legend style={{ background: '#f6ebd3', borderColor: 'var(--color-accent)' }}>Oboje</Legend>
            <Legend style={{ background: '#fff', borderColor: 'var(--color-accent-dark)', borderStyle: 'dashed', borderWidth: 2 }}>Čaka potrditev</Legend>
            <span>€ = ni plačano</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
              prikaži preklicane
            </label>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          {!selectedDay ? (
            <div className="card p-5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Kliknite na dan v koledarju za vse podatke rezervacij.
            </div>
          ) : (
            <>
              <h2 className="text-lg">{formatDateSl(selectedDay)}</h2>
              {dayBookings.length === 0 && (
                <div className="card p-5 text-sm" style={{ color: 'var(--color-text-muted)' }}>Ta dan ni rezervacij.</div>
              )}
              {dayBookings.map((b) => (
                <BookingCard key={b.id} b={b} highlighted={b.id === highlightId} onAction={act} />
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

function Legend({ style, children }: { style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded" style={{ border: '1px solid', ...style }} />
      {children}
    </span>
  )
}

function SmallBtn({ kind, onClick, children }: { kind: 'ok' | 'no' | 'plain'; onClick: () => void; children: React.ReactNode }) {
  const style: React.CSSProperties =
    kind === 'ok'
      ? { background: 'var(--color-success)', color: '#fff' }
      : kind === 'no'
        ? { background: 'transparent', color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)' }
        : { background: 'transparent', color: 'var(--color-brown-dark)', border: '1.5px solid var(--color-border)' }
  return (
    <button onClick={onClick} className="text-xs font-semibold rounded-full px-3 py-1" style={style}>
      {children}
    </button>
  )
}

function BookingCard({ b, highlighted, onAction }: { b: Booking; highlighted: boolean; onAction: (id: string, a: Action, note?: string) => void }) {
  const [note, setNote] = useState(b.admin_note ?? '')
  const rows = bookingDetailRows(b)
  const q = bookingQuantities(b)
  const m = bookingMeat(b)

  return (
    <div
      className="card p-4 text-sm flex flex-col gap-3"
      style={{
        ...(highlighted ? { borderColor: 'var(--color-primary)', borderWidth: 2 } : {}),
        ...(b.status === 'cancelled' ? { opacity: 0.6 } : {}),
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold" style={{ color: 'var(--color-brown-dark)', fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>
            {b.company_name || b.customer_name}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{serviceLabel(b)}</div>
        </div>
        <span
          className="tag whitespace-nowrap"
          style={
            b.payment_status === 'paid'
              ? { background: '#e5eedf', color: 'var(--color-success)' }
              : b.payment_status === 'partial'
                ? { background: '#fbecd0', color: 'var(--color-accent-dark)' }
              : b.payment_status === 'invoiced'
                ? { background: '#e8e3f3', color: '#5a4a8a' }
                : { background: '#f6e2dc', color: 'var(--color-danger)' }
          }
        >
          {b.payment_status === 'paid'
            ? 'Plačano'
            : b.payment_status === 'partial'
              ? 'Delno plačano'
              : b.payment_status === 'invoiced'
                ? 'Naročilnica'
                : 'Ni plačano'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {b.customer_phone && (
          <a className="btn btn-secondary !py-1 !px-3 !text-xs" href={`tel:${b.customer_phone.replace(/\s/g, '')}`}>📞 {b.customer_phone}</a>
        )}
        <a className="btn btn-secondary !py-1 !px-3 !text-xs" href={`mailto:${b.customer_email}`}>✉️ E-pošta</a>
      </div>

      {b.zar_confirmation === 'pending' && b.status !== 'cancelled' && (
        <div className="p-3 rounded-lg flex flex-col gap-2" style={{ background: '#fbecd0' }}>
          <span>Žar mojster na pogojno prost dan — potrdite ali zavrnite (stranka dobi e-pošto).</span>
          <span className="flex gap-2">
            <SmallBtn kind="ok" onClick={() => onAction(b.id, 'confirm_zar')}>Potrdi termin</SmallBtn>
            <SmallBtn kind="no" onClick={() => onAction(b.id, 'reject_zar')}>Zavrni</SmallBtn>
          </span>
        </div>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt style={{ color: 'var(--color-text-muted)' }}>{r.label}</dt>
            <dd className="break-words" style={{ whiteSpace: 'pre-wrap' }}>{r.value}</dd>
          </div>
        ))}
      </dl>

      {q && (
        <div className="rounded-lg p-3" style={{ background: 'var(--color-bg-alt)' }}>
          <div className="font-medium mb-1" style={{ color: 'var(--color-brown-dark)' }}>
            {menuLabel(m.menuType)} — {b.guest_count} oseb
          </div>
          {q.kind === 'klasicni' ? (
            <>
              <table className="w-full">
                <tbody>
                  {q.quantities.map((x) => (
                    <tr key={x.label}>
                      <td className="pr-3 text-right font-semibold whitespace-nowrap tabular-nums" style={{ width: '1%' }}>{x.text}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{x.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{QUANTITIES_NOTE}</p>
            </>
          ) : (
            <ul className="list-disc pl-5">
              {q.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Interna opomba (vidite samo vi)</span>
        <textarea
          rows={2}
          className="rounded-lg px-2 py-1.5"
          style={{ border: '1px solid var(--color-border)', background: '#fff' }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {note !== (b.admin_note ?? '') && (
          <span><SmallBtn kind="plain" onClick={() => onAction(b.id, 'note', note)}>Shrani opombo</SmallBtn></span>
        )}
      </label>

      <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {b.status !== 'cancelled' && b.entity_type === 'fizicna' && amountDue(b) > 0 && (
          <SmallBtn kind="plain" onClick={() => onAction(b.id, 'send_payment_link')}>
            Pošlji povezavo za plačilo ({amountDue(b).toFixed(2)} €)
          </SmallBtn>
        )}
        {b.status !== 'cancelled' && (b.payment_status === 'unpaid' || b.payment_status === 'partial') && (
          <SmallBtn kind="ok" onClick={() => onAction(b.id, 'mark_paid')}>Označi kot plačano v celoti</SmallBtn>
        )}
        {b.status !== 'cancelled' && b.payment_status === 'paid' && (
          <SmallBtn kind="plain" onClick={() => onAction(b.id, 'mark_unpaid')}>Označi kot neplačano</SmallBtn>
        )}
        {b.status !== 'cancelled' ? (
          <SmallBtn kind="no" onClick={() => onAction(b.id, 'cancel')}>Prekliči rezervacijo</SmallBtn>
        ) : (
          <SmallBtn kind="plain" onClick={() => onAction(b.id, 'restore')}>Obnovi</SmallBtn>
        )}
      </div>
    </div>
  )
}
