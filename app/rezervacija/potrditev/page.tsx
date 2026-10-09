import Link from 'next/link'

const PHONE = '040 – 832 – 040'
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function PotrditevPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; booking?: string }>
}) {
  const { status, booking } = await searchParams
  const bookingId = booking && uuidRe.test(booking) ? booking : null

  const content: Record<string, { title: string; text: string }> = {
    success: {
      title: 'Plačilo uspešno!',
      text: 'Vaša rezervacija je potrjena. Na e-poštni naslov, ki ste ga navedli, prejmete potrdilo z vsemi podrobnostmi.',
    },
    paid: {
      title: 'Hvala, plačilo smo prejeli',
      text: 'Potrdilo o plačilu prejmete po e-pošti.',
    },
    cancelled: {
      title: 'Plačilo ni bilo zaključeno',
      text: 'Rezervacija čaka na plačilo še približno pol ure — nato se termin samodejno sprosti. Plačilo lahko poskusite znova spodaj.',
    },
    'payment-error': {
      title: 'Plačila ni bilo mogoče začeti',
      text: `Prišlo je do napake pri povezavi s plačilnim sistemom. Poskusite znova čez nekaj trenutkov ali nas pokličite na ${PHONE}.`,
    },
    expired: {
      title: 'Rezervacija ni več aktivna',
      text: `Ta rezervacija je bila preklicana ali se je termin sprostil, ker plačilo ni bilo zaključeno. Rezervirate lahko znova ali nas pokličete na ${PHONE}.`,
    },
    'not-found': {
      title: 'Rezervacije ne najdemo',
      text: `Povezava ni veljavna. Za pomoč nas pokličite na ${PHONE}.`,
    },
    sent: {
      title: 'Naročilnica poslana',
      text: 'Vašo naročilnico smo prejeli in kopijo poslali tudi na vaš e-poštni naslov. Oglasili se vam bomo v najkrajšem možnem času.',
    },
    inquiry: {
      title: 'Povpraševanje oddano',
      text: 'Na izbrani dan imamo že več piknikov, zato vaš termin še ni potrjen. Preverimo razpored in vam potrditev pošljemo po e-pošti v najkrajšem možnem času. Are ne zaračunamo.',
    },
    pending: {
      title: 'Rezervacija shranjena',
      text: 'Vaša rezervacija je zabeležena. Kmalu vas bomo kontaktirali glede plačila in potrditve.',
    },
  }
  const c = content[status ?? 'pending'] ?? { title: 'Rezervacija oddana', text: 'Hvala za vašo rezervacijo.' }
  const canRetry = bookingId && (status === 'cancelled' || status === 'payment-error')

  return (
    <div className="container-app py-20 text-center max-w-lg mx-auto">
      <h1 className="text-3xl mb-4">{c.title}</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>{c.text}</p>
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {canRetry && (
          // navadna povezava (ne <Link>), ker strežnik preusmeri na Stripe
          <a href={`/api/placilo/${bookingId}`} className="btn btn-primary">
            Poskusi s plačilom znova →
          </a>
        )}
        <Link href="/" className={`btn ${canRetry ? 'btn-secondary' : 'btn-primary'}`}>
          Nazaj na začetek
        </Link>
      </div>
    </div>
  )
}
