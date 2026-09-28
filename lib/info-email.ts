import { createServerClient } from '@/lib/supabase/server'
import { getResend } from '@/lib/resend'
import {
  CLASSIC_OFFER,
  CLASSIC_OFFER_DETAILS,
  GENERAL_TERMS,
  PIKNIK_INFO,
  WEATHER_TERM_PIKNIK,
  WEATHER_TERM_ZAR,
} from '@/components/booking/constants'

type InfoOpts = { to: string; date: string; includesPiknik: boolean; includesZar: boolean }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const list = (items: string[]) =>
  `<ul style="padding-left:18px;margin:8px 0;">${items.map((i) => `<li style="margin:4px 0;">${esc(i)}</li>`).join('')}</ul>`
const h2 = (t: string) => `<h2 style="font-size:16px;color:#3c2a1e;margin:24px 0 8px;">${t}</h2>`

/** Po zaključeni rezervaciji stranki pošlje pogoje najema, opremo, lokacijo ipd. Napake samo zabeleži. */
export async function sendBookingInfoEmail(opts: InfoOpts): Promise<void> {
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL
  if (!resend || !from) return

  try {
    let rules: string[] = []
    if (opts.includesPiknik) {
      const { data } = await createServerClient()
        .from('space_rules')
        .select('text')
        .eq('active', true)
        .order('sort_order')
      rules = (data ?? []).map((r) => r.text)
    }

    const terms = [opts.includesPiknik ? WEATHER_TERM_PIKNIK : WEATHER_TERM_ZAR, ...GENERAL_TERMS]
    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#2a1f17;font-size:14px;line-height:1.5;">
      <h1 style="font-size:20px;color:#3c2a1e;">Hvala za rezervacijo — Perešuti</h1>
      <p>Vaša rezervacija za <strong>${esc(opts.date)}</strong> je zaključena. Spodaj so vse pomembne informacije.</p>
      ${h2('Splošni pogoji najema')}${list(terms)}
      ${opts.includesPiknik ? `${h2('Piknik prostor Skaručna')}${PIKNIK_INFO.map((i) => `<p style="margin:6px 0;"><strong>${esc(i.title)}:</strong> ${esc(i.text)}</p>`).join('')}${h2('Pogoji najema piknik prostora')}${list(rules)}` : ''}
      ${opts.includesZar ? `${h2('Žar mojster')}<p>${esc(CLASSIC_OFFER)}</p>${list(CLASSIC_OFFER_DETAILS)}` : ''}
      <p style="margin-top:24px;">Želimo, da se pri nas počutite udobno in da se zabavate brez skrbi.</p>
      <p style="color:#6b5d4f;font-size:13px;">Perešuti domače mesarstvo</p>
    </div>`

    await resend.emails.send({ from, to: opts.to, subject: `Informacije o vaši rezervaciji — Perešuti (${opts.date})`, html })
  } catch (e) {
    console.error('sendBookingInfoEmail failed:', e)
  }
}
