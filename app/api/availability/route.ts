import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ZAR_CONDITIONAL_THRESHOLD } from '@/lib/pricing'

// Vrne SAMO datume (brez osebnih podatkov — glej view-a `piknik_availability` in
// `zar_availability`):
// - bookedPiknikDates: piknik prostor je zaseden
// - conditionalZarDates: žar mojster ima na ta dan že vsaj 2 pikniku -> "pogojno prosto"
//   (rezervacijo je še mogoče oddati, potrdi pa jo lastnik ročno, brez are)
export async function GET() {
  const supabase = createServerClient()
  const [piknik, zar] = await Promise.all([
    supabase.from('piknik_availability').select('booking_date'),
    supabase.from('zar_availability').select('booking_date,zar_count'),
  ])

  const err = piknik.error ?? zar.error
  if (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      bookedPiknikDates: (piknik.data ?? []).map((r) => r.booking_date),
      conditionalZarDates: (zar.data ?? [])
        .filter((r) => (r.zar_count ?? 0) >= ZAR_CONDITIONAL_THRESHOLD)
        .map((r) => r.booking_date),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
