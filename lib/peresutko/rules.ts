// Perešutko — pravilih temelječ pomočnik (odločitveno drevo, brez LLM-ja).
// Vsako vozlišče je sporočilo bota + seznam gumbov, ki vodijo v naslednje vozlišče.
// Ko boste imeli pripravljeno resnično bazo znanja (cenik, FAQ, sezonska ponudba), je
// najlažje razširiti/popraviti prek tega drevesa — brez API klica ali stroška na sporočilo.

export type PeresutkoNode = {
  id: string
  bot: string[] // eno ali več sporočil zaporedoma
  options?: { label: string; next: string }[]
  final?: boolean
}

const BACK: { label: string; next: string } = { label: '← Nazaj', next: 'guests_start' }
const BACK_SPACE: { label: string; next: string } = { label: '← Nazaj', next: 'space_faq' }
const BACK_ZAR: { label: string; next: string } = { label: '← Nazaj', next: 'zar_faq' }
const ROOT_OPT: { label: string; next: string } = { label: '← Nazaj na začetek', next: 'root' }

export const PERESUTKO_TREE: Record<string, PeresutkoNode> = {
  root: {
    id: 'root',
    bot: [
      'Pozdravljeni, sem Perešutko 🐷 Pomagam vam izračunati količino hrane, razložim pravila prostora ali odgovorim na pogosta vprašanja o najemu.',
      'Pri čem lahko pomagam?',
    ],
    options: [
      { label: 'Koliko hrane naročiti glede na št. gostov?', next: 'guests_start' },
      { label: 'Vprašanja o piknik prostoru', next: 'space_faq' },
      { label: 'Vprašanja o žar mojstru', next: 'zar_faq' },
      { label: 'Vegetarijanci / vegani / alergije', next: 'diet' },
      { label: 'Želim govoriti s človekom', next: 'contact' },
    ],
  },

  guests_start: {
    id: 'guests_start',
    bot: ['Koliko gostov približno pričakujete?'],
    options: [
      { label: 'Do 20', next: 'guests_20' },
      { label: '20–30', next: 'guests_30' },
      { label: '30–40', next: 'guests_40' },
      { label: '40–50', next: 'guests_50' },
      { label: '50–60', next: 'guests_60' },
      { label: 'Več kot 60', next: 'guests_60plus' },
    ],
  },
  guests_20: { id: 'guests_20', bot: [guestAnswer(20)], final: true, options: [BACK] },
  guests_30: { id: 'guests_30', bot: [guestAnswer(25)], final: true, options: [BACK] },
  guests_40: { id: 'guests_40', bot: [guestAnswer(35)], final: true, options: [BACK] },
  guests_50: { id: 'guests_50', bot: [guestAnswer(45)], final: true, options: [BACK] },
  guests_60: { id: 'guests_60', bot: [guestAnswer(55)], final: true, options: [BACK] },
  guests_60plus: { id: 'guests_60plus', bot: [guestAnswer(70)], final: true, options: [BACK] },

  space_faq: {
    id: 'space_faq',
    bot: ['Kaj vas zanima o piknik prostoru v Skaručni?'],
    options: [
      { label: 'Koliko gostov sprejme prostor?', next: 'space_capacity' },
      { label: 'Kaj je vključeno (voda, elektrika, WC...)?', next: 'space_amenities' },
      { label: 'Ali lahko prespimo?', next: 'space_sleep' },
      { label: 'Kdaj se prostor sprosti / odda?', next: 'space_hours' },
      { label: 'Nazaj na začetek', next: 'root' },
    ],
  },
  space_capacity: {
    id: 'space_capacity',
    bot: ['Pokrit piknik prostor sprejme do 250 oseb (sedišč je za 70 oseb). Na voljo so tudi otroška igrala, mini nogometno in odbojkarsko igrišče.'],
    final: true,
    options: [BACK_SPACE],
  },
  space_amenities: {
    id: 'space_amenities',
    bot: [
      'Na prostoru imate tekočo vodo (POZOR: ni pitna), elektriko in WC. Za peko lahko najamete tudi našega žar mojstra.',
    ],
    final: true,
    options: [BACK_SPACE],
  },
  space_sleep: {
    id: 'space_sleep',
    bot: [
      'Da — na voljo je prenočišče za do 6 oseb (3 postelje 160×200 + raztegljivi kavč) za doplačilo 90 € na noč.',
    ],
    final: true,
    options: [BACK_SPACE],
  },
  space_hours: {
    id: 'space_hours',
    bot: ['Najem prostora velja od 10.00 zjutraj do 9.00 naslednjega dne.'],
    final: true,
    options: [BACK_SPACE],
  },

  zar_faq: {
    id: 'zar_faq',
    bot: ['Kaj vas zanima o najemu žar mojstra?'],
    options: [
      { label: 'Kaj je vključeno v ponudbo?', next: 'zar_included' },
      { label: 'Kaj če bo slabo vreme?', next: 'zar_weather' },
      { label: 'Koliko časa traja postavitev?', next: 'zar_timing' },
      { label: 'Nazaj na začetek', next: 'root' },
    ],
  },
  zar_included: {
    id: 'zar_included',
    bot: [
      'Na oglju spečemo mešano meso lastne izdelave, poskrbimo za solate, pečeno sezonsko zelenjavo, krompirček, kruh, omake ter leseni pribor in krožnike. Prinesemo tudi servirne mize, prte, grelne šefinge in šotor za peko.',
    ],
    final: true,
    options: [BACK_ZAR],
  },
  zar_weather: {
    id: 'zar_weather',
    bot: ['V primeru dežja nas rešuje velik šotor, pod katerim lahko pečemo v vseh pogojih.'],
    final: true,
    options: [BACK_ZAR],
  },
  zar_timing: {
    id: 'zar_timing',
    bot: [
      'Na prostor pridemo med 60 in 90 minut, preden želite imeti hrano pripravljeno, in končamo približno 30 minut po dogovorjenem času. Postavitev, peka in pospravljanje skupaj trajajo cca. 2 uri.',
    ],
    final: true,
    options: [BACK_ZAR],
  },

  diet: {
    id: 'diet',
    bot: [
      'Poskrbimo tudi za vegetarijanske in veganske goste — vsak tak obrok je po 0,50 € na osebo, izberete pa jih ob rezervaciji v vprašalniku.',
      'Za posebne alergije ali želje nam pustite opombo pri rezervaciji — po povpraševanju se dogovorimo za prilagojeno ponudbo.',
    ],
    final: true,
    options: [ROOT_OPT],
  },

  contact: {
    id: 'contact',
    bot: [
      'Seveda! Pokličite nas na 040 – 832 – 040 ali nam pišite prek kontaktnega obrazca na peresuti.si.',
    ],
    final: true,
    options: [ROOT_OPT],
  },
}

// --- Prosto besedilo (vnos v polje "Vprašaj karkoli") ---
// Perešutko ostaja brez LLM-ja: namesto pravega razumevanja jezika uporabimo
// preprosto iskanje ključnih besed, ki uporabnika preusmeri na najbližje
// ustrezno vozlišče v drevesu zgoraj. Če ni zadetka, se prikaže prijazen
// odgovor s ponudbo, naj izbere med gumbi ali pokliče.

export const PERESUTKO_FALLBACK_TEXT =
  'Tega še ne znam odgovoriti samodejno. Izberite eno od spodnjih možnosti, ali pa nas pokličite na 040 – 832 – 040.'

type KeywordRule = { pattern: RegExp; nodeId: string }

const KEYWORD_RULES: KeywordRule[] = [
  { pattern: /kapacitet|koliko oseb.*sprejme|koliko ljudi.*sprejme|koliko gostov.*sprejme/i, nodeId: 'space_capacity' },
  { pattern: /elektrik|pitn|wc|straniš|kaj.*vključeno.*prostor/i, nodeId: 'space_amenities' },
  { pattern: /prenoč|prespat|spati|nočit/i, nodeId: 'space_sleep' },
  { pattern: /kdaj.*prost.*odda|urnik|ob kateri uri|od.*do.*ure/i, nodeId: 'space_hours' },
  { pattern: /kaj.*vključeno.*žar|kaj prinesete|kaj pripravite.*žar/i, nodeId: 'zar_included' },
  { pattern: /dež|slabo vreme|šotor/i, nodeId: 'zar_weather' },
  { pattern: /kdaj pridete|postavitev|koliko časa.*žar|koliko traja/i, nodeId: 'zar_timing' },
  { pattern: /vegan|vegetarij|alergij/i, nodeId: 'diet' },
  { pattern: /pokliči|telefon|kontakt|človek|pogovor.*oseb/i, nodeId: 'contact' },
  { pattern: /žar\s*mojst|najem žara|žar\b/i, nodeId: 'zar_faq' },
  { pattern: /piknik\s*prostor|skaručn|piknik\b/i, nodeId: 'space_faq' },
]

export type FreeTextResult = { nodeId: string; botOverride?: string[] }

export function matchFreeText(raw: string): FreeTextResult | null {
  const text = raw.trim()
  if (!text) return null

  // Vprašanja o količini hrane za določeno št. gostov ("50 gostov", "za 30 ljudi", "koliko hrane za 40")
  const numMatch = text.match(/(\d{1,4})/)
  if (numMatch && /gost|oseb|ljud|hran|meso/i.test(text)) {
    const n = Math.min(1000, Math.max(1, parseInt(numMatch[1], 10)))
    return { nodeId: 'guests_start', botOverride: [guestAnswer(n)] }
  }
  if (/koliko.*hran|koliko.*meso|hrano naročiti/i.test(text)) {
    return { nodeId: 'guests_start' }
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text)) return { nodeId: rule.nodeId }
  }
  return null
}

function guestAnswer(mid: number): string {
  const meat = Math.round(mid * 300)
  const salad = Math.round(mid * 100)
  const potato = Math.round(mid * 100)
  const veg = Math.round(mid * 150)
  return `Klasična ponudba po osebi: 300 g mesa za žar, 100 g solat, 100 g krompirčka in 150 g pečene zelenjave — plus kruh in leseni pribor. Za približno ${mid} gostov to pomeni okoli ${(meat / 1000).toFixed(1)} kg mesa, ${(salad / 1000).toFixed(1)} kg solat, ${(potato / 1000).toFixed(1)} kg krompirčka in ${(veg / 1000).toFixed(1)} kg pečene zelenjave. Točno število gostov in morebitne vegetarijanske/veganske obroke vnesete v vprašalniku ob rezervaciji — ponudbo pripravimo po meri.`
}
