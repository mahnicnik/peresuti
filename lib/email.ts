// Enotno pošiljanje e-pošte prek Resend. Napake samo zabeležimo — e-pošta nikoli ne sme
// podreti rezervacije ali plačila.
import { getResend } from '@/lib/resend'

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const PHONE = '040 832 040'

export function emailLayout(inner: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#2a1f17;font-size:14px;line-height:1.5;">
    ${inner}
    <p style="color:#6b5d4f;font-size:13px;margin-top:28px;border-top:1px solid #e4d9c4;padding-top:12px;">
      Perešuti domače mesarstvo · ${PHONE}<br/>Na to sporočilo lahko preprosto odgovorite.
    </p>
  </div>`
}

export function emailButton(href: string, label: string): string {
  return `<p style="margin:20px 0;"><a href="${esc(href)}" style="background:#8a2e1f;color:#fff8ef;padding:11px 18px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block;">${esc(label)}</a></p>`
}

export function appUrl(path = ''): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}${path}`
}

export function emailConfigured(): boolean {
  return !!(getResend() && process.env.RESEND_FROM_EMAIL)
}

export async function sendEmail(opts: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}): Promise<boolean> {
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL
  if (!resend || !from) {
    console.warn('E-pošta ni poslana (Resend ni nastavljen):', opts.subject)
    return false
  }
  try {
    const { error } = await resend.emails.send({
      from: `Perešuti <${from}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      // odgovori strank gredo na naš naslov
      replyTo: opts.replyTo ?? process.env.OWNER_EMAIL ?? undefined,
    })
    if (error) {
      console.error('Resend error:', opts.subject, error)
      return false
    }
    return true
  } catch (e) {
    console.error('Resend exception:', opts.subject, e)
    return false
  }
}
