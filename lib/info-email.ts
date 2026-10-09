import { createServerClient } from '@/lib/supabase/server'
import { emailLayout, esc, sendEmail } from '@/lib/email'
import { WINTER_MENU_ITEMS } from '@/lib/menu'
import {
  CLASSIC_OFFER,
  CLASSIC_OFFER_DETAILS,
  GENERAL_TERMS,
  PIKNIK_INFO,
  WEATHER_TERM_PIKNIK,
  WEATHER_TERM_ZAR,
} from '@/components/booking/constants'

type InfoOpts = { includesPiknik: boolean; includesZar: boolean; menuType?: string | null }

const list = (items: string[]) =>
  `<ul style="padding-left:18px;margin:8px 0;">${items.map((i) => `<li style="margin:4px 0;">${esc(i)}</li>`).join('')}</ul>`
const h2 = (t: string) => `<h2 style="font-size:16px;color:#3c2a1e;margin:24px 0 8px;">${t}</h2>`

/** Pogoji najema, oprema piknik prostora, lokacija, ponudba žar mojstra — kot HTML odseki. */
export async function renderInfoSectionsHtml(opts: InfoOpts): Promise<string> {
  let rules: string[] = []
  if (opts.includesPiknik) {
    try {
      const { data } = await createServerClient()
        .from('space_rules')
        .select('text')
        .eq('active', true)
        .order('sort_order')
      rules = (data ?? []).map((r) => r.text)
    } catch (e) {
      console.error('space_rules read failed:', e)
    }
  }
  const terms = [opts.includesPiknik ? WEATHER_TERM_PIKNIK : WEATHER_TERM_ZAR, ...GENERAL_TERMS]
  const zarMenu =
    opts.menuType === 'zimski'
      ? `<p><strong>Zimski meni:</strong></p>${list(WINTER_MENU_ITEMS)}`
      : `<p>${esc(CLASSIC_OFFER)}</p>`
  return `
    ${h2('Splošni pogoji najema')}${list(terms)}
    ${opts.includesPiknik ? `${h2('Piknik prostor Skaručna')}${PIKNIK_INFO.map((i) => `<p style="margin:6px 0;"><strong>${esc(i.title)}:</strong> ${esc(i.text)}</p>`).join('')}${rules.length ? `${h2('Pogoji najema piknik prostora')}${list(rules)}` : ''}` : ''}
    ${opts.includesZar ? `${h2('Žar mojster')}${zarMenu}${list(CLASSIC_OFFER_DETAILS)}` : ''}
    <p style="margin-top:24px;">Želimo, da se pri nas počutite udobno in da se zabavate brez skrbi.</p>`
}

/** Stranki pošlje pogoje najema, opremo, lokacijo ipd. (uporablja se pri naročilnici pravnih oseb). */
export async function sendBookingInfoEmail(opts: InfoOpts & { to: string; date: string }): Promise<void> {
  const sections = await renderInfoSectionsHtml(opts)
  await sendEmail({
    to: opts.to,
    subject: `Informacije o vaši rezervaciji — Perešuti (${opts.date})`,
    html: emailLayout(`
      <h1 style="font-size:20px;color:#3c2a1e;">Informacije o vaši rezervaciji</h1>
      <p>Spodaj so vse pomembne informacije za <strong>${esc(opts.date)}</strong>.</p>
      ${sections}`),
  })
}
