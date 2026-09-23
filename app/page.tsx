import Link from 'next/link'
import Image from 'next/image'
import Peresutko from '@/components/Peresutko'

export default function HomePage() {
  return (
    <div className="container-app py-12 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="tag mb-4">Rezervacije</span>
        <h1 className="text-3xl sm:text-4xl mt-3 mb-4">Piknik prostor & žar mojster</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Izberite, kaj vas zanima, izberite datum v koledarju in v nekaj korakih zaključite
          rezervacijo — vse na enem mestu.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
        <ChoiceCard
          href="/rezervacija?tip=piknik"
          title="Piknik prostor"
          desc="Pokrit prostor za do 100 gostov v Skaručni — igrala, igrišča, elektrika, voda, WC."
          image="/images/piknik-prostor.jpg"
          imageAlt="Pokrit piknik prostor v Skaručni"
        />
        <ChoiceCard
          href="/rezervacija?tip=zar"
          title="Žar mojster"
          desc="Naš žar mojster pripravi hrano na vaši zabavi, poroki ali team-buildingu — kjerkoli."
          image="/images/zar-mojster.jpg"
          imageAlt="Žar mojster Perešuti peče meso na žaru"
        />
        <ChoiceCard
          href="/rezervacija?tip=oboje"
          title="Piknik prostor + žar mojster"
          desc="Piknik prostor in žar mojster skupaj — s prihranki, ko oboje rezervirate naenkrat."
          image="/images/oboje.jpg"
          imageAlt="Priprava za piknik in žar dogodek"
          highlight
        />
      </div>

      <Peresutko />
    </div>
  )
}

function ChoiceCard({
  href,
  title,
  desc,
  image,
  imageAlt,
  highlight,
}: {
  href: string
  title: string
  desc: string
  image: string
  imageAlt: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden flex flex-col justify-end min-h-[300px] p-6 hover:-translate-y-0.5 transition-transform"
      style={{
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-card)',
        border: highlight ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
      }}
    >
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover scale-105 transition-transform duration-300 group-hover:scale-110"
        style={{ filter: 'blur(1.5px) saturate(0.95)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(36,26,18,0.12) 0%, rgba(36,26,18,0.55) 55%, rgba(36,26,18,0.9) 100%)',
        }}
      />
      <div className="relative z-10 flex flex-col gap-2">
        {highlight && (
          <span
            className="tag self-start mb-1"
            style={{ background: 'var(--color-accent)', color: '#fff8ef' }}
          >
            Prihranek
          </span>
        )}
        <h2 className="text-xl" style={{ fontFamily: 'var(--font-heading)', color: '#fff8ef' }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,248,239,0.88)' }}>
          {desc}
        </p>
        <span className="btn btn-primary self-start mt-2">Rezerviraj →</span>
      </div>
    </Link>
  )
}
