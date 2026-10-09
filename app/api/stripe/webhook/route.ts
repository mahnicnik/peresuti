import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'
import { internalSecret } from '@/lib/payments'
import { sendOwnerBookingEmail } from '@/lib/owner-email'
import { sendCustomerBalancePaid, sendCustomerBookingConfirmed, sendCustomerCancelled } from '@/lib/customer-email'
import type { Booking } from '@/lib/booking-details'

// Stripe webhook. V Stripe nadzorni plošči mora biti nastavljen endpoint
//   https://<domena>/api/stripe/webhook
// z dogodki: checkout.session.completed, checkout.session.async_payment_succeeded,
//            checkout.session.expired
export async function POST(req: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const secret = internalSecret()

  if (!stripe || !webhookSecret || !secret) {
    return NextResponse.json({ error: 'Stripe webhook ni konfiguriran' }, { status: 501 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Manjka stripe-signature' }, { status: 400 })
  }

  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Neveljaven podpis' }, { status: 400 })
  }

  const supabase = createServerClient()

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object
    // pri odloženih načinih plačila (npr. bančno nakazilo) počakamo na async_payment_succeeded
    if (session.payment_status !== 'paid') return NextResponse.json({ received: true })

    const { data, error } = await supabase.rpc('mark_payment_paid', { p_secret: secret, p_session_id: session.id })
    if (error) {
      // Seja ni naša (druga aplikacija na istem Stripe računu) ali je starejša od te verzije.
      // Ne vračamo 500, da Stripe ne ponavlja v nedogled.
      console.error('mark_payment_paid failed:', session.id, error.message)
      return NextResponse.json({ received: true })
    }
    const res = data as { already: boolean; kind: 'booking' | 'balance'; amount: number; booking: Booking }
    if (!res.already) {
      if (res.kind === 'booking') {
        await Promise.all([sendOwnerBookingEmail(res.booking, 'paid'), sendCustomerBookingConfirmed(res.booking)])
      } else {
        await Promise.all([
          sendOwnerBookingEmail(res.booking, 'balance_paid', { amount: Number(res.amount) }),
          sendCustomerBalancePaid(res.booking, Number(res.amount)),
        ])
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object
    const { data, error } = await supabase.rpc('expire_payment_session', { p_secret: secret, p_session_id: session.id })
    if (error) {
      console.error('expire_payment_session failed:', session.id, error.message)
    } else {
      const res = data as { cancelled: boolean; booking?: Booking }
      if (res.cancelled && res.booking) await sendCustomerCancelled(res.booking, 'expired')
    }
  }

  return NextResponse.json({ received: true })
}
