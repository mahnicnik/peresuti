// Izračuni zneskov za plačilo — brez strežniških odvisnosti (uporabno tudi v brskalniku).
import type { Database } from '@/lib/database.types'

type Booking = Database['public']['Tables']['bookings']['Row']
const r2 = (n: number) => Math.round(n * 100) / 100

/** Koliko je še neplačanega. */
export function amountDue(b: Booking): number {
  return Math.max(0, r2((b.price_total ?? 0) - (b.amount_paid ?? 0)))
}

/**
 * Katero plačilo stranka opravi, ko odpre povezavo za plačilo:
 * - še nič plačano in rezervacija ima "plačilo ob rezervaciji" -> to (piknik prostor + ara)
 * - sicer celoten preostanek
 */
export function nextPayment(b: Booking): { kind: 'booking' | 'balance'; amount: number } | null {
  const due = amountDue(b)
  if (due <= 0) return null
  const payNow = Number((b.upsell_selections as { payNow?: number } | null)?.payNow ?? 0)
  if (b.payment_status === 'unpaid' && payNow > 0) {
    return { kind: 'booking', amount: Math.min(r2(payNow), due) }
  }
  return { kind: 'balance', amount: due }
}
