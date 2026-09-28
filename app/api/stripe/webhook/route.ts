import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'
import { sendBookingInfoEmail } from '@/lib/info-email'

export async function POST(req: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const internalSecret = process.env.BOOKING_INTERNAL_SECRET

  if (!stripe || !webhookSecret || !internalSecret) {
    return NextResponse.json({ error: 'Stripe webhook ni konfiguriran' }, { status: 501 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Manjka stripe-signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Neveljaven podpis' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string
      customer_email: string | null
      customer_details?: { email?: string | null } | null
      metadata?: Record<string, string> | null
    }
    const supabase = createServerClient()

    const { error } = await supabase.rpc('mark_booking_paid', {
      p_session_id: session.id,
      p_secret: internalSecret,
    })

    if (error) {
      // Ne vračamo 500 za "booking not found" primere, da Stripe ne pošilja neskončnih retryjev
      // za dogodke, ki niso naši (druga aplikacija na istem Stripe računu ipd.)
      console.error('mark_booking_paid failed:', error.message)
    } else {
      const to = session.customer_details?.email ?? session.customer_email
      const m = session.metadata ?? {}
      if (to && m.booking_date) {
        await sendBookingInfoEmail({
          to,
          date: m.booking_date,
          includesPiknik: m.includes_piknik === '1',
          includesZar: m.includes_zar === '1',
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
