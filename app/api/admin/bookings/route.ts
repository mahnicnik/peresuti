import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdmin } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase/server'
import { sendCustomerZarStatusEmail } from '@/lib/owner-email'
import { sendBookingInfoEmail } from '@/lib/info-email'

const dateRe = /^\d{4}-\d{2}-\d{2}$/

function secretOr501() {
  const secret = process.env.BOOKING_INTERNAL_SECRET
  return secret ?? null
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Ni dostopa' }, { status: 401 })
  const secret = secretOr501()
  if (!secret) return NextResponse.json({ error: 'BOOKING_INTERNAL_SECRET ni nastavljen' }, { status: 501 })

  const url = new URL(req.url)
  const from = url.searchParams.get('from') ?? ''
  const to = url.searchParams.get('to') ?? ''
  if (!dateRe.test(from) || !dateRe.test(to)) {
    return NextResponse.json({ error: 'Neveljaven razpon' }, { status: 400 })
  }
  const { data, error } = await createServerClient().rpc('admin_list_bookings', { p_secret: secret, p_from: from, p_to: to })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookings: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['confirm_zar', 'reject_zar', 'mark_paid', 'mark_unpaid', 'cancel', 'restore', 'note']),
  note: z.string().max(2000).optional(),
})

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Ni dostopa' }, { status: 401 })
  const secret = secretOr501()
  if (!secret) return NextResponse.json({ error: 'BOOKING_INTERNAL_SECRET ni nastavljen' }, { status: 501 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Neveljavna zahteva' }, { status: 400 })
  const { id, action, note } = parsed.data

  const args: {
    p_secret: string
    p_id: string
    p_status?: string
    p_payment_status?: string
    p_zar_confirmation?: string
    p_admin_note?: string
  } = { p_secret: secret, p_id: id }
  switch (action) {
    case 'confirm_zar':
      args.p_zar_confirmation = 'confirmed'
      break
    case 'reject_zar':
      args.p_zar_confirmation = 'rejected'
      break
    case 'mark_paid':
      args.p_payment_status = 'paid'
      args.p_status = 'confirmed'
      break
    case 'mark_unpaid':
      args.p_payment_status = 'unpaid'
      break
    case 'cancel':
      args.p_status = 'cancelled'
      break
    case 'restore':
      args.p_status = 'pending'
      break
    case 'note':
      args.p_admin_note = note ?? ''
      break
  }

  const supabase = createServerClient()
  const { data: booking, error } = await supabase.rpc('admin_update_booking', args)
  if (error || !booking) {
    const msg = error?.message?.includes('že zaseden') || error?.code === '23505'
      ? 'Piknik prostor je na ta dan že zaseden z drugo rezervacijo.'
      : error?.message ?? 'Napaka'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Zavrnjen žar mojster pri rezervaciji samo za žar -> rezervacija je preklicana
  let result = booking
  if (action === 'reject_zar' && !booking.includes_piknik && booking.status !== 'cancelled') {
    const r = await supabase.rpc('admin_update_booking', { p_secret: secret, p_id: id, p_status: 'cancelled' })
    if (r.data) result = r.data
  }
  // Potrjen žar mojster pri rezervaciji samo za žar (brez are) -> rezervacija je potrjena
  if (action === 'confirm_zar' && !booking.includes_piknik && booking.status === 'pending') {
    const r = await supabase.rpc('admin_update_booking', { p_secret: secret, p_id: id, p_status: 'confirmed' })
    if (r.data) result = r.data
  }

  if (action === 'confirm_zar') {
    await Promise.all([
      sendCustomerZarStatusEmail(result, 'confirmed'),
      sendBookingInfoEmail({
        to: result.customer_email,
        date: result.booking_date,
        includesPiknik: result.includes_piknik,
        includesZar: result.includes_zar,
      }),
    ])
  } else if (action === 'reject_zar') {
    await sendCustomerZarStatusEmail(result, 'rejected')
  }

  return NextResponse.json({ booking: result })
}
