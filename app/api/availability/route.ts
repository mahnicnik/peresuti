import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Vrne SAMO datume, ko je piknik prostor že zaseden (brez osebnih podatkov — glej
// `piknik_availability` view in njegove RLS/grant nastavitve). Žar mojster nima omejitve,
// zato zanj zasedenost ni relevantna in se v koledarju nikoli ne prikaže kot 'zasedeno'.
export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('piknik_availability').select('booking_date')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    bookedPiknikDates: (data ?? []).map((r) => r.booking_date),
  })
}
