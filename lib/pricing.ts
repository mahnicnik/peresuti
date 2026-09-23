// Skupna logika za izračun cene — uporabljena tako na klientu (živi prikaz cene med
// izpolnjevanjem) kot na strežniku (avtoritativni, ponovno izračunani znesek tik pred
// shranjevanjem rezervacije — strežnik NIKOLI ne zaupa `price_total`, ki bi ga poslal klient).

export type PiknikPricing = { day_type: string; label: string; price: number }
export type ZarTier = {
  label: string
  min_guests: number
  max_guests: number | null
  price: number
  sort_order: number
}
export type KmPricing = { location: string; distance_km: number; sort_order: number }
export type UpsellOffer = {
  key: string
  title: string
  description: string | null
  price_note: string | null
  unit_price: number | null
  unit: string | null
}
export type MealAddon = { key: string; label: string; unit_price: number }

export type PricingReferenceData = {
  piknikPricing: PiknikPricing[]
  zarTiers: ZarTier[]
  kmPricing: KmPricing[]
  upsellOffers: UpsellOffer[]
  mealAddons: MealAddon[]
}

export type BookingSelection = {
  bookingDate: string // YYYY-MM-DD
  includesPiknik: boolean
  includesZar: boolean
  guestCount: number | null
  location: string | null // ime kraja iz km_pricing, ali null = na lokaciji prostora (brez doplačila)
  vegetarianMeals: number
  veganMeals: number
  sleepNights: number // 0 = brez prenočišča
}

/** Vrne 'pon_cet' | 'pet_ned' | 'sobota' glede na dan v tednu izbranega datuma. */
export function dayTypeForDate(dateStr: string): 'pon_cet' | 'pet_ned' | 'sobota' {
  // new Date('YYYY-MM-DD') je UTC opolnoči; getUTCDay se sklada, ker ni časovne komponente
  const d = new Date(`${dateStr}T00:00:00Z`)
  const dow = d.getUTCDay() // 0=Ned,1=Pon,...6=Sob
  if (dow === 6) return 'sobota'
  if (dow === 5 || dow === 0) return 'pet_ned'
  return 'pon_cet'
}

export function findZarTier(tiers: ZarTier[], guestCount: number): ZarTier | null {
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order)
  for (const t of sorted) {
    if (guestCount >= t.min_guests && (t.max_guests === null || guestCount < t.max_guests)) {
      return t
    }
  }
  // nad zgornjo mejo zadnjega razreda -> zadnji razred ("Več kot 60 oseb")
  return sorted[sorted.length - 1] ?? null
}

export type PriceLine = { label: string; amount: number }
export type PriceBreakdown = {
  lines: PriceLine[]
  total: number
}

export function computePriceBreakdown(
  sel: BookingSelection,
  ref: PricingReferenceData
): PriceBreakdown {
  const lines: PriceLine[] = []

  if (sel.includesPiknik) {
    const dayType = dayTypeForDate(sel.bookingDate)
    const p = ref.piknikPricing.find((x) => x.day_type === dayType)
    if (p) lines.push({ label: `Najem piknik prostora (${p.label})`, amount: p.price })
  }

  if (sel.includesZar && sel.guestCount && sel.guestCount > 0) {
    const tier = findZarTier(ref.zarTiers, sel.guestCount)
    if (tier) lines.push({ label: `Najem žar mojstra (${tier.label})`, amount: tier.price })
  }

  if (sel.includesZar && sel.location) {
    const km = ref.kmPricing.find((k) => k.location === sel.location)
    if (km && km.distance_km > 0) {
      lines.push({
        label: `Kilometrina (${km.location}, ${km.distance_km} km × 1 €)`,
        amount: km.distance_km,
      })
    }
  }

  if (sel.includesZar) {
    const vegAddon = ref.mealAddons.find((m) => m.key === 'vegetarian_meal')
    const veganAddon = ref.mealAddons.find((m) => m.key === 'vegan_meal')
    if (vegAddon && sel.vegetarianMeals > 0) {
      lines.push({
        label: `Vegetarijanski obroki (${sel.vegetarianMeals} × ${vegAddon.unit_price} €)`,
        amount: sel.vegetarianMeals * vegAddon.unit_price,
      })
    }
    if (veganAddon && sel.veganMeals > 0) {
      lines.push({
        label: `Veganski obroki (${sel.veganMeals} × ${veganAddon.unit_price} €)`,
        amount: sel.veganMeals * veganAddon.unit_price,
      })
    }
  }

  if (sel.sleepNights > 0) {
    const sleep = ref.upsellOffers.find((u) => u.key === 'spanje')
    if (sleep && sleep.unit_price) {
      lines.push({
        label: `Prenočišče (${sel.sleepNights} × ${sleep.unit_price} €)`,
        amount: sel.sleepNights * sleep.unit_price,
      })
    }
  }

  // Popust: piknik prostor + žar mojster skupaj (catering popust)
  if (sel.includesPiknik && sel.includesZar) {
    const discount = ref.upsellOffers.find((u) => u.key === 'catering_popust')
    if (discount && discount.unit_price) {
      lines.push({ label: discount.title, amount: -discount.unit_price })
    }
  }

  const total = Math.max(
    0,
    lines.reduce((sum, l) => sum + l.amount, 0)
  )

  return { lines, total: Math.round(total * 100) / 100 }
}
