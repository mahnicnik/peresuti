import { NextResponse } from 'next/server'
import { appUrl } from '@/lib/email'
import { createCheckoutSession, getBookingForPayment } from '@/lib/payments'
import { nextPayment } from '@/lib/payments-shared'

// Stalna povezava za plačilo rezervacije (v e-pošti in na strani "plačilo ni bilo zaključeno").
// Ob vsakem odprtju ustvari svežo Stripe sejo za trenutno dolgovani znesek, zato povezava
// ne poteče. ID rezervacije je naključen UUID — kdor ga ima, lahko samo plača.
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_req: Request, ctx: RouteContext<'/api/placilo/[id]'>) {
  const { id } = await ctx.params
  const back = (status: string) =>
    NextResponse.redirect(appUrl(`/rezervacija/potrditev?status=${status}&booking=${id}`), 303)

  if (!uuidRe.test(id)) return back('not-found')
  const booking = await getBookingForPayment(id)
  if (!booking) return back('not-found')
  if (booking.status === 'cancelled') return back('expired')
  if (booking.entity_type !== 'fizicna') return back('sent')

  const next = nextPayment(booking)
  if (!next) return back('paid')

  const res = await createCheckoutSession({ booking, kind: next.kind, amount: next.amount })
  if ('error' in res) return back('payment-error')
  return NextResponse.redirect(res.url, 303)
}
