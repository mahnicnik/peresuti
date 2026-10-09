// E-pošta lastniku (info@peresuti.si) — vsi podatki rezervacije + povezava na admin koledar.
import { bookingDetailRows, bookingQuantities, type Booking } from '@/lib/booking-details'
import { QUANTITIES_NOTE } from '@/lib/menu'
import { appUrl, emailButton, emailLayout, esc, sendEmail } from '@/lib/email'

export function adminBookingUrl(b: Booking) {
  return appUrl(`/admin?mesec=${b.booking_date.slice(0, 7)}&rezervacija=${b.id}`)
}

export function renderBookingDetailsHtml(b: Booking): string {
  const rows = bookingDetailRows(b)
    .map(
      (r) =>
        `<tr><td style="padding:3px 12px 3px 0;color:#6b5d4f;vertical-align:top;white-space:nowrap;">${esc(r.label)}</td><td style="padding:3px 0;">${esc(r.value)}</td></tr>`
    )
    .join('')
  const q = bookingQuantities(b)
  let qHtml = ''
  if (q?.kind === 'klasicni') {
    qHtml = `<h3 style="font-size:15px;margin:18px 0 6px;">Količine hrane (${b.guest_count} oseb)</h3><table style="border-collapse:collapse;">${q.quantities
      .map((x) => `<tr><td style="padding:2px 12px 2px 0;text-align:right;font-weight:bold;">${esc(x.text)}</td><td>${esc(x.label)}</td></tr>`)
      .join('')}</table><p style="color:#6b5d4f;font-size:12px;">${esc(QUANTITIES_NOTE)}</p>`
  } else if (q?.kind === 'zimski') {
    qHtml = `<h3 style="font-size:15px;margin:18px 0 6px;">Zimski meni (${b.guest_count} oseb)</h3><ul style="padding-left:18px;margin:4px 0;">${q.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
  }
  return `<table style="border-collapse:collapse;">${rows}</table>${qHtml}`
}

type OwnerKind = 'paid' | 'inquiry' | 'new' | 'balance_paid' | 'unpaid_pending'

const HEADINGS: Record<OwnerKind, string> = {
  paid: 'Nova plačana rezervacija',
  inquiry: 'Novo povpraševanje — čaka vašo potrditev',
  new: 'Nova rezervacija',
  balance_paid: 'Plačan ostanek rezervacije',
  unpaid_pending: 'Nova rezervacija — spletno plačilo ni nastavljeno',
}

/** Obvestilo lastniku z vsemi podatki rezervacije in povezavo na admin koledar. */
export async function sendOwnerBookingEmail(b: Booking, kind: OwnerKind, extra?: { amount?: number }) {
  const owner = process.env.OWNER_EMAIL
  if (!owner) return
  const heading = HEADINGS[kind]
  const who = b.company_name ?? b.customer_name
  const note =
    kind === 'inquiry'
      ? `<p style="background:#fbecd0;padding:10px 12px;border-radius:6px;">Na ta dan imate že vsaj dva piknika. Rezervacija je oddana <strong>brez are</strong> — v koledarju jo potrdite ali zavrnite, stranka bo o tem obveščena po e-pošti.</p>`
      : kind === 'balance_paid' && extra?.amount
        ? `<p style="background:#e5eedf;padding:10px 12px;border-radius:6px;">Stranka je na spletu plačala <strong>${extra.amount.toFixed(2)} €</strong>.</p>`
        : kind === 'unpaid_pending'
          ? `<p style="background:#fbecd0;padding:10px 12px;border-radius:6px;">Spletno plačilo (Stripe) še ni nastavljeno, zato stranka ni plačala — dogovorite se za plačilo.</p>`
          : ''
  await sendEmail({
    to: owner,
    subject: `${heading}: ${who} — ${b.booking_date}`,
    // odgovor gre neposredno stranki
    replyTo: b.customer_email,
    html: emailLayout(`
      <h1 style="font-size:20px;color:#3c2a1e;">${heading}</h1>
      ${note}
      ${renderBookingDetailsHtml(b)}
      ${emailButton(adminBookingUrl(b), 'Odpri v koledarju →')}`),
  })
}

/** Vprašanje s spletne strani (Perešutko) — lastniku, odgovor gre neposredno pošiljatelju. */
export async function sendOwnerContactEmail(opts: { name: string; email: string; phone?: string; message: string }) {
  const owner = process.env.OWNER_EMAIL
  if (!owner) return false
  return sendEmail({
    to: owner,
    replyTo: opts.email,
    subject: `Vprašanje s strani rezervacij — ${opts.name}`,
    html: emailLayout(`
      <h1 style="font-size:20px;color:#3c2a1e;">Novo vprašanje</h1>
      <p><strong>${esc(opts.name)}</strong> · ${esc(opts.email)}${opts.phone ? ` · ${esc(opts.phone)}` : ''}</p>
      <p style="white-space:pre-wrap;background:#f2ead9;padding:12px;border-radius:6px;">${esc(opts.message)}</p>
      <p style="color:#6b5d4f;font-size:13px;">Za odgovor samo kliknite »Odgovori«.</p>`),
  })
}
