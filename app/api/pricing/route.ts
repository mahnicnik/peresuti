import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const [piknik, zar, km, rules, upsell, meals] = await Promise.all([
    supabase.from('piknik_pricing').select('day_type,label,price'),
    supabase.from('zar_pricing_tiers').select('label,min_guests,max_guests,price,sort_order').order('sort_order'),
    supabase.from('km_pricing').select('location,distance_km,sort_order').order('sort_order'),
    supabase.from('space_rules').select('id,text,sort_order').eq('active', true).order('sort_order'),
    supabase.from('upsell_offers').select('key,title,description,price_note,unit_price,unit').eq('active', true),
    supabase.from('meal_addon_pricing').select('key,label,unit_price'),
  ])

  const firstError = [piknik, zar, km, rules, upsell, meals].find((r) => r.error)
  if (firstError?.error) {
    return NextResponse.json({ error: firstError.error.message }, { status: 500 })
  }

  return NextResponse.json({
    piknikPricing: piknik.data ?? [],
    zarTiers: zar.data ?? [],
    kmPricing: km.data ?? [],
    spaceRules: rules.data ?? [],
    upsellOffers: upsell.data ?? [],
    mealAddons: meals.data ?? [],
  })
}
