import type { Metadata } from 'next'
import { isAdmin } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminCalendar from '@/components/admin/AdminCalendar'

export const metadata: Metadata = {
  title: 'Koledar rezervacij | Perešuti',
  robots: { index: false, follow: false },
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ mesec?: string; rezervacija?: string }>
}) {
  const ok = await isAdmin()
  if (!ok) return <AdminLogin />
  const { mesec, rezervacija } = await searchParams
  return <AdminCalendar initialMonth={mesec} initialBookingId={rezervacija} />
}
