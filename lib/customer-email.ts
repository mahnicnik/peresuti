// E-pošta strankam — potrdila, plačila, potrditve žar mojstra, preklici.
import { bookingMeat, bookingUpsell, formatDateSl, serviceLabel, type Booking } from '@/lib/booking-details'
import { menuLabel } from '@/lib/menu'
import { appUrl, emailButton, emailLayout, esc, PHONE, sendEmail } from '@/lib/email'
import { renderInfoSectionsHtml } from '@/lib/info-email'
import { amountDue } from '@/lib/payments-shared'

const eur = (n: number) => `${n.toFixed(2).replace('.', ',')} €`
const h1 = (t: string) => `<h1 style="font-size:20px;color:#3c2a1e;">${t}</h1>`

/** Povzetek rezervacije za stranko (brez internih podatkov). */
export function customerSummaryHtml(b: Booking): string {
  const u = bookingUpsell(b)
  const m = bookingMeat(b)
  const rows: [string, string | null | undefined][] = [
    ['Storitev', serviceLabel(b)],
    ['Datum', formatDateSl(b.booking_date)],
    ['Hrana pripravljena ob', b.includes_zar ? b.event_start_time?.slice(0, 5) : null],
    ['Število oseb', b.guest_count ? String(b.guest_count) : null],
    ['Meni', b.includes_zar ? menuLabel(m.menuType) : null],
    ['Lokacija', b.includes_zar ? (b.location ?? (b.includes_piknik ? 'Piknik prostor Skaručna' : null)) : null],
    ['Prenočišče', b.includes_piknik && u.sleepNights ? '1 noč' : null],
    ['Prostor', b.includes_piknik && u.heatedSpace ? 'Zaprt in ogrevan' : null],
    ['Skupaj', b.price_total != null ? `${eur(b.price_total)} (DDV ${b.includes_zar ? '9,5' : '22'} % vključen)` : null],
    ['Plačano', b.amount_paid > 0 ? eur(b.amount_paid) : null],
    ['Še za plačilo', amountDue(b) > 0 && b.entity_type === 'fizicna' ? eur(amountDue(b)) : null],
  ]
  return `<table style="border-collapse:collapse;margin:12px 0;">${rows
    .filter(([, v]) => v)
    .map(
      ([l, v]) =>
        `<tr><td style="padding:3px 14px 3px 0;color:#6b5d4f;vertical-align:top;">${esc(l)}</td><td style="padding:3px 0;">${esc(v!)}</td></tr>`
    )
    .join('')}</table>`
}

async function infoFor(b: Booking) {
  return renderInfoSectionsHtml({
    includesPiknik: b.includes_piknik,
    includesZar: b.includes_zar,
    menuType: bookingMeat(b).menuType,
  })
}

/** Po uspešnem spletnem plačilu ob rezervaciji: potrdilo + vse informacije. */
export async function sendCustomerBookingConfirmed(b: Booking) {
  const pending = b.zar_confirmation === 'pending'
  const due = amountDue(b)
  await sendEmail({
    to: b.customer_email,
    subject: `Rezervacija potrjena — Perešuti (${b.booking_date})`,
    html: emailLayout(`
      ${h1('Hvala — vaša rezervacija je potrjena')}
      <p>Prejeli smo vaše plačilo. Spodaj je povzetek rezervacije in vse pomembne informacije.</p>
      ${customerSummaryHtml(b)}
      ${pending ? `<p style="background:#fbecd0;padding:10px 12px;border-radius:6px;">Žar mojster je na ta dan <strong>pogojno prost</strong> — potrditev vam pošljemo po e-pošti v najkrajšem možnem času.</p>` : ''}
      ${due > 0 ? `<p>Ostanek <strong>${eur(due)}</strong> plačate kasneje — pred dogodkom vam pošljemo povezavo za spletno plačilo (lahko pa tudi po dogovoru).</p>` : ''}
      ${await infoFor(b)}`),
  })
}

/** Povezava za plačilo (ostanek ali celotni znesek), ki jo pošlje lastnik iz koledarja. */
export async function sendCustomerPaymentRequest(b: Booking) {
  const due = amountDue(b)
  if (due <= 0) return false
  return sendEmail({
    to: b.customer_email,
    subject: `Plačilo rezervacije — Perešuti (${b.booking_date})`,
    html: emailLayout(`
      ${h1('Plačilo rezervacije')}
      <p>Za vašo rezervacijo dne <strong>${esc(formatDateSl(b.booking_date))}</strong> je za plačilo še <strong>${eur(due)}</strong>.
      Plačilo lahko opravite varno s kartico prek spodnje povezave.</p>
      ${emailButton(appUrl(`/api/placilo/${b.id}`), `Plačaj ${eur(due)} →`)}
      ${customerSummaryHtml(b)}`),
  })
}

/** Po plačilu ostanka. */
export async function sendCustomerBalancePaid(b: Booking, amount: number) {
  await sendEmail({
    to: b.customer_email,
    subject: `Plačilo prejeto — Perešuti (${b.booking_date})`,
    html: emailLayout(`
      ${h1('Hvala, plačilo smo prejeli')}
      <p>Prejeli smo vaše plačilo <strong>${eur(amount)}</strong> za rezervacijo dne <strong>${esc(formatDateSl(b.booking_date))}</strong>.</p>
      ${customerSummaryHtml(b)}
      <p>Se vidimo!</p>`),
  })
}

/** Žar mojster na pogojno prost dan: povpraševanje prejeto / potrjeno / zavrnjeno. */
export async function sendCustomerZarStatusEmail(b: Booking, kind: 'inquiry' | 'confirmed' | 'rejected') {
  const date = esc(formatDateSl(b.booking_date))
  if (kind === 'inquiry') {
    await sendEmail({
      to: b.customer_email,
      subject: `Povpraševanje prejeto — Perešuti (${b.booking_date})`,
      html: emailLayout(`
        ${h1('Prejeli smo vaše povpraševanje')}
        <p>Hvala za rezervacijo žar mojstra za <strong>${date}</strong>. Na ta dan imamo že več piknikov, zato vaš termin še <strong>ni potrjen</strong> — preverimo razpored in vam potrditev pošljemo v najkrajšem možnem času.</p>
        <p>Are za ta termin ne zaračunamo.</p>
        ${customerSummaryHtml(b)}`),
    })
  } else if (kind === 'confirmed') {
    await sendEmail({
      to: b.customer_email,
      subject: `Termin potrjen — Perešuti (${b.booking_date})`,
      html: emailLayout(`
        ${h1('Vaš termin je potrjen')}
        <p>Z veseljem potrjujemo žar mojstra za <strong>${date}</strong>${b.event_start_time ? ` (hrana pripravljena ob ${b.event_start_time.slice(0, 5)})` : ''}. Se vidimo!</p>
        ${customerSummaryHtml(b)}
        ${await infoFor(b)}`),
    })
  } else {
    await sendEmail({
      to: b.customer_email,
      subject: `Termin ni na voljo — Perešuti (${b.booking_date})`,
      html: emailLayout(`
        ${h1('Žal termin ni na voljo')}
        <p>Žal vam za <strong>${date}</strong> žar mojstra ne moremo zagotoviti, ker je razpored za ta dan že poln.
        Če vam ustreza drug datum, nam odgovorite na to sporočilo ali pokličite na ${PHONE}.</p>
        ${b.amount_paid > 0 ? `<p>Morebitno že plačano aro za žar mojstra vam vrnemo.</p>` : ''}`),
    })
  }
}

/** Preklic rezervacije: s strani lastnika ali samodejno (spletno plačilo ni bilo zaključeno). */
export async function sendCustomerCancelled(b: Booking, reason: 'admin' | 'expired') {
  const date = esc(formatDateSl(b.booking_date))
  const body =
    reason === 'expired'
      ? `<p>Vaša rezervacija za <strong>${date}</strong> ni bila zaključena, ker spletno plačilo ni bilo opravljeno, zato smo termin sprostili.</p>
         <p>Če želite termin še vedno rezervirati, to lahko storite znova — dokler je prost.</p>
         ${emailButton(appUrl('/'), 'Rezerviraj znova →')}`
      : `<p>Vaša rezervacija za <strong>${date}</strong> je preklicana.</p>
         ${b.amount_paid > 0 ? `<p>Glede vračila plačanega zneska (${eur(b.amount_paid)}) vas kontaktiramo oziroma nam odgovorite na to sporočilo.</p>` : ''}
         <p>Za vprašanja smo dosegljivi na ${PHONE}.</p>`
  await sendEmail({
    to: b.customer_email,
    subject: `Rezervacija preklicana — Perešuti (${b.booking_date})`,
    html: emailLayout(`${h1('Rezervacija preklicana')}${body}`),
  })
}
