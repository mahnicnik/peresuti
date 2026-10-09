import { getResend } from '@/lib/resend'
import { bookingDetailRows, bookingQuantities, formatDateSl, type Booking } from '@/lib/booking-details'
import { QUANTITIES_NOTE } from '@/lib/menu'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const wrap = (inner: string) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#2a1f17;font-size:14px;line-height:1.5;">${inner}</div>`

function adminUrl(b: Booking) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/admin?mesec=${b.booking_date.slice(0, 7)}&rezervacija=${b.id}`
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

async function send(to: string, subject: string, html: string) {
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL
  if (!resend || !from) return
  try {
    await resend.emails.send({ from, to, subject, html })
  } catch (e) {
    console.error('email send failed:', e)
  }
}

/** Obvestilo lastniku z vsemi podatki rezervacije in povezavo na admin koledar. */
export async function sendOwnerBookingEmail(b: Booking, kind: 'paid' | 'inquiry' | 'new') {
  const owner = process.env.OWNER_EMAIL
  if (!owner) return
  const heading = {
    paid: 'Nova plačana rezervacija',
    inquiry: 'Novo povpraševanje — čaka vašo potrditev',
    new: 'Nova rezervacija',
  }[kind]
  const who = b.company_name ?? b.customer_name
  const html = wrap(`
    <h1 style="font-size:20px;color:#3c2a1e;">${heading}</h1>
    ${kind === 'inquiry' ? `<p style="background:#fbecd0;padding:10px 12px;border-radius:6px;">Na ta dan imate že vsaj dva piknika. Rezervacija je oddana <strong>brez are</strong> — v koledarju jo potrdite ali zavrnite, stranka bo o tem obveščena po e-pošti.</p>` : ''}
    ${renderBookingDetailsHtml(b)}
    <p style="margin-top:20px;"><a href="${adminUrl(b)}" style="background:#8a2f1d;color:#fff8ef;padding:10px 16px;border-radius:999px;text-decoration:none;">Odpri v koledarju →</a></p>`)
  await send(owner, `${heading}: ${who} — ${b.booking_date}`, html)
}

/** Sporočila stranki pri pogojnem terminu žar mojstra. */
export async function sendCustomerZarStatusEmail(b: Booking, kind: 'inquiry' | 'confirmed' | 'rejected') {
  const date = formatDateSl(b.booking_date)
  const body = {
    inquiry: `<h1 style="font-size:20px;color:#3c2a1e;">Prejeli smo vaše povpraševanje</h1>
      <p>Hvala za rezervacijo žar mojstra za <strong>${esc(date)}</strong>. Na ta dan imamo že več piknikov, zato vaš termin še <strong>ni potrjen</strong> — preverimo razpored in vam potrditev pošljemo v najkrajšem možnem času.</p>
      <p>Are za ta termin ne zaračunamo.</p>`,
    confirmed: `<h1 style="font-size:20px;color:#3c2a1e;">Vaš termin je potrjen</h1>
      <p>Z veseljem potrjujemo žar mojstra za <strong>${esc(date)}</strong>${b.event_start_time ? ` (hrana pripravljena ob ${b.event_start_time.slice(0, 5)})` : ''}. Se vidimo!</p>`,
    rejected: `<h1 style="font-size:20px;color:#3c2a1e;">Žal termin ni na voljo</h1>
      <p>Žal vam za <strong>${esc(date)}</strong> žar mojstra ne moremo zagotoviti, ker je razpored za ta dan že poln. Če vam ustreza drug datum, nam odgovorite na to sporočilo ali pokličite na 040 832 040.</p>`,
  }[kind]
  const subject = {
    inquiry: `Povpraševanje prejeto — Perešuti (${b.booking_date})`,
    confirmed: `Termin potrjen — Perešuti (${b.booking_date})`,
    rejected: `Termin ni na voljo — Perešuti (${b.booking_date})`,
  }[kind]
  await send(b.customer_email, subject, wrap(`${body}<p style="color:#6b5d4f;font-size:13px;margin-top:24px;">Perešuti domače mesarstvo</p>`))
}
