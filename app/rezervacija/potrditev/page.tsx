import Link from 'next/link'

export default async function PotrditevPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; booking?: string }>
}) {
  const { status } = await searchParams

  const content = {
    success: {
      title: 'Plačilo uspešno!',
      text: 'Vaša rezervacija je potrjena. Na email naslov, ki ste ga navedli, prejmete potrditev in vse podrobnosti.',
    },
    cancelled: {
      title: 'Plačilo ni bilo zaključeno',
      text: 'Rezervacija je shranjena kot čakajoča, vendar plačilo ni bilo dokončano. Lahko poskusite znova ali nas kontaktirate na 040 – 832 – 040.',
    },
    sent: {
      title: 'Naročilnica poslana',
      text: 'Vašo naročilnico smo prejeli in kopijo poslali tudi na vaš email. Oglasili se vam bomo v najkrajšem možnem času.',
    },
    pending: {
      title: 'Rezervacija shranjena',
      text: 'Vaša rezervacija je zabeležena kot čakajoča. Kmalu vas bomo kontaktirali glede plačila in potrditve.',
    },
  }[status ?? 'pending'] ?? {
    title: 'Rezervacija oddana',
    text: 'Hvala za vašo rezervacijo.',
  }

  return (
    <div className="container-app py-20 text-center max-w-lg mx-auto">
      <h1 className="text-3xl mb-4">{content.title}</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>{content.text}</p>
      <Link href="/" className="btn btn-primary mt-8 inline-flex">
        Nazaj na začetek
      </Link>
    </div>
  )
}
