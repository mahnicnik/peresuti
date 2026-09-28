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
export const WEATHER_TERM_ZAR =
  'V primeru zelo slabega vremena vam lahko ponudimo drug termin, običajno med tednom oziroma ko imamo prost termin.'
export const WEATHER_TERM_PIKNIK =
  'V primeru slabega vremena: prostor ima možnost ogrevanja in zaprtja stranic, zato odpoved žal ni mogoča — po dogovoru pa vam lahko ponudimo drug termin, običajno med tednom oziroma ko imamo prost termin.'
export const GENERAL_TERMS: string[] = [
  'Stornacija termina najkasneje 7 dni pred terminom — kasnejša vračila niso možna.',
]

// Klasična ponudba žar mojstra (besedilo s strani naročnika, prikazano v vprašalniku).
export const CLASSIC_OFFER = `Naša klasična ponudba vsebuje več vrst mesa na žaru (čevapčiči, vratovina, piščanec na žaru, carsko meso, žar klobase, ražnjiči), šopsko in paradižnikovo solato z mocarelo, pečen krompirček, pohanega piščanca in cvetačo, sezonsko zelenjavo na žaru, šampinjone na žaru, sir za žar, porcijske omake (kečap, majoneza, zenf, tatarska), lepinje, pribor in krožnike.`

export const CLASSIC_OFFER_DETAILS: string[] = [
  'V ponudbi je vključena vsa oprema: servirne mize, servirni pribor, grelni šefingi, rezerva mesa (sporočiti morate ob pričetku peke), peč na oglje, po potrebi šotor za peko, električni podaljški in friteza.',
  'Ob večjem številu oseb, kot je bilo predhodno dogovorjeno, žal ne moremo zagotoviti dovolj hrane za vse, zato prosimo za čim bolj točen podatek — lahko pa s seboj prinesemo rezervo.',
  'Cenik velja za lokacije, oddaljene do 30 km od našega sedeža podjetja, sicer se zaračuna še kilometrina 1 € na km.',
  'Postavitev, peka in pospravljanje običajno trajajo 2 uri: na prostor pridemo cca 60–90 minut preden želite imeti hrano pripravljeno in končamo običajno 30 minut po pričetku hrane. Priporočamo, da je hrana pripravljena 1 uro po pričetku dogodka. Na samem dogodku žal ne moremo spreminjati želenega časa priprave, saj imamo dnevno več piknikov.',
  'Za pripravo hrane potrebujemo enofazni električni priključek 3,5 kW, tekočo vodo in parkirišče v bližini mesta, kjer bo kuhar (do 30 m). V nasprotnem primeru nam to sporočite in vse pripravimo sami (baterija, zalogovnik vode, dodatna pomoč pri nošenju opreme), sicer ne moremo pripraviti vseh jedi.',
  'Po peki lahko pri vas pustimo grelne posode, v katerih ostane hrana topla še nekaj ur. Posodo lahko vrnete vsako soboto na tržnico Medvode, Jesenice, Lesce, na naš piknik prostor Skaručna (5 minut iz Ljubljane-Trzin) ali po dogovoru. Če je peka na našem piknik prostoru, posode samo pustite in jih odpeljemo mi.',
]

// Informacije o piknik prostoru (prikazano v koraku izbire datuma).
export const PIKNIK_INFO: { title: string; text: string }[] = [
  { title: 'Najem', text: 'Najem prostora je od 10.00 zjutraj do 9.00 naslednjega dne. V najem ni vključen odvoz smeti.' },
  { title: 'Oprema', text: 'Tekoča voda (ni pitna), elektrika, ločen prostor z WC-jem, prostor za kuhinjo s plinskim žarom (plin vključen) in žarom na oglje (oglje ni vključeno), igrišče za mali nogomet, odbojka na pesku, 2 hladilnika, skrinja in sedišča za 70 oseb.' },
  { title: 'Hlajenje', text: 'Hladilnika in skrinja so prižgani in ohlajeni že pred vašim prihodom. Ob visokih temperaturah se poln hladilnik pijače hladi več ur, zato predlagamo uporabo skrinje.' },
  { title: 'Prostor za spanje', text: '2 sobi in WC s tušem (1. soba: 2 postelji 200×160 cm; 2. soba: postelja 200×160 cm in raztegljiv kavč). Oddaja se samo v kompletu za 90 € na noč, vključeni so 3 kompleti posteljnine. Sobe lahko rezervirate tudi šele na dan zabave — takrat vam sporočimo kodo za ključe, plačilo pa oddate v gotovini v nabiralnik desno od vrat v kuhinjo.' },
  { title: 'Lokacija', text: 'V bližini vasi Skaručna. V Google Maps (ali drug program) vpišite »Piknik prostor Skaručna« in navigacija vas pripelje natančno do lokacije.' },
  { title: 'Luči', text: 'Navodila za prižig luči so obešena na tabli ob hladilniku.' },
  { title: 'Parkirišče', text: 'Parkirišč je veliko — prosimo, parkirajte znotraj rdeče obarvanih predelov na zemljevidu.' },
]
