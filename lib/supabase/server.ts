import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Uporabljeno v API route-ih (app/api/**). Namenoma uporablja anon ključ — vse operacije
// pisanja gredo prek security-definer RPC-jev v bazi (create_booking, mark_booking_paid, ...),
// ki so edine poti do tabele `bookings`. Service role key ni potreben in ni nikjer shranjen.
export function createServerClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}
