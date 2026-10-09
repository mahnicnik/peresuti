import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

// Preprosta prijava lastnika v admin koledar: geslo je v okoljski spremenljivki ADMIN_PASSWORD,
// v piškotku pa je samo HMAC (ne geslo). Ob menjavi gesla se vse obstoječe seje izničijo.
export const ADMIN_COOKIE = 'peresuti_admin'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 60 // 60 dni

export function adminToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  return createHmac('sha256', pw).update('peresuti-admin-v1').digest('hex')
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function checkPassword(password: string): boolean {
  const pw = process.env.ADMIN_PASSWORD
  return !!pw && safeEqual(password, pw)
}

export async function isAdmin(): Promise<boolean> {
  // cookies() vedno pokličemo najprej, da je stran /admin vedno dinamična (nikoli prerenderirana)
  const value = (await cookies()).get(ADMIN_COOKIE)?.value
  const token = adminToken()
  if (!token) return false
  return !!value && safeEqual(value, token)
}
