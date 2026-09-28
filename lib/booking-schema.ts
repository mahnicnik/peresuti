import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const bookingRequestSchema = z
  .object({
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neveljaven datum'),
    includesPiknik: z.boolean(),
    includesZar: z.boolean(),

    // Število gostov je vedno obvezno; pri žar mojstru še ura, ko mora biti hrana pripravljena.
    guestCount: z.number().int().min(1).max(2000),
    meatPreferences: z.object({
      notes: z.string().max(2000).optional().default(''),
    }),
    vegetarianMeals: z.number().int().min(0).max(2000).default(0),
    veganMeals: z.number().int().min(0).max(2000).default(0),

    // Poštna številka lokacije dogodka (samo žar mojster izven piknik prostora)
    location: z.string().regex(/^\d{4}$/, 'Neveljavna poštna številka').nullable(),

    // Ura, ko mora biti hrana pripravljena (samo žar mojster) — shrani se v event_start_time
    foodReadyTime: z.string().regex(timeRegex, 'Vnesite uro, ko želite imeti pripravljeno hrano').nullable().default(null),
    menuType: z.enum(['poletni', 'zimski']).default('poletni'),

    upsell: z.object({
      sleepNights: z.number().int().min(0).max(30).default(0),
      addZar: z.boolean().default(false), // cross-sell: piknik-only stranka doda žar
      addPiknik: z.boolean().default(false), // cross-sell: žar-only stranka doda piknik
      extras: z.array(z.enum(['odvoz_smeti', 'ciscenje'])).default([]),
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
  .refine((v) => !(v.includesZar || v.upsell.addZar) || !!v.foodReadyTime, {
    message: 'Vnesite uro, ko želite imeti pripravljeno hrano',
    path: ['foodReadyTime'],
  })
  .refine((v) => v.vegetarianMeals + v.veganMeals <= v.guestCount, {
    message: 'Vegetarijanskih in veganskih obrokov je lahko največ toliko kot gostov',
    path: ['vegetarianMeals'],
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
