// Skupna "razlaga" rezervacije za lastnika — uporabljena v admin koledarju in v e-pošti lastniku.
import type { Database } from '@/lib/database.types'
import { computeQuantities, menuLabel, WINTER_MENU_ITEMS } from '@/lib/menu'
import { vatRateFor } from '@/lib/pricing'

export type Booking = Database['public']['Tables']['bookings']['Row']

type Upsell = {
  sleepNights?: number
  addZar?: boolean
  addPiknik?: boolean
  vegetarianMeals?: number
  veganMeals?: number
  extras?: string[]
  heatedSpace?: boolean
  payNow?: number
  payLater?: number
}
type Meat = { notes?: string; menuType?: string | null }

const EXTRA_LABELS: Record<string, string> = { odvoz_smeti: 'Odvoz smeti', ciscenje: 'Dodatno čiščenje' }

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Čaka (plačilo/potrditev)',
  confirmed: 'Potrjeno',
  cancelled: 'Preklicano',
}
export const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Ni plačano',
  paid: 'Plačano',
  invoiced: 'Naročilnica (račun)',
  not_applicable: '—',
}
export const ZAR_CONF_LABELS: Record<string, string> = {
  pending: 'Čaka na vašo potrditev',
  confirmed: 'Potrjeno',
  rejected: 'Zavrnjeno',
}

export function bookingUpsell(b: Booking): Upsell {
  return (b.upsell_selections as Upsell | null) ?? {}
}
export function bookingMeat(b: Booking): Meat {
  return (b.meat_preferences as Meat | null) ?? {}
}

export function serviceLabel(b: Booking): string {
  if (b.includes_piknik && b.includes_zar) return 'Piknik prostor + žar mojster'
  return b.includes_piknik ? 'Piknik prostor' : 'Žar mojster'
}

export function formatDateSl(d: string): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('sl-SI', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

const eur = (n: number | null | undefined) => `${(n ?? 0).toFixed(2)} €`

/** Vrstice "oznaka: vrednost" z vsemi podatki rezervacije. */
export function bookingDetailRows(b: Booking): { label: string; value: string }[] {
  const u = bookingUpsell(b)
  const m = bookingMeat(b)
  const rows: { label: string; value: string }[] = []
  const add = (label: string, value: string | null | undefined) => {
    if (value) rows.push({ label, value })
  }

  add('Storitev', serviceLabel(b))
  add('Datum', formatDateSl(b.booking_date))
  if (b.includes_zar) add('Hrana pripravljena ob', b.event_start_time?.slice(0, 5))
  add('Število oseb', b.guest_count ? String(b.guest_count) : null)
  if (b.includes_zar) {
    add('Meni', menuLabel(m.menuType))
    if (u.vegetarianMeals) add('Vegetarijanski obroki', String(u.vegetarianMeals))
    if (u.veganMeals) add('Veganski obroki', String(u.veganMeals))
    add('Lokacija', b.location ?? (b.includes_piknik ? 'Piknik prostor Skaručna' : null))
    if (b.km_distance) add('Razdalja', `${b.km_distance} km`)
  }
  if (b.includes_piknik) {
    if (u.sleepNights) add('Prenočišče', `${u.sleepNights} noč`)
    if (u.heatedSpace) add('Prostor', 'Zaprt in ogrevan')
    if (u.extras?.length) add('Dodatno', u.extras.map((e) => EXTRA_LABELS[e] ?? e).join(', '))
  }
  add('Opombe', m.notes)

  add('Naročnik', b.entity_type === 'pravna' ? `${b.company_name ?? ''} (pravna oseba)` : 'Fizična oseba')
  if (b.entity_type === 'pravna') {
    add('Davčna / ID za DDV', b.company_vat)
    add('Naslov podjetja', b.company_address)
  }
  add('Ime in priimek', b.customer_name)
  add('Telefon', b.customer_phone)
  add('E-pošta', b.customer_email)

  add('Skupaj', `${eur(b.price_total)} (DDV ${b.includes_zar ? '9,5' : '22'} % vključen)`)
  if (u.payNow != null) add('Ob rezervaciji', eur(u.payNow))
  if (u.payLater) add('Ostanek (plačilo kasneje)', eur(u.payLater))
  add('Plačilo', PAYMENT_LABELS[b.payment_status] ?? b.payment_status)
  add('Status', STATUS_LABELS[b.status] ?? b.status)
  if (b.zar_confirmation) add('Žar mojster', ZAR_CONF_LABELS[b.zar_confirmation] ?? b.zar_confirmation)
  add('Interna opomba', b.admin_note)
  add('Oddano', new Date(b.created_at).toLocaleString('sl-SI', { timeZone: 'Europe/Ljubljana' }))
  return rows
}

/** Količine hrane za rezervacijo (samo klasična ponudba ima količine iz Excela). */
export function bookingQuantities(b: Booking) {
  if (!b.includes_zar || !b.guest_count) return null
  const m = bookingMeat(b)
  if (m.menuType === 'zimski') return { kind: 'zimski' as const, items: WINTER_MENU_ITEMS }
  return { kind: 'klasicni' as const, quantities: computeQuantities(b.guest_count) }
}

export function vatLabel(b: Booking): string {
  return `${(vatRateFor(b.includes_zar) * 100).toLocaleString('sl-SI')} %`
}
