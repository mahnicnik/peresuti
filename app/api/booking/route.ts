import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bookingRequestSchema } from '@/lib/booking-schema'
import { computePriceBreakdown, kmChargeForPostalCode, type PricingReferenceData } from '@/lib/pricing'
import { getStripe } from '@/lib/stripe'
import { getResend } from '@/lib/resend'
import { renderNarocilnicaHtml } from '@/lib/booking-email'

export async function POST(req: Request) {
  const supabase = createServerClient()

  const json = await req.json().catch(() => null)
  const parsed = bookingRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Neveljavni podatki' }, { status: 400 })
  }
  const body = parsed.data

  // Cross-sell iz upsell koraka se šteje kot dejanska izbira storitve
  const finalIncludesPiknik = body.includesPiknik || body.upsell.addPiknik
  const finalIncludesZar = body.includesZar || body.upsell.addZar

  // --- Avtoritativni izračun cene na strežniku (nikoli ne zaupamo ceni s klienta) ---
  const [piknik, zar, km, upsellOffers, meals] = await Promise.all([
    supabase.from('piknik_pricing').select('day_type,label,price'),
    supabase.from('zar_pricing_tiers').select('label,min_guests,max_guests,price,sort_order'),
    supabase.from('km_pricing').select('location,distance_km,sort_order'),
    supabase.from('upsell_offers').select('key,title,description,price_note,unit_price,unit'),
    supabase.from('meal_addon_pricing').select('key,label,unit_price'),
  ])
  const refError = [piknik, zar, km, upsellOffers, meals].find((r) => r.error)
  if (refError?.error) {
    return NextResponse.json({ error: 'Napaka pri branju cenika' }, { status: 500 })
  }

  const ref: PricingReferenceData = {
    piknikPricing: piknik.data ?? [],
    zarTiers: zar.data ?? [],
    kmPricing: km.data ?? [],
    upsellOffers: upsellOffers.data ?? [],
    mealAddons: meals.data ?? [],
  }

  const breakdown = computePriceBreakdown(
    {
      bookingDate: body.bookingDate,
      includesPiknik: finalIncludesPiknik,
      includesZar: finalIncludesZar,
      guestCount: body.guestCount,
      location: body.location,
      vegetarianMeals: body.vegetarianMeals,
      veganMeals: body.veganMeals,
      sleepNights: body.upsell.sleepNights,
      extras: finalIncludesPiknik ? body.upsell.extras : [],
    },
    ref
  )
  const kmCharge = finalIncludesZar ? kmChargeForPostalCode(body.location) : null
  if (finalIncludesZar && body.location && !kmCharge) {
    return NextResponse.json({ error: 'Neznana poštna številka' }, { status: 400 })
  }
  const notes = [
    finalIncludesZar ? `Meni: ${body.menuType}.` : '',
    body.meatPreferences.notes,
  ]
    .filter(Boolean)
    .join(' ')

  // --- Ustvari rezervacijo prek varnega RPC-ja (edina pot do tabele bookings) ---
  const { data: booking, error: createError } = await supabase.rpc('create_booking', {
    p_booking_date: body.bookingDate,
    p_includes_piknik: finalIncludesPiknik,
    p_includes_zar: finalIncludesZar,
    p_guest_count: body.guestCount,
    p_meat_preferences: { notes, menuType: finalIncludesZar ? body.menuType : null },
    p_location: kmCharge ? `${body.location} ${kmCharge.place}` : null,
    p_km_distance: kmCharge?.km ?? null,
    p_upsell_selections: {
      sleepNights: body.upsell.sleepNights,
      addZar: body.upsell.addZar,
      addPiknik: body.upsell.addPiknik,
      vegetarianMeals: body.vegetarianMeals,
      veganMeals: body.veganMeals,
      extras: body.upsell.extras,
      payNow: breakdown.payNow,
      payLater: breakdown.payLater,
      acceptedRuleIds: body.acceptedRuleIds,
    },
    p_entity_type: body.entityType,
    p_customer_name: body.customerName,
    p_customer_email: body.customerEmail,
    p_customer_phone: body.customerPhone || null,
    p_company_name: body.companyName || null,
    p_company_vat: body.companyVat || null,
    p_company_address: body.companyAddress || null,
    p_price_total: breakdown.total,
    p_notes: null,
    p_event_start_time: finalIncludesZar ? body.foodReadyTime : null,
    p_event_end_time: null,
  })

  if (createError || !booking) {
    const msg = createError?.message?.includes('že zaseden')
      ? createError.message
      : 'Rezervacije ni bilo mogoče ustvariti. Poskusite znova.'
    return NextResponse.json({ error: msg }, { status: 409 })
  }

  // --- Pravna oseba: naročilnica prek Resend (lastniku + kopija naročniku) ---
  if (body.entityType === 'pravna') {
    const resend = getResend()
    const ownerEmail = process.env.OWNER_EMAIL
    const fromEmail = process.env.RESEND_FROM_EMAIL

    if (!resend || !ownerEmail || !fromEmail) {
      return NextResponse.json({
        success: true,
        entityType: 'pravna',
        bookingId: booking.id,
        warning:
          'Rezervacija je shranjena, e-pošta pa še ni bila poslana, ker Resend še ni povezan (manjka RESEND_API_KEY/OWNER_EMAIL). Uredite to v .env, ko boste imeli Resend račun.',
      })
    }

    const html = renderNarocilnicaHtml(booking, breakdown)
    const subject = `Naročilnica — ${booking.company_name ?? booking.customer_name} — ${booking.booking_date}`

    await Promise.all([
      resend.emails.send({ from: fromEmail, to: ownerEmail, subject, html }),
      resend.emails.send({ from: fromEmail, to: booking.customer_email, subject: `Vaša naročilnica — Perešuti (${booking.booking_date})`, html }),
    ])

    return NextResponse.json({ success: true, entityType: 'pravna', bookingId: booking.id })
  }

  // --- Fizična oseba: plačilo prek Stripe ---
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({
      success: true,
      entityType: 'fizicna',
      bookingId: booking.id,
      checkoutUrl: null,
      warning:
        'Rezervacija je shranjena kot čakajoča. Spletno plačilo še ni povezano (manjka STRIPE_SECRET_KEY) — kontaktirali vas bomo za dogovor o plačilu.',
    })
  }

  // Stripe ne podpira negativnih zneskov v line_items, zato pošljemo en sam
  // line item z že izračunanim skupnim zneskom (razčlenitev je stranka že videla v aplikaciji,
  // enako pa jo dobi tudi na prejetem računu iz računko.si).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const itemDescription = [
    ...breakdown.lines.map((l) => `${l.label}: ${l.amount.toFixed(2)} €`),
    breakdown.payLater > 0 ? `Plačilo zdaj: ${breakdown.payNow.toFixed(2)} € (ostanek ${breakdown.payLater.toFixed(2)} € za žar mojstra plačate kasneje)` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: booking.customer_email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: breakdown.payLater > 0
              ? `Rezervacija Perešuti — ${booking.booking_date} (plačilo ob rezervaciji)`
              : `Rezervacija Perešuti — ${booking.booking_date}`,
            description: itemDescription.slice(0, 500),
          },
          unit_amount: Math.round(breakdown.payNow * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { booking_id: booking.id },
    success_url: `${appUrl}/rezervacija/potrditev?status=success&booking=${booking.id}`,
    cancel_url: `${appUrl}/rezervacija/potrditev?status=cancelled&booking=${booking.id}`,
  })

  await supabase.rpc('set_booking_stripe_session', {
    p_booking_id: booking.id,
    p_session_id: session.id,
  })

  return NextResponse.json({
    success: true,
    entityType: 'fizicna',
    bookingId: booking.id,
    checkoutUrl: session.url,
  })
}
