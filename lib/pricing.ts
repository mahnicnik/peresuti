// Skupna logika za izračun cene — uporabljena tako na klientu (živi prikaz cene med
// izpolnjevanjem) kot na strežniku (avtoritativni, ponovno izračunani znesek tik pred
// shranjevanjem rezervacije — strežnik NIKOLI ne zaupa `price_total`, ki bi ga poslal klient).
import { lookupPostalCode } from './postal-codes'

/** Pri tolikšnem številu oseb se najem piknik prostora podraži za 50 %. */
export const PIKNIK_SURCHARGE_GUESTS = 70
/** Fiksna ara za rezervacijo žar mojstra (plača se takoj, ostanek kasneje). */
export const ZAR_DEPOSIT = 100
/** Kilometrina: 1 € na km od Gorenje vasi, lokacije do te razdalje so brez doplačila. */
export const KM_PRICE = 1
export const KM_FREE_RADIUS = 30

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
  location: string | null // poštna številka lokacije dogodka, ali null = na piknik prostoru (brez doplačila)
  vegetarianMeals: number
  veganMeals: number
  sleepNights: number // 0 = brez prenočišča
  extras: string[] // ključi dodatnih storitev iz upsell_offers (odvoz_smeti, ciscenje)
}

/** Zimski meni je na voljo od 1. 10. do 30. 4. */
export function isWinterDate(dateStr: string): boolean {
  const m = Number(dateStr.slice(5, 7))
  return m >= 10 || m <= 4
}

/** Kilometrina za poštno številko; null, če je številka neznana. */
export function kmChargeForPostalCode(code: string | null): { place: string; km: number; amount: number } | null {
  const hit = lookupPostalCode(code)
  if (!hit) return null
  // Ljubljana (vse njene poštne številke) je brez kilometrine
  const free = hit.km <= KM_FREE_RADIUS || hit.place.startsWith('Ljubljana')
  return { ...hit, amount: free ? 0 : hit.km * KM_PRICE }
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
  // nad zgornjo mejo zadnjega razreda -> zadnji razred ("Več kot 50 oseb")
  return sorted[sorted.length - 1] ?? null
}

export type PriceLine = { label: string; amount: number }
export type PriceBreakdown = {
  lines: PriceLine[]
  total: number
  payNow: number // piknik prostor v celoti + ara za žar mojstra (plačilo prek Stripe)
  payLater: number // preostanek za žar mojstra (plača se kasneje)
}

export function computePriceBreakdown(
  sel: BookingSelection,
  ref: PricingReferenceData
): PriceBreakdown {
  // Ločeno vodimo postavke piknik prostora (plačajo se v celoti takoj) in žar mojstra
  // (takoj se plača samo ara ZAR_DEPOSIT, ostanek kasneje).
  const piknikLines: PriceLine[] = []
  const zarLines: PriceLine[] = []
  const guests = sel.guestCount ?? 0

  if (sel.includesPiknik) {
    const dayType = dayTypeForDate(sel.bookingDate)
    const p = ref.piknikPricing.find((x) => x.day_type === dayType)
    if (p) {
      piknikLines.push({ label: `Najem piknik prostora (${p.label})`, amount: p.price })
      if (guests >= PIKNIK_SURCHARGE_GUESTS) {
        piknikLines.push({ label: `Doplačilo ${PIKNIK_SURCHARGE_GUESTS}+ oseb (+50 %)`, amount: p.price * 0.5 })
      }
    }
    for (const key of sel.extras) {
      const offer = ref.upsellOffers.find((u) => u.key === key && u.unit === 'flat')
      if (offer?.unit_price) piknikLines.push({ label: offer.title, amount: offer.unit_price })
    }
    if (sel.sleepNights > 0) {
      const sleep = ref.upsellOffers.find((u) => u.key === 'spanje')
      if (sleep?.unit_price) {
        piknikLines.push({
          label: `Prenočišče (${sel.sleepNights} × ${sleep.unit_price} €)`,
          amount: sel.sleepNights * sleep.unit_price,
        })
      }
    }
  }

  if (sel.includesZar && guests > 0) {
    const tier = findZarTier(ref.zarTiers, guests)
    if (tier) {
      zarLines.push({
        label: `Žar mojster (${guests} × ${tier.price} €, ${tier.label.toLowerCase()})`,
        amount: guests * tier.price,
      })
    }
    const km = kmChargeForPostalCode(sel.location)
    if (km && km.amount > 0) {
      zarLines.push({ label: `Kilometrina (${km.place}, ${km.km} km × ${KM_PRICE} €)`, amount: km.amount })
    }
    const vegAddon = ref.mealAddons.find((m) => m.key === 'vegetarian_meal')
    const veganAddon = ref.mealAddons.find((m) => m.key === 'vegan_meal')
    if (vegAddon && vegAddon.unit_price > 0 && sel.vegetarianMeals > 0) {
      zarLines.push({
        label: `Vegetarijanski obroki (${sel.vegetarianMeals} × ${vegAddon.unit_price} €)`,
        amount: sel.vegetarianMeals * vegAddon.unit_price,
      })
    }
    if (veganAddon && veganAddon.unit_price > 0 && sel.veganMeals > 0) {
      zarLines.push({
        label: `Veganski obroki (${sel.veganMeals} × ${veganAddon.unit_price} €)`,
        amount: sel.veganMeals * veganAddon.unit_price,
      })
    }
  }

  // Popust: piknik prostor + žar mojster skupaj — zniža ceno piknik prostora
  if (sel.includesPiknik && sel.includesZar) {
    const discount = ref.upsellOffers.find((u) => u.key === 'catering_popust')
    if (discount?.unit_price) piknikLines.push({ label: discount.title, amount: -discount.unit_price })
  }

  const sum = (ls: PriceLine[]) => ls.reduce((a, l) => a + l.amount, 0)
  const round = (n: number) => Math.round(Math.max(0, n) * 100) / 100
  const piknikTotal = round(sum(piknikLines))
  const zarTotal = round(sum(zarLines))
  const zarNow = sel.includesZar ? Math.min(ZAR_DEPOSIT, zarTotal || ZAR_DEPOSIT) : 0

  return {
    lines: [...piknikLines, ...zarLines],
    total: round(piknikTotal + zarTotal),
    payNow: round(piknikTotal + zarNow),
    payLater: round(zarTotal - zarNow),
  }
}
