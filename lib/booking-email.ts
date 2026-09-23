import type { Database } from '@/lib/database.types'
import type { PriceLine } from '@/lib/pricing'

type Booking = Database['public']['Tables']['bookings']['Row']

export function renderNarocilnicaHtml(booking: Booking, lines: PriceLine[]): string {
  const rows = lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 0;color:#3c2a1e;">${escapeHtml(l.label)}</td><td style="padding:4px 0;text-align:right;color:#3c2a1e;">${l.amount.toFixed(2)} €</td></tr>`
    )
    .join('')

  const meatNotes = (booking.meat_preferences as { notes?: string } | null)?.notes ?? ''

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#2a1f17;">
    <h1 style="font-size:20px;color:#3c2a1e;">Naročilnica — Perešuti domače mesarstvo</h1>
    <p>Prejeli smo novo povpraševanje/naročilo za najem:</p>
    <ul>
      ${booking.includes_piknik ? '<li>Piknik prostor Skaručna</li>' : ''}
      ${booking.includes_zar ? '<li>Najem žar mojstra</li>' : ''}
    </ul>
    <p><strong>Datum:</strong> ${booking.booking_date}</p>
    ${booking.event_start_time ? `<p><strong>Želeni čas:</strong> ${booking.event_start_time.slice(0, 5)}${booking.event_end_time ? ` – ${booking.event_end_time.slice(0, 5)}` : ''}</p>` : ''}
    ${booking.guest_count ? `<p><strong>Število gostov:</strong> ${booking.guest_count}</p>` : ''}
    ${meatNotes ? `<p><strong>Opombe / želje glede hrane:</strong> ${escapeHtml(meatNotes)}</p>` : ''}

    <table style="width:100%;border-collapse:collapse;margin-top:16px;border-top:1px solid #e4d9c4;padding-top:8px;">
      ${rows}
      <tr><td style="padding-top:8px;font-weight:bold;">Skupaj</td><td style="padding-top:8px;font-weight:bold;text-align:right;">${(booking.price_total ?? 0).toFixed(2)} €</td></tr>
    </table>

    <h2 style="font-size:16px;margin-top:24px;">Podatki naročnika</h2>
    <p>
      ${booking.entity_type === 'pravna' ? 'Pravna oseba' : 'Fizična oseba'}<br/>
      ${booking.company_name ? `${escapeHtml(booking.company_name)}<br/>` : ''}
      ${booking.company_vat ? `ID za DDV / davčna št.: ${escapeHtml(booking.company_vat)}<br/>` : ''}
      ${booking.company_address ? `${escapeHtml(booking.company_address)}<br/>` : ''}
      Kontaktna oseba: ${escapeHtml(booking.customer_name)}<br/>
      Email: ${escapeHtml(booking.customer_email)}<br/>
      ${booking.customer_phone ? `Telefon: ${escapeHtml(booking.customer_phone)}<br/>` : ''}
    </p>

    <p style="margin-top:24px;color:#6b5d4f;font-size:13px;">
      To je avtomatsko generirana naročilnica iz rezervacijskega sistema na peresuti.si.
      Rezervacija ID: ${booking.id}
    </p>
  </div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
