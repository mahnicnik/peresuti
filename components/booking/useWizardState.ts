'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { computePriceBreakdown, type BookingSelection } from '@/lib/pricing'
import { ALL_STEPS, type Step, type PricingApiResponse } from './constants'

export function useWizardState(tip: 'piknik' | 'zar' | 'oboje') {
  const router = useRouter()
  const baseIncludesPiknik = tip === 'piknik' || tip === 'oboje'
  const baseIncludesZar = tip === 'zar' || tip === 'oboje'

  const [step, setStep] = useState<Step>('calendar')

  const [pricing, setPricing] = useState<PricingApiResponse | null>(null)
  const [bookedPiknikDates, setBookedPiknikDates] = useState<string[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/pricing').then((r) => r.json()),
      fetch('/api/availability').then((r) => r.json()),
    ])
      .then(([pricingRes, availRes]) => {
        if (pricingRes.error) throw new Error(pricingRes.error)
        setPricing(pricingRes)
        setBookedPiknikDates(availRes.bookedPiknikDates ?? [])
      })
      .catch(() => setLoadError('Napaka pri nalaganju podatkov. Poskusite osvežiti stran.'))
  }, [])

  // --- form state ---
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState<number | ''>('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [meatNotes, setMeatNotes] = useState('')
  const [vegetarianMeals, setVegetarianMeals] = useState(0)
  const [veganMeals, setVeganMeals] = useState(0)
  const [location, setLocation] = useState<string | null>(null)

  // Meni žar mojstra po kategorijah — trenutno samo za izbiro/izgled, izbrane postavke
  // gredo v opombe rezervacije (polna ponudba s cenami pride kasneje).
  const [menuSelections, setMenuSelections] = useState<Record<string, boolean>>({})
  const [menuSpecialRequests, setMenuSpecialRequests] = useState('')

  const [acceptedRules, setAcceptedRules] = useState<Record<string, boolean>>({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const [addZar, setAddZar] = useState(false)
  const [addPiknik, setAddPiknik] = useState(false)
  const [sleepNights, setSleepNights] = useState(0)

  const [entityType, setEntityType] = useState<'fizicna' | 'pravna'>('fizicna')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyVat, setCompanyVat] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const includesPiknik = baseIncludesPiknik || addPiknik
  const includesZar = baseIncludesZar || addZar

  const isPiknikOnly = baseIncludesPiknik && !baseIncludesZar
  const isZarOnly = baseIncludesZar && !baseIncludesPiknik
  const piknikFreeOnDate = selectedDate ? !bookedPiknikDates.includes(selectedDate) : false

  // Korak "Pogoji" je viden vedno (splošni pogoji veljajo tudi za "samo žar mojster").
  const visibleSteps = ALL_STEPS

  const selection: BookingSelection | null = useMemo(() => {
    if (!selectedDate) return null
    return {
      bookingDate: selectedDate,
      includesPiknik,
      includesZar,
      guestCount: typeof guestCount === 'number' ? guestCount : null,
      location: includesZar ? location : null,
      vegetarianMeals,
      veganMeals,
      sleepNights,
    }
  }, [selectedDate, includesPiknik, includesZar, guestCount, location, vegetarianMeals, veganMeals, sleepNights])

  const breakdown = useMemo(() => {
    if (!pricing || !selection) return null
    return computePriceBreakdown(selection, pricing)
  }, [pricing, selection])

  function goNext() {
    const idx = visibleSteps.indexOf(step)
    setStep(visibleSteps[Math.min(idx + 1, visibleSteps.length - 1)])
  }
  function goBack() {
    const idx = visibleSteps.indexOf(step)
    setStep(visibleSteps[Math.max(idx - 1, 0)])
  }

  const allRulesAccepted = pricing ? pricing.spaceRules.every((r) => acceptedRules[r.id]) : false

  async function submitBooking() {
    if (!selectedDate) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      // Izbrane postavke menija (žar mojster) in posebne želje gredo skupaj z opombami —
      // meni trenutno nima ločenega polja na strežniku (glej komentar pri MENU_CATEGORIES).
      const selectedMenuItems = Object.keys(menuSelections).filter((k) => menuSelections[k])
      const combinedNotes = [
        selectedMenuItems.length ? `Izbran meni: ${selectedMenuItems.join(', ')}.` : '',
        menuSpecialRequests ? `Posebne želje glede menija: ${menuSpecialRequests}` : '',
        meatNotes,
      ]
        .filter(Boolean)
        .join(' ')

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingDate: selectedDate,
          includesPiknik: baseIncludesPiknik,
          includesZar: baseIncludesZar,
          guestCount: typeof guestCount === 'number' ? guestCount : null,
          eventStartTime: eventStartTime || null,
          eventEndTime: eventEndTime || null,
          meatPreferences: { notes: combinedNotes },
          vegetarianMeals,
          veganMeals,
          location: includesZar ? location : null,
          upsell: { sleepNights, addZar, addPiknik },
          acceptedRuleIds: Object.keys(acceptedRules).filter((k) => acceptedRules[k]),
          entityType,
          customerName,
          customerEmail,
          customerPhone,
          companyName,
          companyVat,
          companyAddress,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? 'Napaka pri oddaji rezervacije.')
        setSubmitting(false)
        return
      }

      if (data.entityType === 'pravna') {
        router.push(`/rezervacija/potrditev?status=sent`)
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      router.push(`/rezervacija/potrditev?status=pending`)
    } catch {
      setSubmitError('Napaka pri povezavi s strežnikom. Poskusite znova.')
      setSubmitting(false)
    }
  }



  return { tip, step, setStep, pricing, setPricing, bookedPiknikDates, setBookedPiknikDates, loadError, setLoadError, selectedDate, setSelectedDate, guestCount, setGuestCount, eventStartTime, setEventStartTime, eventEndTime, setEventEndTime, meatNotes, setMeatNotes, vegetarianMeals, setVegetarianMeals, veganMeals, setVeganMeals, location, setLocation, menuSelections, setMenuSelections, menuSpecialRequests, setMenuSpecialRequests, acceptedRules, setAcceptedRules, acceptedTerms, setAcceptedTerms, addZar, setAddZar, addPiknik, setAddPiknik, sleepNights, setSleepNights, entityType, setEntityType, customerName, setCustomerName, customerEmail, setCustomerEmail, customerPhone, setCustomerPhone, companyName, setCompanyName, companyVat, setCompanyVat, companyAddress, setCompanyAddress, submitting, setSubmitting, submitError, setSubmitError, router, baseIncludesPiknik, baseIncludesZar, includesPiknik, includesZar, isPiknikOnly, isZarOnly, piknikFreeOnDate, visibleSteps, selection, breakdown, allRulesAccepted, goNext, goBack, submitBooking }
}
