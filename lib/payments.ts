// Stripe Checkout — ustvarjanje plačilnih sej za rezervacije (samo na strežniku).
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/email'
import { formatDateSl, serviceLabel, type Booking } from '@/lib/booking-details'

export type PaymentKind = 'booking' | 'balance'

export function internalSecret(): string | null {
  return process.env.BOOKING_INTERNAL_SECRET ?? null
}

/**
 * Ustvari Stripe Checkout sejo za dani znesek in jo zabeleži v bazi (booking_payments).
 * Seja ob rezervaciji poteče po 30 min (minimum pri Stripe) — takrat webhook sprosti termin,
 * če stranka ni plačala. Seja za ostanek velja 23 ur (povezava v e-pošti vedno ustvari novo sejo).
 */
export async function createCheckoutSession(opts: {
  booking: Booking
  kind: PaymentKind
  amount: number
  lines?: string[]
}): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe()
  const secret = internalSecret()
  if (!stripe || !secret) return { error: 'Spletno plačilo ni nastavljeno.' }
  const { booking: b, kind, amount } = opts
  if (!(amount > 0)) return { error: 'Ni zneska za plačilo.' }

  const minutes = kind === 'booking' ? 31 : 23 * 60
  const name =
    kind === 'booking'
      ? `Rezervacija Perešuti — ${serviceLabel(b)}, ${formatDateSl(b.booking_date)}`
      : `Plačilo rezervacije Perešuti — ${serviceLabel(b)}, ${formatDateSl(b.booking_date)}`

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'sl',
      customer_email: b.customer_email,
      expires_at: Math.floor(Date.now() / 1000) + minutes * 60,
      // Stripe ne podpira negativnih postavk (popust), zato en znesek; razčlenitev je v opisu
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name,
              description: (opts.lines?.length ? opts.lines.join(' · ') : `Rezervacija ${b.booking_date}`).slice(0, 500),
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        description: `${name} (${b.customer_name})`,
        metadata: { booking_id: b.id, kind },
      },
      metadata: { booking_id: b.id, booking_date: b.booking_date, kind },
      success_url: appUrl(`/rezervacija/potrditev?status=${kind === 'booking' ? 'success' : 'paid'}&booking=${b.id}`),
      cancel_url: appUrl(`/rezervacija/potrditev?status=cancelled&booking=${b.id}`),
    })
    if (!session.url) return { error: 'Stripe ni vrnil povezave za plačilo.' }

    const { error } = await createServerClient().rpc('record_payment_session', {
      p_secret: secret,
      p_booking_id: b.id,
      p_session_id: session.id,
      p_kind: kind,
      p_amount: amount,
    })
    if (error) {
      console.error('record_payment_session failed:', error.message)
      await stripe.checkout.sessions.expire(session.id).catch(() => {})
      return { error: 'Plačila trenutno ni mogoče začeti. Poskusite znova.' }
    }
    return { url: session.url }
  } catch (e) {
    console.error('Stripe checkout create failed:', e)
    return { error: 'Napaka pri povezavi s Stripe. Poskusite znova.' }
  }
}

export async function getBookingForPayment(id: string): Promise<Booking | null> {
  const secret = internalSecret()
  if (!secret) return null
  const { data, error } = await createServerClient().rpc('get_booking_for_payment', {
    p_secret: secret,
    p_booking_id: id,
  })
  if (error || !data || !data.id) return null
  return data
}
