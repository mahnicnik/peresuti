import BookingWizard from '@/components/BookingWizard'

export default async function RezervacijaPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>
}) {
  const { tip } = await searchParams
  const normalized = tip === 'piknik' || tip === 'zar' || tip === 'oboje' ? tip : 'oboje'

  return <BookingWizard tip={normalized} />
}
