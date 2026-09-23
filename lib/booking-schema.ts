import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const bookingRequestSchema = z
  .object({
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neveljaven datum'),
    includesPiknik: z.boolean(),
    includesZar: z.boolean(),

    // Število gostov in želeni čas začetka sta obvezna — brez njiju uporabnik ne more
    // naprej iz koraka "Nekaj podrobnosti" (enako je uveljavljeno v BookingWizard.tsx).
    guestCount: z.number().int().min(1).max(2000),
    meatPreferences: z.object({
      notes: z.string().max(2000).optional().default(''),
    }),
    vegetarianMeals: z.number().int().min(0).max(2000).default(0),
    veganMeals: z.number().int().min(0).max(2000).default(0),

    location: z.string().max(120).nullable(),

    eventStartTime: z.string().regex(timeRegex, 'Vnesite želeni čas začetka'),
    eventEndTime: z.string().regex(timeRegex, 'Neveljaven čas').nullable().optional().default(null),

    upsell: z.object({
      sleepNights: z.number().int().min(0).max(30).default(0),
      addZar: z.boolean().default(false), // cross-sell: piknik-only stranka doda žar
      addPiknik: z.boolean().default(false), // cross-sell: žar-only stranka doda piknik
    }),

    // Pravila piknik prostora so relevantna samo, če je piknik prostor del rezervacije
    // (osnovno ali kot dodatek v upsell koraku) — pri "samo žar mojster" jih ni treba sprejeti.
    acceptedRuleIds: z.array(z.string()).default([]),

    entityType: z.enum(['fizicna', 'pravna']),
    customerName: z.string().min(2).max(200),
    customerEmail: z.string().email(),
    customerPhone: z.string().max(50).optional().default(''),
    companyName: z.string().max(200).optional().default(''),
    companyVat: z.string().max(50).optional().default(''),
    companyAddress: z.string().max(300).optional().default(''),
  })
  .refine((v) => v.includesPiknik || v.includesZar || v.upsell.addZar || v.upsell.addPiknik, {
    message: 'Izberite vsaj piknik prostor ali žar mojstra',
  })
  .refine(
    (v) => !(v.includesPiknik || v.upsell.addPiknik) || v.acceptedRuleIds.length > 0,
    {
      message: 'Potrebno je sprejeti pravila prostora',
      path: ['acceptedRuleIds'],
    }
  )
  .refine((v) => v.entityType !== 'pravna' || v.companyName.length > 1, {
    message: 'Naziv podjetja je obvezen za pravne osebe',
    path: ['companyName'],
  })
  .refine((v) => v.entityType !== 'pravna' || v.companyVat.length > 1, {
    message: 'Davčna/ID št. je obvezna za pravne osebe',
    path: ['companyVat'],
  })

export type BookingRequest = z.infer<typeof bookingRequestSchema>
