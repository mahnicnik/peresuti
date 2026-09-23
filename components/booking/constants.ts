import type { PricingReferenceData } from '@/lib/pricing'

export type SpaceRule = { id: string; text: string; sort_order: number }
export type PricingApiResponse = PricingReferenceData & { spaceRules: SpaceRule[] }

// Korak "Pogoji" je viden vedno (ne samo pri piknik prostoru), ker splošni pogoji najema
// (vreme, stornacija) veljajo tudi za "samo žar mojster" — pravila piknik prostora znotraj
// tega koraka pa se prikažejo samo, če je piknik prostor del rezervacije.
export type Step = 'calendar' | 'questionnaire' | 'upsell' | 'rules' | 'customer'
export const ALL_STEPS: Step[] = ['calendar', 'questionnaire', 'upsell', 'rules', 'customer']
export const STEP_LABELS: Record<Step, string> = {
  calendar: 'Datum',
  questionnaire: 'Podrobnosti',
  upsell: 'Dodatna ponudba',
  rules: 'Pogoji',
  customer: 'Podatki & potrditev',
}

// Splošni pogoji najema — veljajo za piknik prostor IN žar mojstra.
export const GENERAL_TERMS: string[] = [
  'V primeru zelo slabega vremena se najde najboljši možen naslednji datum.',
  'Stornacija termina najkasneje 7 dni pred terminom — kasnejša vračila niso možna.',
]

// Meni žar mojstra — trenutno samo za izbiro/izgled (klik po kategorijah); polna ponudba
// s cenami in končno logiko bo dodana kasneje. Izbrane postavke gredo v opombe rezervacije.
export const MENU_CATEGORIES: { key: string; label: string; items: string[] }[] = [
  {
    key: 'meso',
    label: 'Meso',
    items: [
      'Mešano meso (klobase, pleskavice, vratovina, ražnjiči)',
      'Puranje meso',
      'Jagnjetina',
      'Vegetarijanska alternativa',
    ],
  },
  {
    key: 'priloga',
    label: 'Priloge',
    items: ['Krompir po domače', 'Mešana solata', 'Zelje', 'Pečena sezonska zelenjava', 'Kruh'],
  },
  {
    key: 'sladica',
    label: 'Sladice',
    items: ['Palačinke', 'Sadna kupa', 'Domača peciva'],
  },
]
