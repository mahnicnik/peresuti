import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, adminToken, checkPassword } from '@/lib/admin-auth'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { password?: string } | null
  const token = adminToken()
  if (!token) {
    return NextResponse.json({ error: 'Admin geslo (ADMIN_PASSWORD) ni nastavljeno.' }, { status: 501 })
  }
  // majhna zakasnitev otežuje ugibanje gesla
  await new Promise((r) => setTimeout(r, 400))
  if (!body?.password || !checkPassword(body.password)) {
    return NextResponse.json({ error: 'Napačno geslo.' }, { status: 401 })
  }
  ;(await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  ;(await cookies()).delete(ADMIN_COOKIE)
  return NextResponse.json({ ok: true })
}
