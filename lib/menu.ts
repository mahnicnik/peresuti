// Meniji žar mojstra in priporočene količine hrane.
// Količine na osebo so prepisane iz naročnikove Excel ponudbe ("Najem žar mojstra ponudba.xlsx").

export type QuantityItem = { label: string; perPerson: number; unit: 'kg' | 'kos' }

/** Klasična žar ponudba — priporočene količine na osebo (mešana družba). */
export const CLASSIC_QUANTITIES: QuantityItem[] = [
  { label: 'Meso na žaru', perPerson: 0.27, unit: 'kg' },
  { label: 'Pohan piščanec', perPerson: 0.07, unit: 'kg' },
  { label: 'Pohana cvetača', perPerson: 0.028, unit: 'kg' },
  { label: 'Sir za žar', perPerson: 0.03, unit: 'kg' },
  { label: 'Krompirček', perPerson: 0.1, unit: 'kg' },
  { label: 'Sezonska zelenjava (sveža)', perPerson: 0.1, unit: 'kg' },
  { label: 'Šampinjoni', perPerson: 0.04, unit: 'kg' },
  { label: 'Solate', perPerson: 0.12, unit: 'kg' },
  { label: 'Male lepinje (50 g)', perPerson: 1, unit: 'kos' },
  { label: 'Kompleti krožnikov in pribora', perPerson: 1.2, unit: 'kos' },
  { label: 'Posamično pakirane omake', perPerson: 1, unit: 'kos' },
]

export const QUANTITIES_NOTE =
  'Priporočene količine so za mešano družbo — po želji lahko dodamo tudi večje količine (več moških ipd.).'

export type ComputedQuantity = { label: string; amount: number; unit: 'kg' | 'kos'; text: string }

/** Izračuna količine za dano število oseb (enako kot Excel: osebe × količina na osebo). */
export function computeQuantities(guests: number, items: QuantityItem[] = CLASSIC_QUANTITIES): ComputedQuantity[] {
  if (!guests || guests < 1) return []
  return items.map((i) => {
    const raw = guests * i.perPerson
    const amount = i.unit === 'kos' ? Math.ceil(raw - 1e-9) : Math.round(raw * 100) / 100
    const text = `${amount.toLocaleString('sl-SI', { maximumFractionDigits: 2 })} ${i.unit}`
    return { label: i.label, amount, unit: i.unit, text }
  })
}

/** Zimski meni (1. 10. – 30. 4., doplačilo 2 € na osebo). */
export const WINTER_MENU_ITEMS: string[] = [
  'Pečen krompirček',
  'Idrijski žlikrofi (veganski)',
  'Sladko in kislo zelje',
  'Mleta pečenka',
  'Pohan piščanec',
  'Pečenice in krvavice (po izbiri)',
  'Eggplant parmigiana in sir za žar oziroma ocvrta cvetača',
  'Solata',
  'Kruh',
]

export function menuLabel(menuType: string | null | undefined): string {
  return menuType === 'zimski' ? 'Zimski meni' : 'Klasična žar ponudba'
}

/** Piknik prostor je lahko jeseni, pozimi in spomladi po želji zaprt in ogrevan (ne poleti: jun–avg). */
export function isHeatingSeason(dateStr: string): boolean {
  const m = Number(dateStr.slice(5, 7))
  return m < 6 || m > 8
}
