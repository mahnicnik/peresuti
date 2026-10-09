import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bookingRequestSchema } from '@/lib/booking-schema'
import { computePriceBreakdown, kmChargeForPostalCode, ZAR_CONDITIONAL_THRESHOLD, type PricingReferenceData } from '@/lib/pricing'
import { getStripe } from '@/lib/stripe'
import { renderNarocilnicaHtml } from '@/lib/booking-email'
import { sendBookingInfoEmail } from '@/lib/info-email'
import { adminBookingUrl, sendOwnerBookingEmail } from '@/lib/owner-email'
import { sendCustomerZarStatusEmail } from '@/lib/customer-email'
import { emailButton, emailLayout, sendEmail } from '@/lib/email'
import { createCheckoutSession, internalSecret } from '@/lib/payments'

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

  const selection = {
      bookingDate: body.bookingDate,
      includesPiknik: finalIncludesPiknik,
      includesZar: finalIncludesZar,
      guestCount: body.guestCount,
      location: body.location,
      vegetarianMeals: body.vegetarianMeals,
      veganMeals: body.veganMeals,
      sleepNights: Math.min(body.upsell.sleepNights, 1),
      extras: finalIncludesPiknik ? body.upsell.extras : [],
      menuType: body.menuType,
  }
  // Skupni znesek ni odvisen od "pogojnosti" termina — ta vpliva samo na aro (plačilo zdaj),
  // zato jo po ustvarjanju rezervacije (ko baza avtoritativno odloči) izračunamo ponovno.
  let expectConditional = false
  if (finalIncludesZar) {
    const { data: zarDay } = await supabase
      .from('zar_availability')
      .select('zar_count')
      .eq('booking_date', body.bookingDate)
      .maybeSingle()
    expectConditional = (zarDay?.zar_count ?? 0) >= ZAR_CONDITIONAL_THRESHOLD
  }
  let breakdown = computePriceBreakdown({ ...selection, zarConditional: expectConditional }, ref)
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
      sleepNights: Math.min(body.upsell.sleepNights, 1),
      addZar: body.upsell.addZar,
      addPiknik: body.upsell.addPiknik,
      vegetarianMeals: body.vegetarianMeals,
      veganMeals: body.veganMeals,
      extras: body.upsell.extras,
      heatedSpace: finalIncludesPiknik ? body.upsell.heatedSpace : false,
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

  // --- Žar mojster na pogojno prost dan (že ≥ 2 pikniki): brez are, potrdi lastnik ---
  const zarConditional = booking.zar_confirmation === 'pending'
  if (zarConditional !== expectConditional) {
    // redka tekma med dvema oddajama — baza je odločila drugače
    breakdown = computePriceBreakdown({ ...selection, zarConditional }, ref)
  }

  if (zarConditional && body.entityType === 'fizicna' && !finalIncludesPiknik) {
    await Promise.all([
      sendOwnerBookingEmail(booking, 'inquiry'),
      sendCustomerZarStatusEmail(booking, 'inquiry'),
    ])
    return NextResponse.json({ success: true, entityType: 'fizicna', bookingId: booking.id, conditional: true })
  }

  // --- Pravna oseba: naročilnica prek Resend (lastniku + kopija naročniku) ---
  if (body.entityType === 'pravna') {
    const html = renderNarocilnicaHtml(booking, breakdown)
    const who = booking.company_name ?? booking.customer_name
    const ownerEmail = process.env.OWNER_EMAIL
    const [ownerSent] = await Promise.all([
      ownerEmail
        ? sendEmail({
            to: ownerEmail,
            replyTo: booking.customer_email,
            subject: `${zarConditional ? 'Naročilnica (žar čaka potrditev)' : 'Naročilnica'} — ${who} — ${booking.booking_date}`,
            html: emailLayout(`${html}${emailButton(adminBookingUrl(booking), 'Odpri v koledarju →')}`),
          })
        : Promise.resolve(false),
      sendEmail({
        to: booking.customer_email,
        subject: `Vaša naročilnica — Perešuti (${booking.booking_date})`,
        html: emailLayout(html),
      }),
      sendBookingInfoEmail({
        to: booking.customer_email,
        date: booking.booking_date,
        includesPiknik: finalIncludesPiknik,
        includesZar: finalIncludesZar,
        menuType: finalIncludesZar ? body.menuType : null,
      }),
    ])

    return NextResponse.json({
      success: true,
      entityType: 'pravna',
      bookingId: booking.id,
      conditional: zarConditional,
      ...(ownerSent ? {} : { warning: 'Rezervacija je shranjena, e-pošta pa ni bila poslana (Resend ni nastavljen).' }),
    })
  }

  // --- Fizična oseba: plačilo prek Stripe ---
  if (!getStripe()) {
    // Brez Stripe rezervacije ne izgubimo: lastnik dobi vse podatke in se dogovori za plačilo.
    await sendOwnerBookingEmail(booking, 'unpaid_pending')
    return NextResponse.json({
      success: true,
      entityType: 'fizicna',
      bookingId: booking.id,
      checkoutUrl: null,
      warning:
        'Rezervacija je shranjena kot čakajoča. Spletno plačilo še ni povezano — kontaktirali vas bomo za dogovor o plačilu.',
    })
  }

  const lines = [
    ...breakdown.lines.map((l) => `${l.label}: ${l.amount.toFixed(2)} €`),
    breakdown.payLater > 0
      ? `Plačilo zdaj: ${breakdown.payNow.toFixed(2)} € (ostanek ${breakdown.payLater.toFixed(2)} € plačate kasneje)`
      : '',
  ].filter(Boolean)

  const checkout = await createCheckoutSession({ booking, kind: 'booking', amount: breakdown.payNow, lines })
  if ('error' in checkout) {
    // Plačila ni bilo mogoče začeti -> rezervacijo prekličemo, da termin ne ostane blokiran
    const secret = internalSecret()
    if (secret) {
      await supabase.rpc('admin_update_booking', {
        p_secret: secret,
        p_id: booking.id,
        p_status: 'cancelled',
        p_admin_note: '[Samodejno preklicano: plačila ni bilo mogoče začeti.]',
      })
    }
    return NextResponse.json({ error: checkout.error }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    entityType: 'fizicna',
    bookingId: booking.id,
    checkoutUrl: checkout.url,
  })
}
